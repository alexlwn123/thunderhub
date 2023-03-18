import 'websocket-polyfill';
import { Inject, Injectable } from '@nestjs/common';
import * as nostr from 'nostr-tools';
import { EventTemplate, Kind, Relay, UnsignedEvent, Event } from 'nostr-tools';
import { AccountsService } from '../../accounts/accounts.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { LndService } from '../../node/lnd/lnd.service';

@Injectable()
export class NostrService {
  relays = ['wss://nos.lol'];

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
    console.log('iamgeneratingprofile', privateKey, id);
    return new Promise(async (resolve, reject) => {
      const account = this.accountService.getAccount(id);
      if (!account) throw new Error('Node account not found.');

      // get the node info
      const node = await this.lndService.getWalletInfo(account);
      console.log('node id', node.public_key);
      // sign a message of the node pubkey
      const attestation = await this.lndService.signMessage(
        account,
        node.public_key
      );
      console.log('attestation', attestation);

      // Content of our lightning node
      const profileContent = {
        username: node.alias,
        about: 'Auntie LND',
      };

      // structure the lightning tags to tie a profile to a lightning node
      const lightningTag = {
        ip: node.public_key,
        s: attestation.signature,
      };

      // create kind 0 profile data
      const profile: EventTemplate = {
        kind: Kind.Metadata,
        tags: [['l', JSON.stringify(lightningTag)]],
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
      console.log('signed profile event', signedProfileEvent);
      // broadcast profile
      const createProfile = this.connectedRelays[0].publish(signedProfileEvent);
      console.log('Ihavebroadcasted', createProfile);
      createProfile.on('ok', () => {
        console.log(`Created account for node: ${node.public_key}`);
        resolve(signedProfileEvent);
      });

      createProfile.on('failed', () => {
        console.log(`FAILED :(`);
        reject('could not create profile. you fucking loser.');
      });
    });
  }
}
