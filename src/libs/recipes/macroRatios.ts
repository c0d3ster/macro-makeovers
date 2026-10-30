export type MacroRatios = {
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
export const toMacroRatios = ({
  proteinG,
  carbsG,
  fatG,
}: MacroGrams): MacroRatios => {
  const protein = proteinG * KCAL_PER_G_PROTEIN
  const carbs = carbsG * KCAL_PER_G_CARBS
  const fat = fatG * KCAL_PER_G_FAT
  const total = protein + carbs + fat
  if (total === 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 }

  return {
    proteinPct: Math.round((protein / total) * 100),
    carbsPct: Math.round((carbs / total) * 100),
    fatPct: Math.round((fat / total) * 100),
  }
}
