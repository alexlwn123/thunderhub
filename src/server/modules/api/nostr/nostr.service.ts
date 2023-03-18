import 'websocket-polyfill';
import { Inject, Injectable } from '@nestjs/common';
import * as nostr from 'nostr-tools';
import { EventTemplate, Kind, Relay, UnsignedEvent, Event } from 'nostr-tools';
import { AccountsService } from '../../accounts/accounts.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { LndService } from '../../node/lnd/lnd.service';
import { NostrNodeAttestation } from './nostr.types';

@Injectable()
export class NostrService {
  relays = ['wss://e.nos.lol'];

  connectedRelays: Relay[] = [];
  constructor(
    private accountService: AccountsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private lndService: LndService
  ) {
    this.connectToRelay();
  }
  async connectToRelay(): Promise<Relay> {
    return new Promise(async resolve => {
      const relay = nostr.relayInit(this.relays[0]);
      await relay.connect();
      relay.on('connect', () => {
        this.logger.info(`Connected to ${relay.url}`);
      });
      relay.on('error', e => {
        this.logger.error('No node ', e);
      });
      this.connectedRelays.push(relay);
      resolve(relay);
    });
  }

  getRelays(): string[] {
    const urls: string[] = [];
    this.connectedRelays.forEach(relay => urls.push(relay.url));
    return urls;
  }

  generatePrivateKey(id: string) {
    const account = this.accountService.getAccount(id);
    if (!account) throw new Error('Node account not found');
    return nostr.generatePrivateKey();
  }

  getPublicKey(privateKey: string, id: string) {
    const account = this.accountService.getAccount(id);
    if (!account) throw new Error('Node account not found');
    return nostr.getPublicKey(privateKey);
  }

  async generateProfile(privateKey: string, id: string) {
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
        pubkey: nostr.getPublicKey(privateKey),
      };

      // Create the signature
      const signedProfileEvent: Event = {
        ...unsignedProfileEvent,
        id: nostr.getEventHash(unsignedProfileEvent),
        sig: nostr.signEvent(unsignedProfileEvent, privateKey),
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

      const announcment = await this.createNodeAnnouncement(
        privateKey,
        attestation.signature,
        'regtest',
        node.public_key
      );
      if (!announcment) reject('could not make node announement');

      resolve({ profile: signedProfileEvent, announcement: announcment });
    });
  }

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
        pubkey: nostr.getPublicKey(privateKey),
      };

      const nodeAnnouncementEvent: Event = {
        ...nodeAnnouncementUnsigned,
        id: nostr.getEventHash(nodeAnnouncementUnsigned),
        sig: nostr.signEvent(nodeAnnouncementUnsigned, privateKey),
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
        resolve(null);
      });
    });
  }
}
