import type { ReactElement } from 'react'

import type { ComparisonRow, MacroValues, RecipeBuild } from '@/libs/recipes'

import { Markdown } from '@/components/atoms'
import { formatMacroRatios } from '@/libs/recipes'

type NutritionTableProps = {
  builds: RecipeBuild[]
  // Traditional versions, shown last in italics
  comparisons: ComparisonRow[]
  servings: number
  // The build the page shows. The whole-batch row multiplies it.
  selected: RecipeBuild
  // Missing on a page that cannot switch yet, such as the first paint before the URL is read
  onSelect?: (key: string) => void
  // A line above the table defining the builds, and short analysis blocks below it
  intro?: string[]
  analysis?: string[]
}

const RATIO_HEADER = 'Ratio C/F/P'
const HEADERS = ['Calories', 'Carbs', 'Fat', 'Protein', RATIO_HEADER]

// Phones step the type down so the table fits without scrolling: 10px at 350px, 11px from
// 375px, 12px from 395px. Under 350px the padding tightens too.
const cell = 'px-1 py-2 min-[350px]:px-2 sm:px-3'
const ratioCell = `${cell} whitespace-nowrap`

const formatNumber = (value: number): string => value.toLocaleString('en-US')

const MacroCells = ({ row }: { row: MacroValues }): ReactElement => (
  <>
    <td className={cell}>~{formatNumber(row.calories)}</td>
    <td className={cell}>{row.carbsG}g</td>
    <td className={cell}>{row.fatG}g</td>
    <td className={cell}>{row.proteinG}g</td>
    <td className={ratioCell}>{formatMacroRatios(row)}</td>
  </>
)

// Same layout as the book: one row per build, a whole-batch row, and the traditional
// comparison last in italics. Column order is always carbs, fat, protein. With more than one
// build, each build row is a button that switches the page to it.
export const NutritionTable = ({
  builds,
  comparisons,
  servings,
  selected,
  onSelect,
  intro = [],
  analysis = [],
}: NutritionTableProps): ReactElement => {
  const canSwitch = builds.length > 1

  return (
    <section
      aria-labelledby='nutrition-heading'
      className='flex flex-col gap-3'
    >
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 id='nutrition-heading' className='text-2xl font-semibold text-text'>
          Nutrition
        </h2>
        {canSwitch && (
          <p className='text-sm text-text-muted'>Tap a build to switch</p>
        )}
      </div>

      {intro.map((body) => (
        <div key={body} className='text-sm text-text-muted'>
          <Markdown>{body}</Markdown>
        </div>
      ))}

      <div className='overflow-hidden rounded-lg border border-text-muted/30 bg-background'>
        <table className='w-full text-left text-[10px] min-[375px]:text-[11px] min-[395px]:text-xs sm:text-sm'>
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
            {builds.map((build) => {
              const isSelected = canSwitch && build.key === selected.key
              return (
                <tr
                  key={build.key}
                  className={`relative border-t border-text-muted/30 ${
                    isSelected ? 'bg-primary/10' : ''
                  } ${canSwitch && !isSelected ? 'hover:bg-surface' : ''}`}
                >
                  <th
                    scope='row'
                    className={`${cell} font-semibold ${
                      isSelected ? 'shadow-[inset_3px_0_0_0_var(--color-primary)]' : ''
                    }`}
                  >
                    {canSwitch ? (
                      // The button stretches over the whole row, so any cell switches builds
                      <button
                        type='button'
                        aria-pressed={isSelected}
                        // Server components cannot carry handlers, so the first paint has none
                        onClick={onSelect && ((): void => onSelect(build.key))}
                        className='text-left font-semibold after:absolute after:inset-0 after:content-[""] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-inset'
                      >
                        {build.label}
                      </button>
                    ) : (
                      build.label
                    )}
                  </th>
                  <MacroCells row={build} />
                </tr>
              )
            })}
            <tr className='border-t border-text-muted/30'>
              <th scope='row' className={`${cell} font-semibold`}>
                Whole batch (&times;{servings})
              </th>
              <td className={cell}>
                ~{formatNumber(selected.calories * servings)}
              </td>
              <td className={cell}>{selected.carbsG * servings}g</td>
              <td className={cell}>{selected.fatG * servings}g</td>
              <td className={cell}>{selected.proteinG * servings}g</td>
              <td className={ratioCell}>-</td>
            </tr>
            {comparisons.map((row) => (
              <tr
                key={row.label}
                className='border-t border-text-muted/30 text-text-muted italic'
              >
                <th scope='row' className={`${cell} font-normal`}>
                  {row.label}
                </th>
                <MacroCells row={row} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canSwitch && selected.note && (
        <div
          aria-live='polite'
          className='rounded-xl border border-primary/40 px-4 py-3 text-sm text-text-muted'
        >
          <Markdown>{selected.note}</Markdown>
        </div>
      )}

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
