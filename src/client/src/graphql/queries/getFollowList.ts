import { gql } from '@apollo/client';

export const GET_FOLLOW_LIST = gql`
  query FollowList($myPubkey: String!) {
    getFollowList(myPubkey: $myPubkey) {
      following {
        kind
        tags
        content
        created_at
        pubkey
        id
        sig
      }
    }
  }
`;
