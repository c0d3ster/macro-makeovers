import type { ReactElement } from 'react'

import type { NutritionBuild } from '@/libs/recipes'

import { Markdown } from '@/components/atoms'
import { formatMacroRatios } from '@/libs/recipes'

type NutritionTableProps = {
  builds: NutritionBuild[]
  servings: number
  // The build the whole-batch row multiplies
  featured: NutritionBuild
  // A line above the table defining the builds, and short analysis blocks below it
  intro?: string[]
  analysis?: string[]
}

const RATIO_HEADER = 'Ratio C/F/P'
const HEADERS = ['Calories', 'Carbs', 'Fat', 'Protein', RATIO_HEADER]

const cell = 'px-1 py-2 sm:px-3'
const ratioCell = `${cell} whitespace-nowrap`

const formatNumber = (value: number): string => value.toLocaleString('en-US')

// Same layout as the book: one row per build, a whole-batch row, and the traditional
// comparison last in italics. Column order is always carbs, fat, protein.
export const NutritionTable = ({
  builds,
  servings,
  featured,
  intro = [],
  analysis = [],
}: NutritionTableProps): ReactElement => {
  const makeovers = builds.filter(({ kind }) => kind === 'makeover')
  const traditionals = builds.filter(({ kind }) => kind === 'traditional')

  return (
    <section
      aria-labelledby='nutrition-heading'
      className='flex flex-col gap-3'
    >
      <h2 id='nutrition-heading' className='text-2xl font-semibold text-text'>
        Nutrition
      </h2>

      {intro.map((body) => (
        <div key={body} className='text-sm text-text-muted'>
          <Markdown>{body}</Markdown>
        </div>
      ))}

      <div className='overflow-x-auto rounded-lg border border-text-muted/30'>
        <table className='w-full text-left text-xs sm:text-sm'>
          <thead className='bg-surface text-text'>
            <tr>
              <td />
              {HEADERS.map((header) => (
                <th
                  key={header}
                  scope='col'
                  className={`${header === RATIO_HEADER ? ratioCell : cell} font-semibold`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='text-text'>
            {makeovers.map((build) => (
              <tr key={build.label} className='border-t border-text-muted/30'>
                <th scope='row' className={`${cell} font-semibold`}>
                  {build.label}
                </th>
                <td className={cell}>~{formatNumber(build.calories)}</td>
                <td className={cell}>{build.carbsG}g</td>
                <td className={cell}>{build.fatG}g</td>
                <td className={cell}>{build.proteinG}g</td>
                <td className={ratioCell}>{formatMacroRatios(build)}</td>
              </tr>
            ))}
            <tr className='border-t border-text-muted/30'>
              <th scope='row' className={`${cell} font-semibold`}>
                Whole batch (&times;{servings})
              </th>
              <td className={cell}>
                ~{formatNumber(featured.calories * servings)}
              </td>
              <td className={cell}>{featured.carbsG * servings}g</td>
              <td className={cell}>{featured.fatG * servings}g</td>
              <td className={cell}>{featured.proteinG * servings}g</td>
              <td className={ratioCell}>-</td>
            </tr>
            {traditionals.map((build) => (
              <tr
                key={build.label}
                className='border-t border-text-muted/30 text-text-muted italic'
              >
                <th scope='row' className={`${cell} font-normal`}>
                  {build.label}
                </th>
                <td className={cell}>~{formatNumber(build.calories)}</td>
                <td className={cell}>{build.carbsG}g</td>
                <td className={cell}>{build.fatG}g</td>
                <td className={cell}>{build.proteinG}g</td>
                <td className={ratioCell}>{formatMacroRatios(build)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {analysis.map((body) => (
        <aside
          key={body}
          className='rounded-xl bg-surface px-4 py-3 text-sm text-text-muted'
        >
          <Markdown>{body}</Markdown>
        </aside>
      ))}
    </section>
  )
}
