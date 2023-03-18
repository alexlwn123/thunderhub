import { gql } from '@apollo/client';

export const GENERATE_NOSTR_PROFILE = gql`
  mutation NostrEvent($privateKey: String!) {
    generateNostrProfile(privateKey: $privateKey) {
      kind
      tags
      content
      created_at
      pubkey
      id
      sig
    }
  }
`;
