import { Field, Float, ObjectType, registerEnumType } from 'type-graphql'

import { RecipeImportIssue } from './recipe'

export enum SaveBasketItemsStatus {
  Invalid = 'invalid',
  Checked = 'checked',
  Saved = 'saved',
}

registerEnumType(SaveBasketItemsStatus, {
  name: 'SaveBasketItemsStatus',
  description:
    'Invalid: fix the issues. Checked: a dry run, nothing written. Saved: the items were written.',
})

@ObjectType('BasketCostChange', {
  description: "A recipe or build whose cost per serving moves with the new prices",
})
export class BasketCostChange {
  @Field(() => String)
  slug!: string

  @Field(() => String, {
    nullable: true,
    description: "The build key, or null for the recipe's own lines",
  })
  build?: string

  @Field(() => Float)
  before!: number

  @Field(() => Float)
  after!: number
}

@ObjectType('SaveBasketItemsResult')
export class SaveBasketItemsResult {
  @Field(() => SaveBasketItemsStatus)
  status!: SaveBasketItemsStatus

  @Field(() => [String], { description: 'Keys of the items checked or saved' })
  keys!: string[]

  @Field(() => [RecipeImportIssue])
  issues!: RecipeImportIssue[]

  @Field(() => [BasketCostChange])
  costChanges!: BasketCostChange[]
}

