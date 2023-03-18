import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Keys {
  @Field()
  pubkey: string;

  @Field()
  privkey: string;
}

@ObjectType()
export class Relays {
  @Field(() => [String])
  urls: Array<string>;
}

@ObjectType()
export class Event {
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
