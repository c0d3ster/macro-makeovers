// A rule of the recipe book that the input breaks, as opposed to a failure of the database.
// importRecipe turns it into a field-level issue the person can fix.
export class RecipeRuleError extends Error {
  constructor(
    public readonly path: string,
    message: string
  ) {
    super(message)
    this.name = 'RecipeRuleError'
  }
}
