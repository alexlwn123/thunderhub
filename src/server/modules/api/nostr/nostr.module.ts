import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { LndModule } from '../../node/lnd/lnd.module';
import { EventResolver, KeysResolver, RelaysResolver } from './nostr.resolver';
import { NostrService } from './nostr.service';

@Module({
  imports: [AccountsModule, LndModule],
  providers: [KeysResolver, RelaysResolver, NostrService, EventResolver],
})
export class NostrModule {}
