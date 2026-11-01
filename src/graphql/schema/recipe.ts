import { GraphQLScalarType, valueFromASTUntyped } from 'graphql'
import { Field, ObjectType, registerEnumType } from 'type-graphql'

// A recipe is a nested document that the shared Zod schema already validates, so it travels as
// JSON instead of being described a second time as GraphQL input types
export const JsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Any JSON value',
  serialize: (value: unknown): unknown => value,
  parseValue: (value: unknown): unknown => value,
  parseLiteral: (ast, variables): unknown =>
    valueFromASTUntyped(ast, variables),
})

export enum ImportRecipeStatus {
  Invalid = 'invalid',
  Created = 'created',
  Updated = 'updated',
  Unchanged = 'unchanged',
  Conflict = 'conflict',
}

registerEnumType(ImportRecipeStatus, {
  name: 'ImportRecipeStatus',
  description:
    'Invalid: fix the issues. Created: a new draft. Updated: an existing recipe was replaced. Unchanged: nothing differs. Conflict: the slug exists and overwrite was not requested.',
})

@ObjectType('RecipeImportIssue')
export class RecipeImportIssue {
  @Field(() => String, { description: 'Field path, e.g. nutrition[1].calories' })
  path!: string

  @Field(() => String)
  message!: string
}

@ObjectType('RecipeFieldChange')
export class RecipeFieldChange {
  @Field(() => String, { description: 'Field path, e.g. ingredients[2].raw' })
  path!: string

  @Field(() => JsonScalar, { nullable: true })
  before?: unknown

  @Field(() => JsonScalar, { nullable: true })
  after?: unknown
}

@ObjectType('ImportRecipeResult')
export class ImportRecipeResult {
  @Field(() => ImportRecipeStatus)
  status!: ImportRecipeStatus

  @Field(() => String, { nullable: true })
  slug?: string

  @Field(() => String, { nullable: true })
  id?: string

  @Field(() => [RecipeImportIssue])
  issues!: RecipeImportIssue[]

  @Field(() => [RecipeFieldChange])
  changes!: RecipeFieldChange[]
}
