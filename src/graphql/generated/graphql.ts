
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
  JSON: { input: any; output: any; }
};

/** One row of the admin list, drafts included. Owner only. */
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

/** A stored recipe in import shape, for the editor. Owner only. */
export type EditableRecipe = {
  readonly __typename?: 'EditableRecipe';
  readonly id: Scalars['ID']['output'];
  /** The recipe in import shape */
  readonly recipe: Scalars['JSON']['output'];
  /** draft or published */
  readonly status: Scalars['String']['output'];
};

export type ImportRecipeResult = {
  readonly __typename?: 'ImportRecipeResult';
  readonly changes: ReadonlyArray<RecipeFieldChange>;
  readonly id?: Maybe<Scalars['String']['output']>;
  readonly issues: ReadonlyArray<RecipeImportIssue>;
  readonly slug?: Maybe<Scalars['String']['output']>;
  readonly status: ImportRecipeStatus;
};

/** Invalid: fix the issues. Created: a new draft. Updated: an existing recipe was replaced. Unchanged: nothing differs. Conflict: the slug exists and overwrite was not requested. */
export enum ImportRecipeStatus {
  Conflict = 'Conflict',
  Created = 'Created',
  Invalid = 'Invalid',
  Unchanged = 'Unchanged',
  Updated = 'Updated'
}

export type MacroSplit = {
  readonly __typename?: 'MacroSplit';
  readonly carbsG: Scalars['Float']['output'];
  readonly fatG: Scalars['Float']['output'];
  readonly proteinG: Scalars['Float']['output'];
};

export type Mutation = {
  readonly __typename?: 'Mutation';
  /** Validates a recipe and saves it as a draft. An existing slug is only replaced with overwrite. dryRun checks and diffs without writing. Owner only. */
  readonly importRecipe: ImportRecipeResult;
  /** Publishes or unpublishes a recipe. Owner only. */
  readonly setRecipeStatus: AdminRecipe;
  readonly submitContactForm: ContactSubmission;
  readonly updateUser: User;
};


export type MutationImportRecipeArgs = {
  dryRun?: Scalars['Boolean']['input'];
  overwrite?: Scalars['Boolean']['input'];
  recipe: Scalars['JSON']['input'];
  recipeId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationSetRecipeStatusArgs = {
  id: Scalars['ID']['input'];
  status: PublishStatus;
};


export type MutationSubmitContactFormArgs = {
  input: ContactFormInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};

export type NutritionBuild = {
  readonly __typename?: 'NutritionBuild';
  readonly calories: Scalars['Float']['output'];
  readonly carbsG: Scalars['Float']['output'];
  readonly fatG: Scalars['Float']['output'];
  readonly isDefault: Scalars['Boolean']['output'];
  /** makeover or traditional */
  readonly kind: Scalars['String']['output'];
  readonly label: Scalars['String']['output'];
  readonly proteinG: Scalars['Float']['output'];
};

/** Draft recipes are visible to the owner only. Published recipes are on the public site. */
export enum PublishStatus {
  Draft = 'Draft',
  Published = 'Published'
}

export type Query = {
  readonly __typename?: 'Query';
  /** Drafts and published recipes, newest edit first. Owner only. */
  readonly adminRecipes: ReadonlyArray<AdminRecipe>;
  /** A stored recipe in import shape for the editor. Owner only. */
  readonly editableRecipe?: Maybe<EditableRecipe>;
  /** Liveness check */
  readonly health: Scalars['Boolean']['output'];
  readonly me?: Maybe<User>;
  /** One published recipe, or null for an unknown or unpublished slug */
  readonly recipe?: Maybe<RecipeDetail>;
  /** Published base recipes for the grid, A to Z */
  readonly recipeCards: ReadonlyArray<RecipeCard>;
  /** Every published slug */
  readonly recipeSlugs: ReadonlyArray<Scalars['String']['output']>;
  /** Slugs of published recipes with an ingredient matching the search */
  readonly recipeSlugsByIngredient: ReadonlyArray<Scalars['String']['output']>;
  readonly user?: Maybe<User>;
};


export type QueryEditableRecipeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRecipeArgs = {
  slug: Scalars['String']['input'];
};


export type QueryRecipeSlugsByIngredientArgs = {
  search: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

/** What the grid shows for one published recipe */
export type RecipeCard = {
  readonly __typename?: 'RecipeCard';
  readonly calories: Scalars['Float']['output'];
  readonly carbsG: Scalars['Float']['output'];
  readonly costTier: Scalars['Int']['output'];
  readonly difficulty: Scalars['Int']['output'];
  readonly fatG: Scalars['Float']['output'];
  readonly imageUrl?: Maybe<Scalars['String']['output']>;
  /** The traditional version's macros, when the recipe has one */
  readonly original?: Maybe<MacroSplit>;
  readonly proteinG: Scalars['Float']['output'];
  readonly servings: Scalars['Int']['output'];
  readonly slug: Scalars['String']['output'];
  /** The summary's first sentence */
  readonly summary: Scalars['String']['output'];
  readonly tags: ReadonlyArray<Scalars['String']['output']>;
  readonly title: Scalars['String']['output'];
  readonly totalMinutes: Scalars['Int']['output'];
};

/** Everything the recipe page needs for one published recipe */
export type RecipeDetail = {
  readonly __typename?: 'RecipeDetail';
  /** Set when this recipe is a variant of another */
  readonly baseRecipe?: Maybe<RelatedRecipe>;
  readonly cookMinutes: Scalars['Int']['output'];
  readonly costTier: Scalars['Int']['output'];
  readonly difficulty: Scalars['Int']['output'];
  /** The makeover the page leads with */
  readonly featured: NutritionBuild;
  readonly id: Scalars['ID']['output'];
  readonly imageUrl?: Maybe<Scalars['String']['output']>;
  readonly ingredients: ReadonlyArray<RecipeIngredient>;
  readonly notes: ReadonlyArray<RecipeNote>;
  readonly nutrition: ReadonlyArray<NutritionBuild>;
  readonly nutritionAnalysis: ReadonlyArray<Scalars['String']['output']>;
  readonly nutritionIntro: ReadonlyArray<Scalars['String']['output']>;
  readonly prepMinutes: Scalars['Int']['output'];
  readonly servings: Scalars['Int']['output'];
  readonly slug: Scalars['String']['output'];
  readonly steps: ReadonlyArray<RecipeStep>;
  readonly summary: Scalars['String']['output'];
  readonly tags: ReadonlyArray<Scalars['String']['output']>;
  readonly title: Scalars['String']['output'];
  readonly totalMinutes: Scalars['Int']['output'];
  readonly variants: ReadonlyArray<RelatedRecipe>;
};

export type RecipeFieldChange = {
  readonly __typename?: 'RecipeFieldChange';
  readonly after?: Maybe<Scalars['JSON']['output']>;
  readonly before?: Maybe<Scalars['JSON']['output']>;
  /** Field path, e.g. ingredients[2].raw */
  readonly path: Scalars['String']['output'];
};

export type RecipeImportIssue = {
  readonly __typename?: 'RecipeImportIssue';
  readonly message: Scalars['String']['output'];
  /** Field path, e.g. nutrition[1].calories */
  readonly path: Scalars['String']['output'];
};

export type RecipeIngredient = {
  readonly __typename?: 'RecipeIngredient';
  readonly group?: Maybe<Scalars['String']['output']>;
  readonly raw: Scalars['String']['output'];
};

export type RecipeNote = {
  readonly __typename?: 'RecipeNote';
  readonly body: Scalars['String']['output'];
  readonly kind: Scalars['String']['output'];
};

export type RecipeStep = {
  readonly __typename?: 'RecipeStep';
  readonly body: Scalars['String']['output'];
  readonly durationMinutes?: Maybe<Scalars['Float']['output']>;
  /** prep or cook */
  readonly phase: Scalars['String']['output'];
};

export type RelatedRecipe = {
  readonly __typename?: 'RelatedRecipe';
  readonly slug: Scalars['String']['output'];
  readonly title: Scalars['String']['output'];
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

export type SubmitContactFormMutationVariables = Exact<{
  input: ContactFormInput;
}>;


export type SubmitContactFormMutation = { readonly __typename?: 'Mutation', readonly submitContactForm: { readonly __typename?: 'ContactSubmission', readonly id: string, readonly name: string, readonly email: string, readonly subject: string, readonly message: string, readonly submittedAt: string } };

export type UserDisplayFragment = { readonly __typename?: 'User', readonly id: string, readonly firstName?: string | null, readonly lastName?: string | null, readonly email: string };

export type ImportRecipeMutationVariables = Exact<{
  recipe: Scalars['JSON']['input'];
  overwrite: Scalars['Boolean']['input'];
  dryRun: Scalars['Boolean']['input'];
  recipeId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type ImportRecipeMutation = { readonly __typename?: 'Mutation', readonly importRecipe: { readonly __typename?: 'ImportRecipeResult', readonly status: ImportRecipeStatus, readonly slug?: string | null, readonly id?: string | null, readonly issues: ReadonlyArray<{ readonly __typename?: 'RecipeImportIssue', readonly path: string, readonly message: string }>, readonly changes: ReadonlyArray<{ readonly __typename?: 'RecipeFieldChange', readonly path: string, readonly before?: any | null, readonly after?: any | null }> } };

export type SetRecipeStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: PublishStatus;
}>;


export type SetRecipeStatusMutation = { readonly __typename?: 'Mutation', readonly setRecipeStatus: { readonly __typename?: 'AdminRecipe', readonly id: string, readonly slug: string, readonly status: string } };

export type RecipeCardsQueryVariables = Exact<{ [key: string]: never; }>;


export type RecipeCardsQuery = { readonly __typename?: 'Query', readonly recipeCards: ReadonlyArray<{ readonly __typename?: 'RecipeCard', readonly slug: string, readonly title: string, readonly summary: string, readonly imageUrl?: string | null, readonly servings: number, readonly totalMinutes: number, readonly costTier: number, readonly difficulty: number, readonly tags: ReadonlyArray<string>, readonly calories: number, readonly proteinG: number, readonly carbsG: number, readonly fatG: number, readonly original?: { readonly __typename?: 'MacroSplit', readonly proteinG: number, readonly carbsG: number, readonly fatG: number } | null }> };

export type RecipeQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type RecipeQuery = { readonly __typename?: 'Query', readonly recipe?: { readonly __typename?: 'RecipeDetail', readonly id: string, readonly slug: string, readonly title: string, readonly summary: string, readonly imageUrl?: string | null, readonly servings: number, readonly prepMinutes: number, readonly cookMinutes: number, readonly totalMinutes: number, readonly costTier: number, readonly difficulty: number, readonly tags: ReadonlyArray<string>, readonly nutritionIntro: ReadonlyArray<string>, readonly nutritionAnalysis: ReadonlyArray<string>, readonly nutrition: ReadonlyArray<{ readonly __typename?: 'NutritionBuild', readonly kind: string, readonly label: string, readonly isDefault: boolean, readonly calories: number, readonly proteinG: number, readonly carbsG: number, readonly fatG: number }>, readonly featured: { readonly __typename?: 'NutritionBuild', readonly kind: string, readonly label: string, readonly isDefault: boolean, readonly calories: number, readonly proteinG: number, readonly carbsG: number, readonly fatG: number }, readonly ingredients: ReadonlyArray<{ readonly __typename?: 'RecipeIngredient', readonly group?: string | null, readonly raw: string }>, readonly steps: ReadonlyArray<{ readonly __typename?: 'RecipeStep', readonly phase: string, readonly body: string, readonly durationMinutes?: number | null }>, readonly notes: ReadonlyArray<{ readonly __typename?: 'RecipeNote', readonly kind: string, readonly body: string }>, readonly baseRecipe?: { readonly __typename?: 'RelatedRecipe', readonly slug: string, readonly title: string } | null, readonly variants: ReadonlyArray<{ readonly __typename?: 'RelatedRecipe', readonly slug: string, readonly title: string }> } | null };

export type RecipeSlugsQueryVariables = Exact<{ [key: string]: never; }>;


export type RecipeSlugsQuery = { readonly __typename?: 'Query', readonly recipeSlugs: ReadonlyArray<string> };

export type RecipeSlugsByIngredientQueryVariables = Exact<{
  search: Scalars['String']['input'];
}>;


export type RecipeSlugsByIngredientQuery = { readonly __typename?: 'Query', readonly recipeSlugsByIngredient: ReadonlyArray<string> };

export type AdminRecipesQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminRecipesQuery = { readonly __typename?: 'Query', readonly adminRecipes: ReadonlyArray<{ readonly __typename?: 'AdminRecipe', readonly id: string, readonly slug: string, readonly title: string, readonly status: string, readonly updatedAt: string }> };

export type EditableRecipeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type EditableRecipeQuery = { readonly __typename?: 'Query', readonly editableRecipe?: { readonly __typename?: 'EditableRecipe', readonly id: string, readonly status: string, readonly recipe: any } | null };

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
export const RecipeCardsDocument = gql`
    query RecipeCards {
  recipeCards {
    slug
    title
    summary
    imageUrl
    servings
    totalMinutes
    costTier
    difficulty
    tags
    calories
    proteinG
    carbsG
    fatG
    original {
      proteinG
      carbsG
      fatG
    }
  }
}
    `;

/**
 * __useRecipeCardsQuery__
 *
 * To run a query within a React component, call `useRecipeCardsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecipeCardsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecipeCardsQuery({
 *   variables: {
 *   },
 * });
 */
export function useRecipeCardsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<RecipeCardsQuery, RecipeCardsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<RecipeCardsQuery, RecipeCardsQueryVariables>(RecipeCardsDocument, options);
      }
export function useRecipeCardsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<RecipeCardsQuery, RecipeCardsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<RecipeCardsQuery, RecipeCardsQueryVariables>(RecipeCardsDocument, options);
        }
export type RecipeCardsQueryHookResult = ReturnType<typeof useRecipeCardsQuery>;
export type RecipeCardsLazyQueryHookResult = ReturnType<typeof useRecipeCardsLazyQuery>;
export const RecipeDocument = gql`
    query Recipe($slug: String!) {
  recipe(slug: $slug) {
    id
    slug
    title
    summary
    imageUrl
    servings
    prepMinutes
    cookMinutes
    totalMinutes
    costTier
    difficulty
    tags
    nutrition {
      kind
      label
      isDefault
      calories
      proteinG
      carbsG
      fatG
    }
    featured {
      kind
      label
      isDefault
      calories
      proteinG
      carbsG
      fatG
    }
    ingredients {
      group
      raw
    }
    steps {
      phase
      body
      durationMinutes
    }
    nutritionIntro
    nutritionAnalysis
    notes {
      kind
      body
    }
    baseRecipe {
      slug
      title
    }
    variants {
      slug
      title
    }
  }
}
    `;

/**
 * __useRecipeQuery__
 *
 * To run a query within a React component, call `useRecipeQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecipeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecipeQuery({
 *   variables: {
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function useRecipeQuery(baseOptions: ApolloReactHooks.QueryHookOptions<RecipeQuery, RecipeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<RecipeQuery, RecipeQueryVariables>(RecipeDocument, options);
      }
export function useRecipeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<RecipeQuery, RecipeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<RecipeQuery, RecipeQueryVariables>(RecipeDocument, options);
        }
export type RecipeQueryHookResult = ReturnType<typeof useRecipeQuery>;
export type RecipeLazyQueryHookResult = ReturnType<typeof useRecipeLazyQuery>;
export const RecipeSlugsDocument = gql`
    query RecipeSlugs {
  recipeSlugs
}
    `;

/**
 * __useRecipeSlugsQuery__
 *
 * To run a query within a React component, call `useRecipeSlugsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecipeSlugsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecipeSlugsQuery({
 *   variables: {
 *   },
 * });
 */
export function useRecipeSlugsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<RecipeSlugsQuery, RecipeSlugsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<RecipeSlugsQuery, RecipeSlugsQueryVariables>(RecipeSlugsDocument, options);
      }
export function useRecipeSlugsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<RecipeSlugsQuery, RecipeSlugsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<RecipeSlugsQuery, RecipeSlugsQueryVariables>(RecipeSlugsDocument, options);
        }
export type RecipeSlugsQueryHookResult = ReturnType<typeof useRecipeSlugsQuery>;
export type RecipeSlugsLazyQueryHookResult = ReturnType<typeof useRecipeSlugsLazyQuery>;
export const RecipeSlugsByIngredientDocument = gql`
    query RecipeSlugsByIngredient($search: String!) {
  recipeSlugsByIngredient(search: $search)
}
    `;

/**
 * __useRecipeSlugsByIngredientQuery__
 *
 * To run a query within a React component, call `useRecipeSlugsByIngredientQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecipeSlugsByIngredientQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecipeSlugsByIngredientQuery({
 *   variables: {
 *      search: // value for 'search'
 *   },
 * });
 */
export function useRecipeSlugsByIngredientQuery(baseOptions: ApolloReactHooks.QueryHookOptions<RecipeSlugsByIngredientQuery, RecipeSlugsByIngredientQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<RecipeSlugsByIngredientQuery, RecipeSlugsByIngredientQueryVariables>(RecipeSlugsByIngredientDocument, options);
      }
export function useRecipeSlugsByIngredientLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<RecipeSlugsByIngredientQuery, RecipeSlugsByIngredientQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<RecipeSlugsByIngredientQuery, RecipeSlugsByIngredientQueryVariables>(RecipeSlugsByIngredientDocument, options);
        }
export type RecipeSlugsByIngredientQueryHookResult = ReturnType<typeof useRecipeSlugsByIngredientQuery>;
export type RecipeSlugsByIngredientLazyQueryHookResult = ReturnType<typeof useRecipeSlugsByIngredientLazyQuery>;
export const AdminRecipesDocument = gql`
    query AdminRecipes {
  adminRecipes {
    id
    slug
    title
    status
    updatedAt
  }
}
    `;

/**
 * __useAdminRecipesQuery__
 *
 * To run a query within a React component, call `useAdminRecipesQuery` and pass it any options that fit your needs.
 * When your component renders, `useAdminRecipesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAdminRecipesQuery({
 *   variables: {
 *   },
 * });
 */
export function useAdminRecipesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<AdminRecipesQuery, AdminRecipesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<AdminRecipesQuery, AdminRecipesQueryVariables>(AdminRecipesDocument, options);
      }
export function useAdminRecipesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<AdminRecipesQuery, AdminRecipesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<AdminRecipesQuery, AdminRecipesQueryVariables>(AdminRecipesDocument, options);
        }
export type AdminRecipesQueryHookResult = ReturnType<typeof useAdminRecipesQuery>;
export type AdminRecipesLazyQueryHookResult = ReturnType<typeof useAdminRecipesLazyQuery>;
export const EditableRecipeDocument = gql`
    query EditableRecipe($id: ID!) {
  editableRecipe(id: $id) {
    id
    status
    recipe
  }
}
    `;

/**
 * __useEditableRecipeQuery__
 *
 * To run a query within a React component, call `useEditableRecipeQuery` and pass it any options that fit your needs.
 * When your component renders, `useEditableRecipeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEditableRecipeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useEditableRecipeQuery(baseOptions: ApolloReactHooks.QueryHookOptions<EditableRecipeQuery, EditableRecipeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<EditableRecipeQuery, EditableRecipeQueryVariables>(EditableRecipeDocument, options);
      }
export function useEditableRecipeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<EditableRecipeQuery, EditableRecipeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<EditableRecipeQuery, EditableRecipeQueryVariables>(EditableRecipeDocument, options);
        }
export type EditableRecipeQueryHookResult = ReturnType<typeof useEditableRecipeQuery>;
export type EditableRecipeLazyQueryHookResult = ReturnType<typeof useEditableRecipeLazyQuery>;
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