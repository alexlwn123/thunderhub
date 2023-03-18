import * as Types from '../../types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type NostrEventMutationVariables = Types.Exact<{
  privateKey: Types.Scalars['String'];
}>;

export type NostrEventMutation = {
  __typename?: 'Mutation';
  generateNostrProfile: {
    __typename?: 'NostrGenerateProfile';
    profile: {
      __typename?: 'NostrEvent';
      kind: number;
      tags: Array<Array<string>>;
      content: string;
      created_at: number;
      pubkey: string;
      id: string;
      sig: string;
    };
    announcement: {
      __typename?: 'NostrEvent';
      kind: number;
      tags: Array<Array<string>>;
      content: string;
      created_at: number;
      pubkey: string;
      id: string;
      sig: string;
    };
  };
};

export const NostrEventDocument = gql`
  mutation NostrEvent($privateKey: String!) {
    generateNostrProfile(privateKey: $privateKey) {
      profile {
        kind
        tags
        content
        created_at
        pubkey
        id
        sig
      }
      announcement {
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
export type NostrEventMutationFn = Apollo.MutationFunction<
  NostrEventMutation,
  NostrEventMutationVariables
>;

/**
 * __useNostrEventMutation__
 *
 * To run a mutation, you first call `useNostrEventMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useNostrEventMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [nostrEventMutation, { data, loading, error }] = useNostrEventMutation({
 *   variables: {
 *      privateKey: // value for 'privateKey'
 *   },
 * });
 */
export function useNostrEventMutation(
  baseOptions?: Apollo.MutationHookOptions<
    NostrEventMutation,
    NostrEventMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<NostrEventMutation, NostrEventMutationVariables>(
    NostrEventDocument,
    options
  );
}
export type NostrEventMutationHookResult = ReturnType<
  typeof useNostrEventMutation
>;
export type NostrEventMutationResult =
  Apollo.MutationResult<NostrEventMutation>;
export type NostrEventMutationOptions = Apollo.BaseMutationOptions<
  NostrEventMutation,
  NostrEventMutationVariables
>;
