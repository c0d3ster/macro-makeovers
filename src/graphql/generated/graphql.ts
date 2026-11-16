
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
  /** Any JSON value */
  JSON: { input: any; output: any; }
};

/** A recipe as the admin list shows it, drafts included. Owner only. */
export type AdminRecipe = {
  readonly __typename?: 'AdminRecipe';
  readonly id: Scalars['ID']['output'];
  readonly slug: Scalars['String']['output'];
  /** draft or published */
  readonly status: Scalars['String']['output'];
  readonly title: Scalars['String']['output'];
  /** ISO timestamp of the last edit */
  readonly updatedAt: Scalars['String']['output'];
};

/** A build's cost per serving from its basket lines, prorated by what it uses, spices included */
export type BasketBuildPrice = {
  readonly __typename?: 'BasketBuildPrice';
  readonly build: Scalars['String']['output'];
  readonly perServing: Scalars['Float']['output'];
  /** The tier the recipe or build says it is */
  readonly statedTier: Scalars['Int']['output'];
  /** The $ tier that cost lands in, 1 to 5 */
  readonly tier: Scalars['Int']['output'];
};

/** A recipe or build whose cost per serving moves with the new prices */
export type BasketCostChange = {
  readonly __typename?: 'BasketCostChange';
  readonly after: Scalars['Float']['output'];
  readonly before: Scalars['Float']['output'];
  /** The build key, or null for the recipe's own lines */
  readonly build?: Maybe<Scalars['String']['output']>;
  readonly slug: Scalars['String']['output'];
};

export type BasketEntryInput = {
  readonly build?: InputMaybe<Scalars['String']['input']>;
  readonly servings: Scalars['Int']['input'];
  readonly slug: Scalars['String']['input'];
};

export type ContactFormInput = {
  readonly details?: InputMaybe<Scalars['String']['input']>;
  readonly dish: Scalars['String']['input'];
  readonly email: Scalars['String']['input'];
  readonly name: Scalars['String']['input'];
  readonly recipeUrl?: InputMaybe<Scalars['String']['input']>;
};

export type ContactSubmission = {
  readonly __typename?: 'ContactSubmission';
  readonly details?: Maybe<Scalars['String']['output']>;
  readonly dish: Scalars['String']['output'];
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
  readonly recipeUrl?: Maybe<Scalars['String']['output']>;
  readonly submittedAt: Scalars['String']['output'];
};

/** An email list sign-up. The source fields come from the visitor cookie. */
export type EmailSubscribeInput = {
  readonly campaign?: InputMaybe<Scalars['String']['input']>;
  readonly email: Scalars['String']['input'];
  readonly medium?: InputMaybe<Scalars['String']['input']>;
  /** The page the form was on */
  readonly path?: InputMaybe<Scalars['String']['input']>;
  readonly source?: InputMaybe<Scalars['String']['input']>;
  /** Honeypot. People leave it empty; bots fill it in. */
  readonly website?: InputMaybe<Scalars['String']['input']>;
};

export enum Grocer {
  Instacart = 'Instacart',
  Kroger = 'Kroger',
  Walmart = 'Walmart'
}

export type GrocerStatus = {
  readonly __typename?: 'GrocerStatus';
  readonly connected: Scalars['Boolean']['output'];
  readonly grocer: Grocer;
};

export type GroceryHandoff = {
  readonly __typename?: 'GroceryHandoff';
  readonly grocer: Grocer;
  readonly matchedCount: Scalars['Int']['output'];
  readonly unmatched: ReadonlyArray<HandoffLineResult>;
  readonly url: Scalars['String']['output'];
};

export type GroceryHandoffOptions = {
  readonly __typename?: 'GroceryHandoffOptions';
  readonly defaultGrocer?: Maybe<Grocer>;
  readonly disclosure: Scalars['String']['output'];
  readonly enabled: Scalars['Boolean']['output'];
  readonly grocers: ReadonlyArray<GrocerStatus>;
  readonly hasPaidAccess: Scalars['Boolean']['output'];
  readonly remembered?: Maybe<RememberedGrocer>;
  readonly signedIn: Scalars['Boolean']['output'];
};

export type GroceryStore = {
  readonly __typename?: 'GroceryStore';
  readonly address: Scalars['String']['output'];
  readonly id: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
};

export type GroceryStoreSuggestion = {
  readonly __typename?: 'GroceryStoreSuggestion';
  readonly defaultGrocer?: Maybe<Grocer>;
  readonly krogerStores: ReadonlyArray<GroceryStore>;
};

export type HandoffLineResult = {
  readonly __typename?: 'HandoffLineResult';
  readonly display: Scalars['String']['output'];
  readonly key: Scalars['String']['output'];
  readonly name: Scalars['String']['output'];
};

export type ImportRecipeResult = {
  readonly __typename?: 'ImportRecipeResult';
  /** Cost per serving for each build, when the recipe has basketLines */
  readonly basketPrices: ReadonlyArray<BasketBuildPrice>;
  readonly changes: ReadonlyArray<RecipeFieldChange>;
  readonly id?: Maybe<Scalars['String']['output']>;
  readonly issues: ReadonlyArray<RecipeImportIssue>;
  readonly slug?: Maybe<Scalars['String']['output']>;
  readonly status: ImportRecipeStatus;
  /** Worth a look, but not blocking, like a cost tier the prices disagree with */
  readonly warnings: ReadonlyArray<RecipeImportIssue>;
};

/** Invalid: fix the issues. Created: a new draft. Updated: an existing recipe was replaced. Unchanged: nothing differs. Conflict: the slug exists and overwrite was not requested. */
export enum ImportRecipeStatus {
  Conflict = 'Conflict',
  Created = 'Created',
  Invalid = 'Invalid',
  Unchanged = 'Unchanged',
  Updated = 'Updated'
}

export type Mutation = {
  readonly __typename?: 'Mutation';
  readonly bookDownloadUrl: Scalars['String']['output'];
  /** Confirms an address from its emailed link and sends the welcome email. False for an unknown or unsubscribed link. */
  readonly confirmEmailSubscription: Scalars['Boolean']['output'];
  /** Deletes a recipe with its revision history. Refused while other recipes are variants of it. Owner only. */
  readonly deleteRecipe: Scalars['ID']['output'];
  /** Validates a recipe and saves it as a draft. An existing slug is only replaced with overwrite. dryRun checks and diffs without writing. Owner only. */
  readonly importRecipe: ImportRecipeResult;
  readonly openBillingPortal: Scalars['String']['output'];
  /** Adds or replaces basket price items by key, and lists the recipe costs that move. dryRun checks without writing. Owner only. */
  readonly saveBasketItems: SaveBasketItemsResult;
  readonly sendBasketToGrocer: GroceryHandoff;
  /** Publishes or unpublishes a recipe. Owner only. */
  readonly setRecipeStatus: AdminRecipe;
  readonly startCheckout: Scalars['String']['output'];
  readonly submitContactForm: ContactSubmission;
  /** Adds an address to the email list as pending and sends the confirmation link. Always true for a valid address, so it never reveals who is on the list. */
  readonly subscribeToEmails: Scalars['Boolean']['output'];
  /** Takes an address off the email list. False for an unknown link. */
  readonly unsubscribeFromEmails: Scalars['Boolean']['output'];
  readonly updateUser: User;
};


export type MutationConfirmEmailSubscriptionArgs = {
  token: Scalars['String']['input'];
};


export type MutationDeleteRecipeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationImportRecipeArgs = {
  dryRun?: Scalars['Boolean']['input'];
  overwrite?: Scalars['Boolean']['input'];
  recipe: Scalars['JSON']['input'];
  recipeId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationSaveBasketItemsArgs = {
  dryRun?: Scalars['Boolean']['input'];
  items: Scalars['JSON']['input'];
};


export type MutationSendBasketToGrocerArgs = {
  input: SendBasketInput;
};


export type MutationSetRecipeStatusArgs = {
  id: Scalars['ID']['input'];
  status: PublishStatus;
};


export type MutationSubmitContactFormArgs = {
  input: ContactFormInput;
};


export type MutationSubscribeToEmailsArgs = {
  input: EmailSubscribeInput;
};


export type MutationUnsubscribeFromEmailsArgs = {
  token: Scalars['String']['input'];
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};

export type Plan = {
  readonly __typename?: 'Plan';
  readonly canManageBilling: Scalars['Boolean']['output'];
  readonly canSubscribe: Scalars['Boolean']['output'];
  readonly cancelAtPeriodEnd: Scalars['Boolean']['output'];
  readonly currentPeriodEnd?: Maybe<Scalars['String']['output']>;
  readonly hasPaidAccess: Scalars['Boolean']['output'];
  readonly source?: Maybe<Scalars['String']['output']>;
  readonly status?: Maybe<Scalars['String']['output']>;
};

/** Draft recipes are visible to the owner only. Published recipes are on the public site. */
export enum PublishStatus {
  Draft = 'Draft',
  Published = 'Published'
}

export type Query = {
  readonly __typename?: 'Query';
  /** The price book and the basket lines of every published recipe, as the basket math reads them */
  readonly basketCatalog: Scalars['JSON']['output'];
  /** Every basket price item with its sizes, price source, and date, in save shape. Owner only. */
  readonly basketItems: Scalars['JSON']['output'];
  readonly groceryHandoffOptions: GroceryHandoffOptions;
  readonly groceryStores: GroceryStoreSuggestion;
  /** Liveness check */
  readonly health: Scalars['Boolean']['output'];
  readonly me?: Maybe<User>;
  readonly myPlan?: Maybe<Plan>;
  /** A saved recipe in import shape by slug, drafts included. Null for an unknown slug. Owner only. */
  readonly recipeForImport?: Maybe<RecipeForImport>;
  readonly user?: Maybe<User>;
};


export type QueryGroceryStoresArgs = {
  zip: Scalars['String']['input'];
};


export type QueryRecipeForImportArgs = {
  slug: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type RecipeFieldChange = {
  readonly __typename?: 'RecipeFieldChange';
  readonly after?: Maybe<Scalars['JSON']['output']>;
  readonly before?: Maybe<Scalars['JSON']['output']>;
  /** Field path, e.g. ingredients[2].raw */
  readonly path: Scalars['String']['output'];
};

/** A saved recipe in import shape, ready to edit and send back to importRecipe. Owner only. */
export type RecipeForImport = {
  readonly __typename?: 'RecipeForImport';
  readonly id: Scalars['ID']['output'];
  /** The recipe in import shape */
  readonly recipe: Scalars['JSON']['output'];
  readonly slug: Scalars['String']['output'];
  /** draft or published */
  readonly status: Scalars['String']['output'];
  /** ISO timestamp of the last save. Read it again before importing to see whether someone edited it since. */
  readonly updatedAt: Scalars['String']['output'];
};

export type RecipeImportIssue = {
  readonly __typename?: 'RecipeImportIssue';
  readonly message: Scalars['String']['output'];
  /** Field path, e.g. nutrition[1].calories */
  readonly path: Scalars['String']['output'];
};

export type RememberedGrocer = {
  readonly __typename?: 'RememberedGrocer';
  readonly grocer: Grocer;
  readonly storeId?: Maybe<Scalars['String']['output']>;
  readonly storeName?: Maybe<Scalars['String']['output']>;
  readonly zip?: Maybe<Scalars['String']['output']>;
};

export type SaveBasketItemsResult = {
  readonly __typename?: 'SaveBasketItemsResult';
  readonly costChanges: ReadonlyArray<BasketCostChange>;
  readonly issues: ReadonlyArray<RecipeImportIssue>;
  /** Keys of the items checked or saved */
  readonly keys: ReadonlyArray<Scalars['String']['output']>;
  readonly status: SaveBasketItemsStatus;
};

/** Invalid: fix the issues. Checked: a dry run, nothing written. Saved: the items were written. */
export enum SaveBasketItemsStatus {
  Checked = 'Checked',
  Invalid = 'Invalid',
  Saved = 'Saved'
}

export type SendBasketInput = {
  readonly checked: ReadonlyArray<Scalars['String']['input']>;
  readonly entries: ReadonlyArray<BasketEntryInput>;
  readonly grocer: Grocer;
  readonly includePantry: Scalars['Boolean']['input'];
  readonly storeId?: InputMaybe<Scalars['String']['input']>;
  readonly storeName?: InputMaybe<Scalars['String']['input']>;
  readonly zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  readonly avatarUrl?: InputMaybe<Scalars['String']['input']>;
  readonly firstName?: InputMaybe<Scalars['String']['input']>;
  readonly lastName?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  readonly __typename?: 'User';
  readonly authId?: Maybe<Scalars['String']['output']>;
  readonly avatarUrl?: Maybe<Scalars['String']['output']>;
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

export type GetMyPlanQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyPlanQuery = { readonly __typename?: 'Query', readonly myPlan?: { readonly __typename?: 'Plan', readonly hasPaidAccess: boolean, readonly source?: string | null, readonly status?: string | null, readonly currentPeriodEnd?: string | null, readonly cancelAtPeriodEnd: boolean, readonly canSubscribe: boolean, readonly canManageBilling: boolean } | null };

export type StartCheckoutMutationVariables = Exact<{ [key: string]: never; }>;


export type StartCheckoutMutation = { readonly __typename?: 'Mutation', readonly startCheckout: string };

export type OpenBillingPortalMutationVariables = Exact<{ [key: string]: never; }>;


export type OpenBillingPortalMutation = { readonly __typename?: 'Mutation', readonly openBillingPortal: string };

export type BookDownloadUrlMutationVariables = Exact<{ [key: string]: never; }>;


export type BookDownloadUrlMutation = { readonly __typename?: 'Mutation', readonly bookDownloadUrl: string };

export type SubmitContactFormMutationVariables = Exact<{
  input: ContactFormInput;
}>;


export type SubmitContactFormMutation = { readonly __typename?: 'Mutation', readonly submitContactForm: { readonly __typename?: 'ContactSubmission', readonly id: string, readonly name: string, readonly email: string, readonly dish: string, readonly recipeUrl?: string | null, readonly details?: string | null, readonly submittedAt: string } };

export type SubscribeToEmailsMutationVariables = Exact<{
  input: EmailSubscribeInput;
}>;


export type SubscribeToEmailsMutation = { readonly __typename?: 'Mutation', readonly subscribeToEmails: boolean };

export type ConfirmEmailSubscriptionMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type ConfirmEmailSubscriptionMutation = { readonly __typename?: 'Mutation', readonly confirmEmailSubscription: boolean };

export type UnsubscribeFromEmailsMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type UnsubscribeFromEmailsMutation = { readonly __typename?: 'Mutation', readonly unsubscribeFromEmails: boolean };

export type UserDisplayFragment = { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string };

export type GroceryHandoffOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroceryHandoffOptionsQuery = { readonly __typename?: 'Query', readonly groceryHandoffOptions: { readonly __typename?: 'GroceryHandoffOptions', readonly enabled: boolean, readonly signedIn: boolean, readonly hasPaidAccess: boolean, readonly defaultGrocer?: Grocer | null, readonly disclosure: string, readonly grocers: ReadonlyArray<{ readonly __typename?: 'GrocerStatus', readonly grocer: Grocer, readonly connected: boolean }>, readonly remembered?: { readonly __typename?: 'RememberedGrocer', readonly grocer: Grocer, readonly storeId?: string | null, readonly storeName?: string | null, readonly zip?: string | null } | null } };

export type GroceryStoresQueryVariables = Exact<{
  zip: Scalars['String']['input'];
}>;


export type GroceryStoresQuery = { readonly __typename?: 'Query', readonly groceryStores: { readonly __typename?: 'GroceryStoreSuggestion', readonly defaultGrocer?: Grocer | null, readonly krogerStores: ReadonlyArray<{ readonly __typename?: 'GroceryStore', readonly id: string, readonly name: string, readonly address: string }> } };

export type SendBasketToGrocerMutationVariables = Exact<{
  input: SendBasketInput;
}>;


export type SendBasketToGrocerMutation = { readonly __typename?: 'Mutation', readonly sendBasketToGrocer: { readonly __typename?: 'GroceryHandoff', readonly grocer: Grocer, readonly url: string, readonly matchedCount: number, readonly unmatched: ReadonlyArray<{ readonly __typename?: 'HandoffLineResult', readonly key: string, readonly name: string, readonly display: string }> } };

export type ImportRecipeMutationVariables = Exact<{
  recipe: Scalars['JSON']['input'];
  overwrite: Scalars['Boolean']['input'];
  dryRun: Scalars['Boolean']['input'];
  recipeId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type ImportRecipeMutation = { readonly __typename?: 'Mutation', readonly importRecipe: { readonly __typename?: 'ImportRecipeResult', readonly status: ImportRecipeStatus, readonly slug?: string | null, readonly id?: string | null, readonly issues: ReadonlyArray<{ readonly __typename?: 'RecipeImportIssue', readonly path: string, readonly message: string }>, readonly changes: ReadonlyArray<{ readonly __typename?: 'RecipeFieldChange', readonly path: string, readonly before?: any | null, readonly after?: any | null }>, readonly basketPrices: ReadonlyArray<{ readonly __typename?: 'BasketBuildPrice', readonly build: string, readonly perServing: number, readonly tier: number, readonly statedTier: number }>, readonly warnings: ReadonlyArray<{ readonly __typename?: 'RecipeImportIssue', readonly path: string, readonly message: string }> } };

export type SetRecipeStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: PublishStatus;
}>;


export type SetRecipeStatusMutation = { readonly __typename?: 'Mutation', readonly setRecipeStatus: { readonly __typename?: 'AdminRecipe', readonly id: string, readonly slug: string, readonly status: string } };

export type DeleteRecipeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRecipeMutation = { readonly __typename?: 'Mutation', readonly deleteRecipe: string };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { readonly __typename?: 'Query', readonly me?: { readonly __typename?: 'User', readonly id: string, readonly authId?: string | null, readonly email: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly role?: UserRole | null, readonly avatarUrl?: string | null, readonly createdAt?: string | null, readonly updatedAt?: string | null } | null };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { readonly __typename?: 'Query', readonly user?: { readonly __typename?: 'User', readonly id: string, readonly authId?: string | null, readonly email: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly role?: UserRole | null, readonly avatarUrl?: string | null, readonly createdAt?: string | null, readonly updatedAt?: string | null } | null };

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
export const GetMyPlanDocument = gql`
    query GetMyPlan {
  myPlan {
    hasPaidAccess
    source
    status
    currentPeriodEnd
    cancelAtPeriodEnd
    canSubscribe
    canManageBilling
  }
}
    `;

/**
 * __useGetMyPlanQuery__
 *
 * To run a query within a React component, call `useGetMyPlanQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMyPlanQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMyPlanQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMyPlanQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMyPlanQuery, GetMyPlanQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMyPlanQuery, GetMyPlanQueryVariables>(GetMyPlanDocument, options);
      }
export function useGetMyPlanLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMyPlanQuery, GetMyPlanQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMyPlanQuery, GetMyPlanQueryVariables>(GetMyPlanDocument, options);
        }
export type GetMyPlanQueryHookResult = ReturnType<typeof useGetMyPlanQuery>;
export type GetMyPlanLazyQueryHookResult = ReturnType<typeof useGetMyPlanLazyQuery>;
export const StartCheckoutDocument = gql`
    mutation StartCheckout {
  startCheckout
}
    `;

/**
 * __useStartCheckoutMutation__
 *
 * To run a mutation, you first call `useStartCheckoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartCheckoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startCheckoutMutation, { data, loading, error }] = useStartCheckoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useStartCheckoutMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<StartCheckoutMutation, StartCheckoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<StartCheckoutMutation, StartCheckoutMutationVariables>(StartCheckoutDocument, options);
      }
export type StartCheckoutMutationHookResult = ReturnType<typeof useStartCheckoutMutation>;
export const OpenBillingPortalDocument = gql`
    mutation OpenBillingPortal {
  openBillingPortal
}
    `;

/**
 * __useOpenBillingPortalMutation__
 *
 * To run a mutation, you first call `useOpenBillingPortalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useOpenBillingPortalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [openBillingPortalMutation, { data, loading, error }] = useOpenBillingPortalMutation({
 *   variables: {
 *   },
 * });
 */
export function useOpenBillingPortalMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<OpenBillingPortalMutation, OpenBillingPortalMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<OpenBillingPortalMutation, OpenBillingPortalMutationVariables>(OpenBillingPortalDocument, options);
      }
export type OpenBillingPortalMutationHookResult = ReturnType<typeof useOpenBillingPortalMutation>;
export const BookDownloadUrlDocument = gql`
    mutation BookDownloadUrl {
  bookDownloadUrl
}
    `;

/**
 * __useBookDownloadUrlMutation__
 *
 * To run a mutation, you first call `useBookDownloadUrlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBookDownloadUrlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bookDownloadUrlMutation, { data, loading, error }] = useBookDownloadUrlMutation({
 *   variables: {
 *   },
 * });
 */
export function useBookDownloadUrlMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<BookDownloadUrlMutation, BookDownloadUrlMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<BookDownloadUrlMutation, BookDownloadUrlMutationVariables>(BookDownloadUrlDocument, options);
      }
export type BookDownloadUrlMutationHookResult = ReturnType<typeof useBookDownloadUrlMutation>;
export const SubmitContactFormDocument = gql`
    mutation SubmitContactForm($input: ContactFormInput!) {
  submitContactForm(input: $input) {
    id
    name
    email
    dish
    recipeUrl
    details
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
export const SubscribeToEmailsDocument = gql`
    mutation SubscribeToEmails($input: EmailSubscribeInput!) {
  subscribeToEmails(input: $input)
}
    `;

/**
 * __useSubscribeToEmailsMutation__
 *
 * To run a mutation, you first call `useSubscribeToEmailsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubscribeToEmailsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [subscribeToEmailsMutation, { data, loading, error }] = useSubscribeToEmailsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSubscribeToEmailsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SubscribeToEmailsMutation, SubscribeToEmailsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SubscribeToEmailsMutation, SubscribeToEmailsMutationVariables>(SubscribeToEmailsDocument, options);
      }
export type SubscribeToEmailsMutationHookResult = ReturnType<typeof useSubscribeToEmailsMutation>;
export const ConfirmEmailSubscriptionDocument = gql`
    mutation ConfirmEmailSubscription($token: String!) {
  confirmEmailSubscription(token: $token)
}
    `;

/**
 * __useConfirmEmailSubscriptionMutation__
 *
 * To run a mutation, you first call `useConfirmEmailSubscriptionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmEmailSubscriptionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmEmailSubscriptionMutation, { data, loading, error }] = useConfirmEmailSubscriptionMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useConfirmEmailSubscriptionMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ConfirmEmailSubscriptionMutation, ConfirmEmailSubscriptionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ConfirmEmailSubscriptionMutation, ConfirmEmailSubscriptionMutationVariables>(ConfirmEmailSubscriptionDocument, options);
      }
export type ConfirmEmailSubscriptionMutationHookResult = ReturnType<typeof useConfirmEmailSubscriptionMutation>;
export const UnsubscribeFromEmailsDocument = gql`
    mutation UnsubscribeFromEmails($token: String!) {
  unsubscribeFromEmails(token: $token)
}
    `;

/**
 * __useUnsubscribeFromEmailsMutation__
 *
 * To run a mutation, you first call `useUnsubscribeFromEmailsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnsubscribeFromEmailsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unsubscribeFromEmailsMutation, { data, loading, error }] = useUnsubscribeFromEmailsMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useUnsubscribeFromEmailsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UnsubscribeFromEmailsMutation, UnsubscribeFromEmailsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UnsubscribeFromEmailsMutation, UnsubscribeFromEmailsMutationVariables>(UnsubscribeFromEmailsDocument, options);
      }
export type UnsubscribeFromEmailsMutationHookResult = ReturnType<typeof useUnsubscribeFromEmailsMutation>;
export const GroceryHandoffOptionsDocument = gql`
    query GroceryHandoffOptions {
  groceryHandoffOptions {
    enabled
    signedIn
    hasPaidAccess
    grocers {
      grocer
      connected
    }
    remembered {
      grocer
      storeId
      storeName
      zip
    }
    defaultGrocer
    disclosure
  }
}
    `;

/**
 * __useGroceryHandoffOptionsQuery__
 *
 * To run a query within a React component, call `useGroceryHandoffOptionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGroceryHandoffOptionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGroceryHandoffOptionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGroceryHandoffOptionsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GroceryHandoffOptionsQuery, GroceryHandoffOptionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GroceryHandoffOptionsQuery, GroceryHandoffOptionsQueryVariables>(GroceryHandoffOptionsDocument, options);
      }
export function useGroceryHandoffOptionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GroceryHandoffOptionsQuery, GroceryHandoffOptionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GroceryHandoffOptionsQuery, GroceryHandoffOptionsQueryVariables>(GroceryHandoffOptionsDocument, options);
        }
export type GroceryHandoffOptionsQueryHookResult = ReturnType<typeof useGroceryHandoffOptionsQuery>;
export type GroceryHandoffOptionsLazyQueryHookResult = ReturnType<typeof useGroceryHandoffOptionsLazyQuery>;
export const GroceryStoresDocument = gql`
    query GroceryStores($zip: String!) {
  groceryStores(zip: $zip) {
    defaultGrocer
    krogerStores {
      id
      name
      address
    }
  }
}
    `;

/**
 * __useGroceryStoresQuery__
 *
 * To run a query within a React component, call `useGroceryStoresQuery` and pass it any options that fit your needs.
 * When your component renders, `useGroceryStoresQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGroceryStoresQuery({
 *   variables: {
 *      zip: // value for 'zip'
 *   },
 * });
 */
export function useGroceryStoresQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GroceryStoresQuery, GroceryStoresQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GroceryStoresQuery, GroceryStoresQueryVariables>(GroceryStoresDocument, options);
      }
export function useGroceryStoresLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GroceryStoresQuery, GroceryStoresQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GroceryStoresQuery, GroceryStoresQueryVariables>(GroceryStoresDocument, options);
        }
export type GroceryStoresQueryHookResult = ReturnType<typeof useGroceryStoresQuery>;
export type GroceryStoresLazyQueryHookResult = ReturnType<typeof useGroceryStoresLazyQuery>;
export const SendBasketToGrocerDocument = gql`
    mutation SendBasketToGrocer($input: SendBasketInput!) {
  sendBasketToGrocer(input: $input) {
    grocer
    url
    matchedCount
    unmatched {
      key
      name
      display
    }
  }
}
    `;

/**
 * __useSendBasketToGrocerMutation__
 *
 * To run a mutation, you first call `useSendBasketToGrocerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendBasketToGrocerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendBasketToGrocerMutation, { data, loading, error }] = useSendBasketToGrocerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSendBasketToGrocerMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendBasketToGrocerMutation, SendBasketToGrocerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SendBasketToGrocerMutation, SendBasketToGrocerMutationVariables>(SendBasketToGrocerDocument, options);
      }
export type SendBasketToGrocerMutationHookResult = ReturnType<typeof useSendBasketToGrocerMutation>;
export const ImportRecipeDocument = gql`
    mutation ImportRecipe($recipe: JSON!, $overwrite: Boolean!, $dryRun: Boolean!, $recipeId: ID) {
  importRecipe(
    recipe: $recipe
    overwrite: $overwrite
    dryRun: $dryRun
    recipeId: $recipeId
  ) {
    status
    slug
    id
    issues {
      path
      message
    }
    changes {
      path
      before
      after
    }
    basketPrices {
      build
      perServing
      tier
      statedTier
    }
    warnings {
      path
      message
    }
  }
}
    `;

/**
 * __useImportRecipeMutation__
 *
 * To run a mutation, you first call `useImportRecipeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useImportRecipeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [importRecipeMutation, { data, loading, error }] = useImportRecipeMutation({
 *   variables: {
 *      recipe: // value for 'recipe'
 *      overwrite: // value for 'overwrite'
 *      dryRun: // value for 'dryRun'
 *      recipeId: // value for 'recipeId'
 *   },
 * });
 */
export function useImportRecipeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ImportRecipeMutation, ImportRecipeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ImportRecipeMutation, ImportRecipeMutationVariables>(ImportRecipeDocument, options);
      }
export type ImportRecipeMutationHookResult = ReturnType<typeof useImportRecipeMutation>;
export const SetRecipeStatusDocument = gql`
    mutation SetRecipeStatus($id: ID!, $status: PublishStatus!) {
  setRecipeStatus(id: $id, status: $status) {
    id
    slug
    status
  }
}
    `;

/**
 * __useSetRecipeStatusMutation__
 *
 * To run a mutation, you first call `useSetRecipeStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetRecipeStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setRecipeStatusMutation, { data, loading, error }] = useSetRecipeStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useSetRecipeStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SetRecipeStatusMutation, SetRecipeStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SetRecipeStatusMutation, SetRecipeStatusMutationVariables>(SetRecipeStatusDocument, options);
      }
export type SetRecipeStatusMutationHookResult = ReturnType<typeof useSetRecipeStatusMutation>;
export const DeleteRecipeDocument = gql`
    mutation DeleteRecipe($id: ID!) {
  deleteRecipe(id: $id)
}
    `;

/**
 * __useDeleteRecipeMutation__
 *
 * To run a mutation, you first call `useDeleteRecipeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteRecipeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteRecipeMutation, { data, loading, error }] = useDeleteRecipeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteRecipeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteRecipeMutation, DeleteRecipeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteRecipeMutation, DeleteRecipeMutationVariables>(DeleteRecipeDocument, options);
      }
export type DeleteRecipeMutationHookResult = ReturnType<typeof useDeleteRecipeMutation>;
export const GetMeDocument = gql`
    query GetMe {
  me {
    id
    authId
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
    authId
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