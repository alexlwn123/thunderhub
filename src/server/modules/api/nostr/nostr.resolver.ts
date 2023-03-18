import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../security/security.decorators';
import { UserId } from '../../security/security.types';
import { NostrService } from './nostr.service';
import { Event, Keys, Relays } from './nostr.types';

@Resolver(() => Keys)
export class KeysResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => Keys, { name: 'getKeys' })
  async getKeys(@CurrentUser() { id }: UserId) {
    const key = this.nostrService.generatePrivateKey(id);
    const pub = this.nostrService.getPublicKey(key, id);
    return { pubkey: pub, privkey: key };
  }
}

@Resolver(() => Relays)
export class RelaysResolver {
  constructor(private nostrService: NostrService) {}

  @Query(() => Relays, { name: 'getRelays' })
  async getRelays() {
    const relays = this.nostrService.getRelays();
    return { urls: relays };
  }
}

@Resolver(() => Event)
export class EventResolver {
  constructor(private nostrService: NostrService) {}

  @Mutation(() => Event, { name: 'generateProfile' })
  async generateProfile(
    @CurrentUser() { id }: UserId,
    @Args('privateKey') privateKey: string
  ) {
    const profile = await this.nostrService.generateProfile(privateKey, id);
    return profile;
  }
}
