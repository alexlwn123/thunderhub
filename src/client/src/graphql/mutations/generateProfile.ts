import { gql } from '@apollo/client';

export const GENERATE_PROFILE = gql`
  mutation Event($privateKey: String!) {
    generateProfile(privateKey: $privateKey) {
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
