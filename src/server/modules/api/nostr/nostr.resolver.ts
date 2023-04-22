import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { NostrService } from './nostr.service';
import {
  FollowList,
  FollowPeers,
  NostrEvent,
  NostrFeed,
  ProfileAnnouncement,
  NostrKeys,
  NostrProfile,
  NostrRelays,
} from './nostr.types';

@Resolver(() => NostrKeys)
export class KeysResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => NostrKeys, { name: 'getNostrKeys' })
  async getNostrKeys(@CurrentUser() { id }: UserId) {
    const key = this.nostrService.generatePrivateKey(id);
    const pub = this.nostrService.getPublicKey(key, id);
    return { pubkey: pub, privkey: key };
  }
}

@Resolver(() => NostrRelays)
export class RelaysResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => NostrRelays, { name: 'getNostrRelays' })
  async getNostrRelays() {
    const relays = this.nostrService.getRelays();
    return { urls: relays };
  }
}

@Resolver(() => ProfileAnnouncement)
export class EventResolver {
  constructor(private nostrService: NostrService) {}

  @Mutation(() => ProfileAnnouncement, { name: 'publishNostrProfile' })
  async publishNostrProfile(
    @CurrentUser() { id }: UserId,
    @Args('privateKey') privateKey: string
  ) {
    const profile = await this.nostrService.publishProfile(privateKey, id);
    console.log('PROFILE', profile);
    return profile;
  }
}

@Resolver(() => FollowPeers)
export class FollowResolver {
  constructor(private nostrService: NostrService) {}

  @Mutation(() => FollowPeers, { nullable: true })
  async followPeers(
    @CurrentUser() { id }: UserId,
    @Args('privateKey') privateKey: string
  ) {
    const peers = await this.nostrService.addPeersToFollowList(privateKey, id);
    return peers;
  }
}

@Resolver(() => FollowList)
export class FollowListResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => FollowList)
  async getFollowList(@Args('myPubkey') myPubkey: string) {
    const list = await this.nostrService.getFollowingList(myPubkey);
    return list;
  }
}

@Resolver(() => NostrProfile)
export class NostrProfileResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => NostrProfile)
  async getNostrProfile(@Args('pubkey') pubkey: string) {
    const profile = await this.nostrService.getNostrProfile(pubkey);
    return profile;
  }
}

@Resolver(() => NostrFeed)
export class NostrFeedResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => NostrFeed, { name: 'getNostrFeed' })
  async getNostrFeed(@Args('myPubkey') myPubkey: string) {
    const feed = await this.nostrService.getNostrFeed(myPubkey);
    return feed;
  }
}

@Resolver(() => NostrEvent)
export class NostrEventResolver {
  constructor(private nostrService: NostrService) {}

  @Mutation(() => NostrEvent, { name: 'postNostrNote' })
  async postNostrNote(
    @Args('privateKey') privateKey: string,
    @Args('note') note: string
  ) {
    const post = await this.nostrService.postNostrNote(privateKey, note);
    return post;
  }
}
