
import { gql } from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client/react';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type ContactFormInput = {
  readonly email: Scalars['String']['input'];
  readonly message: Scalars['String']['input'];
  readonly name: Scalars['String']['input'];
  readonly subject: Scalars['String']['input'];
};

export type ContactSubmission = {
  readonly __typename?: 'ContactSubmission';
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['String']['output'];
  readonly message: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
  readonly subject: Scalars['String']['output'];
  readonly submittedAt: Scalars['String']['output'];
};

export type Mutation = {
  readonly __typename?: 'Mutation';
  readonly submitContactForm: ContactSubmission;
  readonly updateUser: User;
};


export type MutationSubmitContactFormArgs = {
  input: ContactFormInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};

export type Query = {
  readonly __typename?: 'Query';
  /** Liveness check */
  readonly health: Scalars['Boolean']['output'];
  readonly me?: Maybe<User>;
  readonly user?: Maybe<User>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type UpdateUserInput = {
  readonly avatarUrl?: InputMaybe<Scalars['String']['input']>;
  readonly firstName?: InputMaybe<Scalars['String']['input']>;
  readonly lastName?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  readonly __typename?: 'User';
  readonly avatarUrl?: Maybe<Scalars['String']['output']>;
  readonly clerkId?: Maybe<Scalars['String']['output']>;
  readonly createdAt?: Maybe<Scalars['String']['output']>;
  readonly email: Scalars['String']['output'];
  readonly firstName?: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly lastName?: Maybe<Scalars['String']['output']>;
  readonly role?: Maybe<UserRole>;
  readonly updatedAt?: Maybe<Scalars['String']['output']>;
};

/** User role in the system */
export enum UserRole {
  Admin = 'Admin',
  Client = 'Client',
  Developer = 'Developer',
  SuperAdmin = 'SuperAdmin'
}

export type SubmitContactFormMutationVariables = Exact<{
  input: ContactFormInput;
}>;


export type SubmitContactFormMutation = { readonly __typename?: 'Mutation', readonly submitContactForm: { readonly __typename?: 'ContactSubmission', readonly id: string, readonly name: string, readonly email: string, readonly subject: string, readonly message: string, readonly submittedAt: string } };

export type UserDisplayFragment = { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { readonly __typename?: 'Query', readonly me?: { readonly __typename?: 'User', readonly id: string, readonly clerkId?: string | null, readonly email: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly role?: UserRole | null, readonly avatarUrl?: string | null, readonly createdAt?: string | null, readonly updatedAt?: string | null } | null };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { readonly __typename?: 'Query', readonly user?: { readonly __typename?: 'User', readonly id: string, readonly clerkId?: string | null, readonly email: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly role?: UserRole | null, readonly avatarUrl?: string | null, readonly createdAt?: string | null, readonly updatedAt?: string | null } | null };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { readonly __typename?: 'Mutation', readonly updateUser: { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly avatarUrl?: string | null, readonly updatedAt?: string | null } };

export const UserDisplayFragmentDoc = gql`
    fragment UserDisplay on User {
  id
  firstName
  lastName
  email
}
    `;
export const SubmitContactFormDocument = gql`
    mutation SubmitContactForm($input: ContactFormInput!) {
  submitContactForm(input: $input) {
    id
    name
    email
    subject
    message
    submittedAt
  }
}
    `;

/**
 * __useSubmitContactFormMutation__
 *
 * To run a mutation, you first call `useSubmitContactFormMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitContactFormMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitContactFormMutation, { data, loading, error }] = useSubmitContactFormMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSubmitContactFormMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SubmitContactFormMutation, SubmitContactFormMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SubmitContactFormMutation, SubmitContactFormMutationVariables>(SubmitContactFormDocument, options);
      }
export type SubmitContactFormMutationHookResult = ReturnType<typeof useSubmitContactFormMutation>;
export const GetMeDocument = gql`
    query GetMe {
  me {
    id
    clerkId
    email
    firstName
    lastName
    role
    avatarUrl
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetMeQuery__
 *
 * To run a query within a React component, call `useGetMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
      }
export function useGetMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
export type GetMeQueryHookResult = ReturnType<typeof useGetMeQuery>;
export type GetMeLazyQueryHookResult = ReturnType<typeof useGetMeLazyQuery>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    id
    clerkId
    email
    firstName
    lastName
    role
    avatarUrl
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    firstName
    lastName
    avatarUrl
    updatedAt
  }
}
    `;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;