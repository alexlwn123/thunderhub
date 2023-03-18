import { gql } from '@apollo/client';

export const GET_RELAYS = gql`
  query Relays {
    getRelays {
      urls
    }
  }
`;
