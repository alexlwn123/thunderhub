import { Field, ObjectType } from '@nestjs/graphql';
// import { Kind } from 'nostr-tools';

@ObjectType()
export class NostrKeys {
  @Field()
  pubkey: string;

  @Field()
  privkey: string;
}

@ObjectType()
export class NostrRelays {
  @Field(() => [String])
  urls: Array<string>;
}

@ObjectType()
export class NostrEvent {
  @Field()
  kind: number;

  @Field(() => [[String]])
  tags: string[][];

  @Field()
  content: string;

  @Field()
  created_at: number;

  @Field()
  pubkey: string;

  @Field()
  id: string;

  @Field()
  sig: string;
}

@ObjectType()
export class NostrGenerateProfile {
  @Field(() => NostrEvent)
  profile: NostrEvent;

  @Field(() => NostrEvent)
  announcement: NostrEvent;
}

// declare interface NostrFilter {
//   ids?: string[]
//   kinds?: Kind[]
//   authors?: string[]
//   since?: number
//   until?: number
//   "#e"?: string[]
//   "#p"?: string[]
//   limit?: number
// }

export interface NostrNodeAttestation {
  ip: string;
  s: string;
  n: string;
}
