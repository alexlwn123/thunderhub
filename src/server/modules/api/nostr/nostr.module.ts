import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { LndModule } from '../../node/lnd/lnd.module';
import {
  EventResolver,
  KeysResolver,
  FollowResolver,
  RelaysResolver,
  FollowListResolver,
  NostrProfileResolver,
  NostrFeedResolver,
} from './nostr.resolver';
import { NostrService } from './nostr.service';

@Module({
  imports: [AccountsModule, LndModule],
  providers: [
    KeysResolver,
    RelaysResolver,
    NostrService,
    EventResolver,
    FollowResolver,
    FollowListResolver,
    NostrProfileResolver,
    NostrFeedResolver,
  ],
})
export class NostrModule {}
