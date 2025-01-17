import 'websocket-polyfill';
import { Inject, Injectable } from '@nestjs/common';
import {
  relayInit,
  signEvent,
  getEventHash,
  getPublicKey,
  generatePrivateKey,
} from 'nostr-tools';
import { EventTemplate, Kind, Relay, UnsignedEvent, Event } from 'nostr-tools';
import { AccountsService } from '../../accounts/accounts.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { LndService } from '../../node/lnd/lnd.service';
import { NostrNodeAttestation } from './nostr.types';

@Injectable()
export class NostrService {
  relays = ['wss://nostream.localtest.me'];

  connectedRelays: Relay[] = [];
  constructor(
    private accountService: AccountsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private lndService: LndService
  ) {
    this.connectToRelay();
  }
  async connectToRelay(): Promise<void> {
    const relay = relayInit(this.relays[0]);
    relay.on('connect', () => {
      this.logger.info(`Connected to ${relay.url}`);
    });
    relay.on('error', e => {
      this.logger.error('No node ', e);
    });
    await relay.connect().catch(e => {
      this.logger.error(`it broke ${e}`);
    });
    this.connectedRelays.push(relay);
  }

  getRelays(): string[] {
    const urls: string[] = [];
    this.connectedRelays.forEach(relay => urls.push(relay.url));
    return urls;
  }

  generatePrivateKey(id: string) {
    const account = this.accountService.getAccount(id);
    if (!account) throw new Error('Node account not found');
    return generatePrivateKey();
  }

  getPublicKey(privateKey: string, id: string) {
    const account = this.accountService.getAccount(id);
    if (!account) throw new Error('Node account not found');
    return getPublicKey(privateKey);
  }

  async publishProfile(privateKey: string, id: string) {
    return new Promise(async (resolve, reject) => {
      const account = this.accountService.getAccount(id);
      if (!account) throw new Error('Node account not found.');

      // get the node info
      const node = await this.lndService.getWalletInfo(account);

      // sign a message of the node pubkey
      const attestation = await this.lndService.signMessage(
        account,
        node.public_key
      );

      // Content of our lightning node
      const profileContent = {
        username: node.alias,
        about: 'Auntie LND',
      };

      // create kind 0 profile data
      const profile: EventTemplate = {
        kind: Kind.Metadata,
        tags: [],
        content: JSON.stringify(profileContent),
        created_at: Math.floor(Date.now() / 1000),
      };

      // Attach the pubkey
      const unsignedProfileEvent: UnsignedEvent = {
        ...profile,
        pubkey: getPublicKey(privateKey),
      };

      // Create the signature
      const signedProfileEvent: Event = {
        ...unsignedProfileEvent,
        id: getEventHash(unsignedProfileEvent),
        sig: signEvent(unsignedProfileEvent, privateKey),
      };

      // broadcast profile
      const createProfile = this.connectedRelays[0].publish(signedProfileEvent);

      createProfile.on('ok', () => {
        this.logger.info(`Created account for node: ${node.public_key}`);
      });

      createProfile.on('failed', e => {
        this.logger.error(
          `Failed to create account for ${node.public_key}: ${e}`
        );
        reject('could not create profile. you fucking loser.');
      });

      const announcement = await this.createNodeAnnouncement(
        privateKey,
        attestation.signature,
        'regtest',
        node.public_key
      );
      if (!announcement) reject('could not make node announcement');
      console.log(
        '== CREATED ACCOUNT ==',
        'Nostr Account',
        profile,
        'Node Announcement/Attestation',
        announcement
      );
      resolve({ profile: signedProfileEvent, announcement: announcement });
    });
  }

  /*
  NEED TO CHECK IF IP IS ALREADY IN
  */
  private async createNodeAnnouncement(
    privateKey,
    attestation,
    network,
    pubkey
  ) {
    return new Promise(resolve => {
      const nodeAttestation: NostrNodeAttestation = {
        ip: pubkey,
        s: attestation,
        n: network,
      };

      const nodeAnnouncement: EventTemplate = {
        kind: 80081,
        tags: [],
        content: JSON.stringify(nodeAttestation),
        created_at: Math.floor(Date.now() / 1000),
      };

      const nodeAnnouncementUnsigned: UnsignedEvent = {
        ...nodeAnnouncement,
        pubkey: getPublicKey(privateKey),
      };

      const nodeAnnouncementEvent: Event = {
        ...nodeAnnouncementUnsigned,
        id: getEventHash(nodeAnnouncementUnsigned),
        sig: signEvent(nodeAnnouncementUnsigned, privateKey),
      };

      const announceNode = this.connectedRelays[0].publish(
        nodeAnnouncementEvent
      );

      announceNode.on('ok', () => {
        this.logger.info(`Created node announcement event for ${pubkey}`);
        resolve(nodeAnnouncementEvent);
      });

      announceNode.on('failed', e => {
        this.logger.error('Could not announce node.', e);
        throw new Error('could not announce node');
      });
    });
  }

  async getValidatedNotes(id: string) {
    const account = this.accountService.getAccount(id);
    if (!account) throw new Error('Node account not found.');

    const validatedNodes = {};
    const notes = await this.connectedRelays[0].list([{ kinds: [80081] }]);
    for (const note of notes) {
      const attestation = <NostrNodeAttestation>JSON.parse(note.content);
      const valid = await this.lndService.verifyMessage(
        account,
        attestation.ip,
        attestation.s
      );
      const seen = validatedNodes[attestation.ip];
      if (!seen) {
        if (valid.signed_by === attestation.ip)
          validatedNodes[attestation.ip] = note.pubkey;
      }
    }
    console.log('== VALIDATED NODES ==', validatedNodes);
    return { nodes: validatedNodes };
  }

  async addPeersToFollowList(privateKey: string, id: string) {
    const account = this.accountService.getAccount(id);
    if (!account) throw new Error('Node account not found.');
    const pubkeysToFollow = [];
    const peers = await this.lndService.getPeers(account);
    const validNodes = await this.getValidatedNotes(id);
    const nodes = Object.entries(validNodes.nodes);
    peers.peers.forEach(peer => {
      const match = nodes.find(x => x[0] === peer.public_key) ?? [];
      if (match.length > 0) {
        // Add this guy as a new contact
        console.log('valid node', match);
        pubkeysToFollow.push(match[1]);
      }
    });

    console.log('== VALIDATED NODES TO FOLLOW ==', pubkeysToFollow);

    const follows = await this.followNostrAccounts(pubkeysToFollow, privateKey);

    return { peers: follows };
  }

  private async followNostrAccounts(
    pubkeyToFollow: string[],
    privateKey: string
  ) {
    return new Promise(resolve => {
      const publicKeys = [];
      pubkeyToFollow.forEach(pubkey => {
        publicKeys.push(['p', pubkey]);
      });
      const followContent: EventTemplate = {
        kind: Kind.Contacts,
        created_at: Math.floor(Date.now() / 1000),
        content: '',
        tags: publicKeys,
      };

      const unsignedFollow: UnsignedEvent = {
        ...followContent,
        pubkey: getPublicKey(privateKey),
      };

      const signedFollow: Event = {
        ...unsignedFollow,
        id: getEventHash(unsignedFollow),
        sig: signEvent(unsignedFollow, privateKey),
      };

      console.log('== ADDING CONTACT LIST EVENT ==', signedFollow);

      const follow = this.connectedRelays[0].publish(signedFollow);

      follow.on('ok', () => {
        this.logger.info(`Published following: ${pubkeyToFollow}`);
        resolve(signedFollow);
      });

      follow.on('failed', () => {
        this.logger.error(`Could not follow: ${pubkeyToFollow}`);
        resolve('Did not work.');
      });
    });
  }

  async getFollowingList(myPubkey: string) {
    const list = await this.connectedRelays[0].list([
      { kinds: [Kind.Contacts], authors: [myPubkey] },
    ]);
    const listOfPubkeys = [];
    if (list.length === 0) return { following: [] };
    const tags = list[0].tags;
    for (const tag of tags) {
      listOfPubkeys.push(tag[1]);
    }

    return { following: listOfPubkeys };
  }

  async getNostrProfile(pubkey: string) {
    const _profile = this.connectedRelays[0].list([
      { kinds: [Kind.Metadata], authors: [pubkey] },
    ]);
    const _attestation = this.connectedRelays[0].list([
      { kinds: [80081], authors: [pubkey] },
    ]);
    const [profile, attestation] = await Promise.all([_profile, _attestation]);
    if (profile.length === 0 || attestation.length === 0) return {};
    return { profile: profile[0], attestation: attestation[0] };
  }

  async getNostrFeed(myPubkey: string) {
    const followList = await this.getFollowingList(myPubkey);
    const feed = await this.connectedRelays[0].list([
      { kinds: [Kind.Text], authors: followList.following },
    ]);
    return { feed: feed };
  }

  async postNostrNote(privateKey: string, note: string) {
    return new Promise(resolve => {
      const noteObj: EventTemplate = {
        kind: Kind.Text,
        content: note,
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
      };

      const unsignedNote: UnsignedEvent = {
        ...noteObj,
        pubkey: getPublicKey(privateKey),
      };

      const signedNote: Event = {
        ...unsignedNote,
        id: getEventHash(unsignedNote),
        sig: signEvent(unsignedNote, privateKey),
      };

      const post = this.connectedRelays[0].publish(signedNote);
      post.on('ok', () => {
        this.logger.info(`Posted note: ${signedNote.id}`);
        resolve(signedNote);
      });
      post.on('failed', () => {
        this.logger.error(`Failed to post note: ${signedNote.id}`);
        resolve('Failed to post note.');
      });
    });
  }
}
