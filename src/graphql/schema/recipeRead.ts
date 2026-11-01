import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

import { JsonScalar } from './recipe'

export enum PublishStatus {
  Draft = 'draft',
  Published = 'published',
}

registerEnumType(PublishStatus, {
  name: 'PublishStatus',
  description:
    'Draft recipes are visible to the owner only. Published recipes are on the public site.',
})

// What the public site reads. These mirror the types in src/libs/recipes so the service can
// return them as they are. Kinds and statuses travel as plain strings.

@ObjectType('MacroSplit')
export class MacroSplit {
  @Field(() => Float)
  proteinG!: number

  @Field(() => Float)
  carbsG!: number

  @Field(() => Float)
  fatG!: number
}

@ObjectType('RecipeCard', {
  description: 'What the grid shows for one published recipe',
})
export class RecipeCard {
  @Field(() => String)
  slug!: string

  @Field(() => String)
  title!: string

  @Field(() => String, { description: "The summary's first sentence" })
  summary!: string

  @Field(() => String, { nullable: true })
  imageUrl?: string

  @Field(() => Int)
  servings!: number

  @Field(() => Int)
  totalMinutes!: number

  @Field(() => Int)
  costTier!: number

  @Field(() => Int)
  difficulty!: number

  @Field(() => [String])
  tags!: string[]

  @Field(() => Float)
  calories!: number

  @Field(() => Float)
  proteinG!: number

  @Field(() => Float)
  carbsG!: number

  @Field(() => Float)
  fatG!: number

  @Field(() => MacroSplit, {
    nullable: true,
    description: "The traditional version's macros, when the recipe has one",
  })
  original?: MacroSplit
}

@ObjectType('NutritionBuild')
export class NutritionBuild {
  @Field(() => String, { description: 'makeover or traditional' })
  kind!: string

  @Field(() => String)
  label!: string

  @Field(() => Boolean)
  isDefault!: boolean

  @Field(() => Float)
  calories!: number

  @Field(() => Float)
  proteinG!: number

  @Field(() => Float)
  carbsG!: number

  @Field(() => Float)
  fatG!: number
}

@ObjectType('RecipeIngredient')
export class RecipeIngredient {
  @Field(() => String, { nullable: true })
  group?: string

  @Field(() => String)
  raw!: string
}

@ObjectType('RecipeStep')
export class RecipeStep {
  @Field(() => String, { description: 'prep or cook' })
  phase!: string

  @Field(() => String)
  body!: string

  @Field(() => Float, { nullable: true })
  durationMinutes?: number
}

@ObjectType('RecipeNote')
export class RecipeNote {
  @Field(() => String)
  kind!: string

  @Field(() => String)
  body!: string
}

@ObjectType('RelatedRecipe')
export class RelatedRecipe {
  @Field(() => String)
  slug!: string

  @Field(() => String)
  title!: string
}

@ObjectType('RecipeDetail', {
  description: 'Everything the recipe page needs for one published recipe',
})
export class RecipeDetail {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  slug!: string

  @Field(() => String)
  title!: string

  @Field(() => String)
  summary!: string

  @Field(() => String, { nullable: true })
  imageUrl?: string

  @Field(() => Int)
  servings!: number

  @Field(() => Int)
  prepMinutes!: number

  @Field(() => Int)
  cookMinutes!: number

  @Field(() => Int)
  totalMinutes!: number

  @Field(() => Int)
  costTier!: number

  @Field(() => Int)
  difficulty!: number

  @Field(() => [String])
  tags!: string[]

  @Field(() => [NutritionBuild])
  nutrition!: NutritionBuild[]

  @Field(() => NutritionBuild, {
    description: 'The makeover the page leads with',
  })
  featured!: NutritionBuild

  @Field(() => [RecipeIngredient])
  ingredients!: RecipeIngredient[]

  @Field(() => [RecipeStep])
  steps!: RecipeStep[]

  @Field(() => [String])
  nutritionIntro!: string[]

  @Field(() => [String])
  nutritionAnalysis!: string[]

  @Field(() => [RecipeNote])
  notes!: RecipeNote[]

  @Field(() => RelatedRecipe, {
    nullable: true,
    description: 'Set when this recipe is a variant of another',
  })
  baseRecipe?: RelatedRecipe

  @Field(() => [RelatedRecipe])
  variants!: RelatedRecipe[]
}

@ObjectType('AdminRecipe', {
  description: 'One row of the admin list, drafts included. Owner only.',
})
export class AdminRecipe {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  slug!: string

  @Field(() => String)
  title!: string

  @Field(() => String, { description: 'draft or published' })
  status!: string

  @Field(() => String, { description: 'ISO timestamp of the last edit' })
  updatedAt!: string
}

@ObjectType('EditableRecipe', {
  description: 'A stored recipe in import shape, for the editor. Owner only.',
})
export class EditableRecipe {
  @Field(() => ID)
  id!: string

  @Field(() => String, { description: 'draft or published' })
  status!: string

  @Field(() => JsonScalar, { description: 'The recipe in import shape' })
  recipe!: unknown
}
