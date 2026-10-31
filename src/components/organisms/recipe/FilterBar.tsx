'use client'

import type { FormEvent, ReactElement, ReactNode } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import type { FilterOption } from '@/components/molecules'
import type {
  FacetKey,
  RecipeFilters,
  TagFacet,
  TagGroups,
  UnavailableOptions,
} from '@/libs/recipes'

import { Button } from '@/components/atoms'
import {
  FILTER_FIELD_CLASS,
  FilterSelect,
  SymbolScale,
} from '@/components/molecules'
import {
  countBarFilters,
  describeFilters,
  detectGoal,
  FACET_VALUES,
  formatMacroTarget,
  GOALS,
  hasBestMatch,
  searchParamsWithout,
  toSearchParams,
} from '@/libs/recipes'

type FilterBarProps = {
  filters: RecipeFilters
  // The page's title and intro, shown beside the search and goal
  intro: ReactNode
  tagGroups: TagGroups
  // Options that would return nothing on top of the current filters, grayed out
  unavailable: UnavailableOptions
  // Where the form submits and the clear links return to
  action?: string
}

// What the controls show right now, as the strings the URL holds. Empty means "not set".
type Draft = {
  q: string
  sort: string
  maxCalories: string
  maxMinutes: string
  maxCost: string
  maxDifficulty: string
  carbs: string
  fat: string
  protein: string
  meat: string
  method: string
  dish: string
  goodFor: string
}

const SHEET_ID = 'recipe-filters-sheet'
const MORE_ID = 'recipe-filters-more'
const SCALE_VALUES = [1, 2, 3, 4, 5]
const TIME_VALUES = FACET_VALUES.maxMinutes.map(Number)

const toDraft = (filters: RecipeFilters): Draft => {
  const params = toSearchParams(filters)
  const get = (key: string): string => params.get(key) ?? ''

  return {
    q: get('q'),
    sort: get('sort'),
    maxCalories: get('maxCalories'),
    maxMinutes: get('maxMinutes'),
    maxCost: get('maxCost'),
    maxDifficulty: get('maxDifficulty'),
    carbs: get('carbs'),
    fat: get('fat'),
    protein: get('protein'),
    meat: get('meat'),
    method: get('method'),
    dish: get('dish'),
    goodFor: get('goodFor'),
  }
}

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1)

// "le35" reads "35% or less", "ge45" reads "45% or more", and "40" reads "~40%"
const macroLabel = (value: string): string => {
  if (value.startsWith('le')) return `${value.slice(2)}% or less`
  if (value.startsWith('ge')) return `${value.slice(2)}% or more`
  return `~${value}%`
}

const SORT_OPTIONS: FilterOption[] = [
  { value: 'calories', label: 'Sort: Fewest calories' },
  { value: 'time', label: 'Sort: Quickest' },
  { value: 'cost', label: 'Sort: Cheapest' },
]

const FilterIcon = (): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 16 16'
    className='size-4'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
  >
    <path d='M2 4h12M4 8h8M6 12h4' />
  </svg>
)

type FiltersToggleProps = {
  count: number
  isOpen: boolean
  controls: string
  onClick: () => void
  // Display for the wrapper, which decides where the button shows
  className: string
  // Which side the button stays on while the reserved space around it is empty
  alignClassName: string
}

type FiltersButtonProps = Omit<FiltersToggleProps, 'className' | 'alignClassName'> & {
  className?: string
  // An invisible copy that only holds the space of the widest state
  isGhost?: boolean
}

const FiltersButton = ({
  count,
  isOpen,
  controls,
  onClick,
  className = '',
  isGhost = false,
}: FiltersButtonProps): ReactElement => (
  <Button
    type='button'
    size='sm'
    variant='outline'
    aria-label={count > 0 ? `Filters, ${count} active` : 'Filters'}
    aria-expanded={isOpen}
    aria-controls={controls}
    aria-hidden={isGhost}
    tabIndex={isGhost ? -1 : undefined}
    onClick={onClick}
    className={`items-center gap-2 ${className}`}
  >
    <FilterIcon />
    <span>Filters</span>
    {count > 0 && (
      <span className='min-w-5 rounded-full bg-primary px-1.5 text-center text-xs text-on-primary'>
        {count}
      </span>
    )}
  </Button>
)

// The button is only as wide as it needs to be, but it sits in a cell sized for its widest
// state, so the badge growing into empty space never pushes the controls beside it.
const FiltersToggle = ({
  className,
  alignClassName,
  ...button
}: FiltersToggleProps): ReactElement => (
  <span className={`inline-grid ${className}`}>
    <FiltersButton
      {...button}
      count={88}
      className='pointer-events-none invisible col-start-1 row-start-1'
      isGhost
    />
    <FiltersButton
      {...button}
      className={`col-start-1 row-start-1 ${alignClassName}`}
    />
  </span>
)

// Search and the goal sit beside the title. Time, cost, difficulty and the three macro shares
// are always one line below. Everything else opens under the Filters button, and on a phone
// the whole set moves into a sheet. Every control is shown from the URL and changes it, so a
// filtered view is a link, and the goal is only a preset of the macro selectors.
export const FilterBar = ({
  filters,
  intro,
  tagGroups,
  unavailable,
  action = '/',
}: FilterBarProps): ReactElement => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState(() => toDraft(filters))
  const [syncedFilters, setSyncedFilters] = useState(filters)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(
    () =>
      [
        filters.maxCalories,
        filters.meat,
        filters.method,
        filters.dish,
        filters.goodFor,
      ].some((value) => value !== undefined)
  )

  // A new page render brings new filters, so the controls follow the URL
  if (syncedFilters !== filters) {
    setSyncedFilters(filters)
    setDraft(toDraft(filters))
  }

  // Keep the page behind the phone sheet from scrolling
  useEffect(() => {
    if (!sheetOpen || !window.matchMedia('(max-width: 1023px)').matches) {
      return undefined
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [sheetOpen])

  const apply = (next: Draft): void => {
    setDraft(next)
    const query = new URLSearchParams(
      Object.entries(next).filter(([, value]) => value !== '')
    ).toString()

    startTransition(() => {
      router.push(query ? `${action}?${query}` : action, { scroll: false })
    })
  }
  const update = (patch: Partial<Draft>): void => apply({ ...draft, ...patch })

  const goal = detectGoal(filters)
  const goalValue = goal && goal !== 'custom' ? goal.id : (goal ?? '')
  const pickGoal = (id: string): void => {
    if (id === 'custom') return

    const picked = GOALS.find((item) => item.id === id)
    // A goal replaces the four selectors it owns, and puts the sort back to its default
    apply({
      ...draft,
      sort: '',
      carbs: picked?.carbs ? formatMacroTarget(picked.carbs) : '',
      fat: picked?.fat ? formatMacroTarget(picked.fat) : '',
      protein: picked?.protein ? formatMacroTarget(picked.protein) : '',
      maxCalories: picked?.maxCalories ? String(picked.maxCalories) : '',
    })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    apply({ ...draft, q: draft.q.trim() })
  }

  const isOff = (key: FacetKey, value: string): boolean =>
    unavailable[key]?.includes(value) ?? false
  const withOff = (key: FacetKey, options: FilterOption[]): FilterOption[] =>
    options.map((option) => ({
      ...option,
      disabled: isOff(key, option.value),
    }))
  const scaleOff = (key: FacetKey): number[] =>
    (unavailable[key] ?? []).map(Number)
  const tagOptions = (facet: TagFacet): FilterOption[] =>
    withOff(
      facet,
      tagGroups[facet].map((name) => ({
        value: name,
        label: capitalize(name),
      }))
    )
  const macroOptions = (key: 'carbs' | 'fat' | 'protein'): FilterOption[] =>
    withOff(
      key,
      FACET_VALUES[key].map((value) => ({
        value,
        label: macroLabel(value),
      }))
    )

  const barCount = countBarFilters(filters)
  const chips = describeFilters(filters)
  const hrefFor = (params: URLSearchParams): string => {
    const query = params.toString()
    return query ? `${action}?${query}` : action
  }
  const clearHref = hrefFor(
    new URLSearchParams(filters.q ? { q: filters.q } : {})
  )

  const sortOptions: FilterOption[] = hasBestMatch(filters)
    ? [
        { value: '', label: 'Sort: Best match' },
        { value: 'title', label: 'Sort: A to Z' },
        ...SORT_OPTIONS,
      ]
    : [{ value: '', label: 'Sort: A to Z' }, ...SORT_OPTIONS]
  const goalOptions: FilterOption[] = [
    ...GOALS.map(({ id, label }) => ({ value: id, label })),
    ...(goal === 'custom' ? [{ value: 'custom', label: 'Custom' }] : []),
  ]

  return (
    <>
      {sheetOpen && (
        <button
          type='button'
          aria-label='Close filters'
          onClick={() => setSheetOpen(false)}
          className='fixed inset-0 z-60 bg-black/60 lg:hidden'
        />
      )}
      <form
        action={action}
        method='get'
        role='search'
        aria-label='Search and filter recipes'
        aria-busy={isPending}
        onSubmit={submitSearch}
        className='mb-8 grid grid-cols-1 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,236px)_minmax(0,236px)] lg:gap-x-2'
      >
        <div className='lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:pr-6'>
          {intro}
        </div>

        <div className='flex gap-2 lg:col-span-2 lg:col-start-2 lg:row-start-1'>
          <input
            type='search'
            name='q'
            aria-label='Search recipes'
            value={draft.q}
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
            placeholder='Search title, tag, or ingredient'
            className={`${FILTER_FIELD_CLASS} min-w-0 flex-1`}
          />
          <Button type='submit' size='sm'>
            Search
          </Button>
        </div>

        <div className='flex gap-2 lg:contents'>
          <div className='min-w-0 flex-1 lg:col-start-2 lg:row-start-2'>
            <FilterSelect
              label='Sort recipes'
              labelClassName='sr-only'
              name='sort'
              anyLabel={false}
              options={sortOptions}
              value={draft.sort}
              onChange={(sort) => update({ sort })}
            />
          </div>
          <FiltersToggle
            count={barCount}
            isOpen={sheetOpen}
            controls={SHEET_ID}
            onClick={() => setSheetOpen(true)}
            className='lg:hidden'
            alignClassName='justify-self-end'
          />
        </div>

        {chips.length > 0 && (
          <ul aria-label='Applied filters' className='flex flex-wrap gap-1.5 lg:hidden'>
            {chips.map(({ id, label, params }) => (
              <li key={id}>
                <Link
                  href={hrefFor(searchParamsWithout(filters, params))}
                  aria-label={`Remove ${label}`}
                  className='inline-flex items-center gap-1.5 rounded-full border border-text-muted/40 px-3 py-1 text-sm text-text hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
                >
                  {label}
                  <span aria-hidden='true' className='text-text-muted'>
                    &times;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div
          id={SHEET_ID}
          role={sheetOpen ? 'dialog' : undefined}
          aria-label='Filters'
          onKeyDown={(event) => {
            if (event.key === 'Escape') setSheetOpen(false)
          }}
          className={`${
            sheetOpen
              ? 'fixed inset-x-0 top-20 bottom-0 z-70 flex flex-col rounded-t-2xl bg-surface'
              : 'hidden'
          } lg:contents`}
        >
          <div className='flex items-center justify-between border-b border-text-muted/20 py-2 pr-2 pl-4 lg:hidden'>
            <h2 className='text-lg font-semibold text-text'>Filters</h2>
            <button
              type='button'
              aria-label='Close filters'
              onClick={() => setSheetOpen(false)}
              className='flex size-11 cursor-pointer items-center justify-center text-2xl leading-none text-text'
            >
              &times;
            </button>
          </div>

          <div className='flex flex-1 flex-col gap-5 overflow-y-auto p-4 lg:contents'>
            <div className='lg:col-start-3 lg:row-start-2'>
              <FilterSelect
                label='Goal'
                labelClassName='lg:sr-only'
                anyLabel='Goal'
                options={goalOptions}
                value={goalValue}
                onChange={pickGoal}
              />
            </div>
            {goal && goal !== 'custom' && (
              <p className='text-xs leading-snug text-text-muted lg:col-span-2 lg:col-start-2 lg:row-start-3'>
                {goal.note}
              </p>
            )}

            <div className='flex flex-col gap-3 lg:col-span-3 lg:row-start-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2'>
              <FiltersToggle
                count={barCount}
                isOpen={moreOpen}
                controls={MORE_ID}
                onClick={() => setMoreOpen(!moreOpen)}
                className='hidden lg:inline-grid'
                alignClassName='justify-self-start'
              />
              <SymbolScale
                label='Time'
                unit=' minutes'
                values={TIME_VALUES}
                value={filters.maxMinutes}
                disabled={scaleOff('maxMinutes')}
                onChange={(value) =>
                  update({ maxMinutes: value ? String(value) : '' })
                }
                buttonClassName='h-11 min-w-11 lg:h-8 lg:min-w-6'
                renderSymbol={(isLit, value) => (
                  <span
                    className={`text-sm font-medium ${isLit ? 'text-accent' : 'text-text-muted/50'}`}
                  >
                    {value}
                  </span>
                )}
              />
              <SymbolScale
                label='Cost'
                values={SCALE_VALUES}
                value={filters.maxCostTier}
                disabled={scaleOff('maxCost')}
                onChange={(value) =>
                  update({ maxCost: value ? String(value) : '' })
                }
                renderSymbol={(isLit) => (
                  <span
                    aria-hidden='true'
                    className={`text-lg font-medium lg:text-base ${isLit ? 'text-accent' : 'text-text-muted/40'}`}
                  >
                    $
                  </span>
                )}
              />
              <SymbolScale
                label='Difficulty'
                values={SCALE_VALUES}
                value={filters.maxDifficulty}
                disabled={scaleOff('maxDifficulty')}
                onChange={(value) =>
                  update({ maxDifficulty: value ? String(value) : '' })
                }
                renderSymbol={(isLit) => (
                  <span
                    aria-hidden='true'
                    className={`size-2.5 rounded-full ${isLit ? 'bg-primary' : 'bg-text-muted/30'}`}
                  />
                )}
              />
              <Link
                href={clearHref}
                className={`hidden text-sm text-text-muted underline hover:text-text lg:inline ${
                  barCount > 0 ? '' : 'invisible'
                }`}
              >
                Clear all
              </Link>
              <div className='flex flex-col gap-2 lg:ml-auto lg:max-w-120 lg:min-w-85 lg:flex-[1_1_340px]'>
                <span className='text-xs font-medium text-text-muted lg:hidden'>
                  Share of calories
                </span>
                <div className='grid grid-cols-3 gap-2 lg:flex'>
                  <FilterSelect
                    label='Carbs'
                    dotClassName='bg-carbs'
                    inlineFromLg
                    className='lg:flex-1'
                    options={macroOptions('carbs')}
                    value={draft.carbs}
                    onChange={(carbs) => update({ carbs })}
                  />
                  <FilterSelect
                    label='Fat'
                    dotClassName='bg-fat'
                    inlineFromLg
                    className='lg:flex-1'
                    options={macroOptions('fat')}
                    value={draft.fat}
                    onChange={(fat) => update({ fat })}
                  />
                  <FilterSelect
                    label='Protein'
                    dotClassName='bg-protein'
                    inlineFromLg
                    className='lg:flex-1'
                    options={macroOptions('protein')}
                    value={draft.protein}
                    onChange={(protein) => update({ protein })}
                  />
                </div>
              </div>
            </div>

            <div
              id={MORE_ID}
              className={`grid grid-cols-2 gap-3 lg:col-span-3 lg:row-start-5 lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2 lg:rounded-xl lg:bg-surface lg:px-4 lg:py-3 ${
                moreOpen ? 'lg:flex' : 'lg:hidden'
              }`}
            >
              <FilterSelect
                label='Calories'
                inlineFromLg
                options={withOff(
                  'maxCalories',
                  FACET_VALUES.maxCalories.map((value) => ({
                    value,
                    label: `Up to ${value}`,
                  }))
                )}
                value={draft.maxCalories}
                onChange={(maxCalories) => update({ maxCalories })}
              />
              <FilterSelect
                label='Meat'
                inlineFromLg
                options={tagOptions('meat')}
                value={draft.meat}
                onChange={(meat) => update({ meat })}
              />
              <FilterSelect
                label='Method'
                inlineFromLg
                options={tagOptions('method')}
                value={draft.method}
                onChange={(method) => update({ method })}
              />
              <FilterSelect
                label='Dish'
                inlineFromLg
                options={tagOptions('dish')}
                value={draft.dish}
                onChange={(dish) => update({ dish })}
              />
              <FilterSelect
                label='Good for'
                inlineFromLg
                options={tagOptions('goodFor')}
                value={draft.goodFor}
                onChange={(goodFor) => update({ goodFor })}
              />
            </div>
          </div>

          <div className='flex items-center gap-3 border-t border-text-muted/20 bg-surface p-3 lg:hidden'>
            {barCount > 0 && (
              <Link
                href={clearHref}
                onClick={() => setSheetOpen(false)}
                className='px-2 text-sm text-text-muted underline'
              >
                Clear all
              </Link>
            )}
            <Button
              type='button'
              className='flex-1'
              onClick={() => setSheetOpen(false)}
            >
              Show recipes
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
