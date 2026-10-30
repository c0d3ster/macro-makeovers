export type RecipeIngredient = {
  group?: string
  raw: string
}

type IngredientGroup = {
  // Undefined for lines the recipe does not file under a heading
  name?: string
  ingredients: RecipeIngredient[]
}

const NUMBER = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+`

// A quantity at the very start of the line: "1 1/3", "1/2", "1.5", "3-4", "1/2 to 1", with an
// optional leading "~". The lookahead stops it from eating into things like "2%" or "3rd".
const LEADING_QUANTITY = new RegExp(
  String.raw`^(~?)(${NUMBER})(?:(\s*(?:[-–]|to)\s*)(${NUMBER}))?(?=[\sa-zA-Z]|$)`
)

const FRACTIONS: readonly (readonly [number, string])[] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [7 / 8, '7/8'],
]

const FRACTION_TOLERANCE = 0.02

const toNumber = (quantity: string): number => {
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(quantity)
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])

  const fraction = /^(\d+)\/(\d+)$/.exec(quantity)
  if (fraction) return Number(fraction[1]) / Number(fraction[2])

  return Number(quantity)
}

// 1.5 -> "1 1/2", 0.333 -> "1/3", 12.04 -> "12". Anything that is not close to a kitchen
// fraction falls back to one decimal, or none from 10 up where decimals are noise.
const formatQuantity = (value: number): string => {
  const whole = Math.floor(value)
  const rest = value - whole

  if (rest < FRACTION_TOLERANCE) return String(whole)
  if (1 - rest < FRACTION_TOLERANCE) return String(whole + 1)

  const fraction = FRACTIONS.find(
    ([fractionValue]) => Math.abs(rest - fractionValue) < FRACTION_TOLERANCE
  )
  if (fraction) return whole === 0 ? fraction[1] : `${whole} ${fraction[1]}`

  return value >= 10
    ? String(Math.round(value))
    : String(Number(value.toFixed(1)))
}

// Scales the quantity at the start of an ingredient line and leaves the rest of the text
// alone. Lines without a leading number ("Salt", "Juice of 1/2 lemon") come back unchanged,
// since the free text can't be rewritten safely without structured quantities.
export const scaleIngredient = (raw: string, factor: number): string => {
  if (factor === 1) return raw

  const match = LEADING_QUANTITY.exec(raw)
  if (!match) return raw

  const [whole, approx = '', first = '', separator, second] = match
  const scaled = `${approx}${formatQuantity(toNumber(first) * factor)}`
  const range =
    separator && second
      ? `${separator}${formatQuantity(toNumber(second) * factor)}`
      : ''

  return `${scaled}${range}${raw.slice(whole.length)}`
}

// Groups ingredient lines under their headings, in the order each heading first appears
export const groupIngredients = (
  ingredients: RecipeIngredient[]
): IngredientGroup[] => {
  const groups: IngredientGroup[] = []

  ingredients.forEach((ingredient) => {
    const current = groups.find(({ name }) => name === ingredient.group)
    if (current) {
      current.ingredients.push(ingredient)
      return
    }
    groups.push({ name: ingredient.group, ingredients: [ingredient] })
  })

  return groups
}
