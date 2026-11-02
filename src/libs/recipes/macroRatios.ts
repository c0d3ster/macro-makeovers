type MacroRatios = {
  proteinPct: number
  carbsPct: number
  fatPct: number
}

type MacroGrams = {
  proteinG: number
  carbsG: number
  fatG: number
}

const KCAL_PER_G_PROTEIN = 4
const KCAL_PER_G_CARBS = 4
const KCAL_PER_G_FAT = 9

// Share of macro calories from each macro. Normalized over the three macros rather than the
// label calories, so the split always reads as 100 (fiber and rounding don't leave a gap).
// Rounded by largest remainder so the three whole numbers always add up to exactly 100.
export const toMacroRatios = ({
  proteinG,
  carbsG,
  fatG,
}: MacroGrams): MacroRatios => {
  const shares = [
    proteinG * KCAL_PER_G_PROTEIN,
    carbsG * KCAL_PER_G_CARBS,
    fatG * KCAL_PER_G_FAT,
  ]
  const total = shares[0]! + shares[1]! + shares[2]!
  if (total === 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 }

  const exact = shares.map((share) => (share / total) * 100)
  const floors = exact.map(Math.floor)
  const missing = 100 - floors.reduce((sum, value) => sum + value, 0)
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
  byRemainder.slice(0, missing).forEach(({ index }) => {
    floors[index] = (floors[index] ?? 0) + 1
  })

  return {
    proteinPct: floors[0] ?? 0,
    carbsPct: floors[1] ?? 0,
    fatPct: floors[2] ?? 0,
  }
}

// "46 / 20 / 34". Always carbs, fat, protein, the order the book and every nutrition table use.
export const formatMacroRatios = (grams: MacroGrams): string => {
  const { carbsPct, fatPct, proteinPct } = toMacroRatios(grams)
  return `${carbsPct} / ${fatPct} / ${proteinPct}`
}
