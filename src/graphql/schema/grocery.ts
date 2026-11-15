import { Field, InputType, Int, ObjectType, registerEnumType } from 'type-graphql'

// Values match GrocerId in src/libs/grocery
export enum Grocer {
  Kroger = 'kroger',
  Walmart = 'walmart',
  Instacart = 'instacart',
}

registerEnumType(Grocer, { name: 'Grocer' })

@ObjectType('GrocerStatus')
export class GrocerStatus {
  @Field(() => Grocer)
  grocer!: Grocer

  // The member has signed in to this grocer, for grocers that need it (Kroger)
  @Field(() => Boolean)
  connected!: boolean
}

@ObjectType('RememberedGrocer')
export class RememberedGrocer {
  @Field(() => Grocer)
  grocer!: Grocer

  @Field(() => String, { nullable: true })
  storeId?: string | null

  @Field(() => String, { nullable: true })
  storeName?: string | null

  @Field(() => String, { nullable: true })
  zip?: string | null
}

@ObjectType('GroceryHandoffOptions')
export class GroceryHandoffOptions {
  // False while the feature flag is off or no grocer has keys: the basket shows a placeholder
  @Field(() => Boolean)
  enabled!: boolean

  @Field(() => Boolean)
  signedIn!: boolean

  @Field(() => Boolean)
  hasPaidAccess!: boolean

  @Field(() => [GrocerStatus])
  grocers!: GrocerStatus[]

  @Field(() => RememberedGrocer, { nullable: true })
  remembered?: RememberedGrocer | null

  // The grocer to preselect before a zip is known: the remembered one, else Walmart
  @Field(() => Grocer, { nullable: true })
  defaultGrocer?: Grocer | null

  // Affiliate disclosure for the grocers listed. Empty when none pay us.
  @Field(() => String)
  disclosure!: string
}

@ObjectType('GroceryStore')
export class GroceryStoreResult {
  @Field(() => String)
  id!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  address!: string
}

@ObjectType('GroceryStoreSuggestion')
export class GroceryStoreSuggestion {
  // Kroger pickup when a store is nearby, otherwise Walmart. Never Instacart.
  @Field(() => Grocer, { nullable: true })
  defaultGrocer?: Grocer | null

  @Field(() => [GroceryStoreResult])
  krogerStores!: GroceryStoreResult[]
}

@InputType('BasketEntryInput')
export class BasketEntryInput {
  @Field(() => String)
  slug!: string

  @Field(() => String, { nullable: true })
  build?: string | null

  @Field(() => Int)
  servings!: number
}

@InputType('SendBasketInput')
export class SendBasketInput {
  @Field(() => Grocer)
  grocer!: Grocer

  @Field(() => String, { nullable: true })
  storeId?: string | null

  @Field(() => String, { nullable: true })
  storeName?: string | null

  @Field(() => String, { nullable: true })
  zip?: string | null

  @Field(() => [BasketEntryInput])
  entries!: BasketEntryInput[]

  @Field(() => Boolean)
  includePantry!: boolean

  // Item keys checked off, which the handoff leaves out
  @Field(() => [String])
  checked!: string[]
}

@ObjectType('HandoffLineResult')
export class HandoffLineResult {
  @Field(() => String)
  key!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  display!: string
}

@ObjectType('GroceryHandoff')
export class GroceryHandoff {
  @Field(() => Grocer)
  grocer!: Grocer

  @Field(() => String)
  url!: string

  @Field(() => Int)
  matchedCount!: number

  // Lines the grocer could not take, shown to the member
  @Field(() => [HandoffLineResult])
  unmatched!: HandoffLineResult[]
}
