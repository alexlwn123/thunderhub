import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { NostrService } from './nostr.service';
import {
  FollowList,
  FollowPeers,
  NostrGenerateProfile,
  NostrKeys,
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

@Resolver(() => NostrGenerateProfile)
export class EventResolver {
  constructor(private nostrService: NostrService) {}

  @Mutation(() => NostrGenerateProfile, { name: 'generateNostrProfile' })
  async generateNostrProfile(
    @CurrentUser() { id }: UserId,
    @Args('privateKey') privateKey: string
  ) {
    const profile = await this.nostrService.generateProfile(privateKey, id);
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
    console.log('PEERs', peers);
    return peers;
  }
}

@Resolver(() => FollowList)
export class FollowListResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => FollowList)
  async getFollowList(@Args('myPubkey') myPubkey: string) {
    const list = await this.nostrService.getFollowingList(myPubkey);
    console.log('list', list);
    return list;
  }
}
