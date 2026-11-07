import type { ReactElement } from 'react'

import { MacroStrip } from '@/components/atoms'
import { toMacroRatios } from '@/libs/recipes/macroRatios'

import { MacroBar } from './MacroBar'

type MacroGrams = {
  carbsG: number
  fatG: number
  proteinG: number
}

type RecipeMacroSummaryProps = {
  featured: MacroGrams
  // The traditional recipe's macros, drawn as a slim bar for comparison
  original?: MacroGrams
  reveal?: boolean
}

// The macro bar at the top of a recipe, always in carbs, fat, protein order
export const RecipeMacroSummary = ({
  featured,
  original,
  reveal = false,
}: RecipeMacroSummaryProps): ReactElement => {
  const { carbsPct, fatPct, proteinPct } = toMacroRatios(featured)
  const originalRatios = original && toMacroRatios(original)

  return (
    <>
      <MacroBar
        reveal={reveal}
        macros={[
          {
            label: 'Carbs',
            tone: 'carbs',
            percent: carbsPct,
            fromPercent: originalRatios?.carbsPct,
            grams: featured.carbsG,
          },
          {
            label: 'Fat',
            tone: 'fat',
            percent: fatPct,
            fromPercent: originalRatios?.fatPct,
            grams: featured.fatG,
          },
          {
            label: 'Protein',
            tone: 'protein',
            percent: proteinPct,
            fromPercent: originalRatios?.proteinPct,
            grams: featured.proteinG,
          },
        ]}
      />
      {originalRatios && (
        <MacroStrip
          large
          reveal={reveal}
          label={`Original recipe calories by macro: ${originalRatios.carbsPct}% carbs, ${originalRatios.fatPct}% fat, ${originalRatios.proteinPct}% protein`}
          segments={[
            { tone: 'carbs', percent: originalRatios.carbsPct },
            { tone: 'fat', percent: originalRatios.fatPct },
            { tone: 'protein', percent: originalRatios.proteinPct },
          ]}
        />
      )}
    </>
  )
}
