import type { ReactElement } from 'react'

import type { BuildDelta, NutritionBuild } from '@/libs/recipes'

import { compareBuilds, featuredBuild, toMacroRatios } from '@/libs/recipes'

type ComparisonTableProps = {
  builds: NutritionBuild[]
}

type Change = {
  key: keyof BuildDelta
  label: string
  unit: string
  // Which direction counts as a win for the makeover
  better: 'up' | 'down' | 'neutral'
}

const CHANGES: Change[] = [
  { key: 'proteinG', label: 'protein', unit: 'g', better: 'up' },
  { key: 'fatG', label: 'fat', unit: 'g', better: 'down' },
  { key: 'calories', label: 'cal', unit: '', better: 'down' },
  { key: 'carbsG', label: 'carbs', unit: 'g', better: 'neutral' },
]

const KIND_LABELS: Record<NutritionBuild['kind'], string> = {
  makeover: 'Makeover',
  traditional: 'Traditional',
}

const formatDelta = (value: number, unit: string): string =>
  `${value > 0 ? '+' : ''}${value}${unit}`

const isWin = ({ better }: Change, value: number): boolean =>
  (better === 'up' && value > 0) || (better === 'down' && value < 0)

const rows = (
  build: NutritionBuild
): { label: string; value: string; key: string }[] => {
  const { proteinPct, carbsPct, fatPct } = toMacroRatios(build)
  return [
    { key: 'calories', label: 'Calories', value: String(build.calories) },
    { key: 'protein', label: 'Protein', value: `${build.proteinG}g` },
    { key: 'carbs', label: 'Carbs', value: `${build.carbsG}g` },
    { key: 'fat', label: 'Fat', value: `${build.fatG}g` },
    {
      key: 'split',
      label: 'Split (P / C / F)',
      value: `${proteinPct} / ${carbsPct} / ${fatPct}`,
    },
  ]
}

export const ComparisonTable = ({
  builds,
}: ComparisonTableProps): ReactElement | null => {
  const makeover = featuredBuild(builds)
  const traditional = builds.find(({ kind }) => kind === 'traditional')
  if (!makeover || !traditional) return null

  const delta = compareBuilds(makeover, traditional)
  const columns = builds.map((build) => ({
    build,
    id: `${build.kind}-${build.label}`,
    rows: rows(build),
  }))

  return (
    <section
      aria-labelledby='comparison-heading'
      className='flex flex-col gap-4'
    >
      <h2 id='comparison-heading' className='text-2xl font-semibold text-text'>
        Makeover vs traditional
      </h2>

      <ul className='flex flex-wrap gap-2' aria-label='Changes per serving'>
        {CHANGES.map((change) => (
          <li
            key={change.key}
            className={`rounded-full px-3 py-1 text-sm font-medium ${isWin(change, delta[change.key]) ? 'bg-accent/15 text-accent' : 'bg-surface text-text-muted'}`}
          >
            {formatDelta(delta[change.key], change.unit)} {change.label}
          </li>
        ))}
      </ul>

      <div className='overflow-x-auto rounded-xl bg-surface'>
        <table className='w-full min-w-max text-left text-sm'>
          <caption className='sr-only'>Nutrition per serving by build</caption>
          <thead>
            <tr>
              <td />
              {columns.map(({ id, build }) => (
                <th
                  key={id}
                  scope='col'
                  className={`max-w-56 px-4 py-3 align-bottom font-normal ${build === makeover ? 'bg-accent/10' : ''}`}
                >
                  <span className='block font-semibold text-text'>
                    {KIND_LABELS[build.kind]}
                  </span>
                  <span className='block text-xs text-text-muted'>
                    {build.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(columns[0]?.rows ?? []).map(({ key, label }, rowIndex) => (
              <tr key={key} className='border-t border-background'>
                <th
                  scope='row'
                  className='px-4 py-2.5 font-normal text-text-muted'
                >
                  {label}
                </th>
                {columns.map(({ id, build, rows: cells }) => (
                  <td
                    key={id}
                    className={`px-4 py-2.5 font-medium text-text ${build === makeover ? 'bg-accent/10' : ''}`}
                  >
                    {cells[rowIndex]?.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
