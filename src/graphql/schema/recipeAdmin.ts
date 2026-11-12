import { Field, ID, ObjectType, registerEnumType } from 'type-graphql'

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

@ObjectType('AdminRecipe', {
  description:
    'A recipe as the admin list shows it, drafts included. Owner only.',
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

@ObjectType('RecipeForImport', {
  description:
    'A saved recipe in import shape, ready to edit and send back to importRecipe. Owner only.',
})
export class RecipeForImport {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  slug!: string

  @Field(() => String, { description: 'draft or published' })
  status!: string

  @Field(() => String, {
    description:
      'ISO timestamp of the last save. Read it again before importing to see whether someone edited it since.',
  })
  updatedAt!: string

  @Field(() => JsonScalar, { description: 'The recipe in import shape' })
  recipe!: unknown
}
