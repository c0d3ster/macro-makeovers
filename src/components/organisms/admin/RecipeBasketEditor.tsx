'use client'

import type { ReactElement } from 'react'

import { useId } from 'react'

import type { BasketItemInput, RecipeImport } from '@/validations'

import {
  AddRowButton,
  InlineInput,
  RemoveRowButton,
} from '@/components/molecules'
import { formatMoney, priceRecipe, toCatalogItem } from '@/libs/basket'

import { toNumber, useRecipeForm } from './recipeFormFields'

type Lines = Record<string, number>

type RecipeBasketEditorProps = {
  // The price book, for picking items and pricing the lines as they are typed
  items: BasketItemInput[]
}

const SELECT =
  'min-w-0 rounded-md border border-text-muted/30 bg-surface px-2 py-1 text-sm text-text focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none'

const TIERS = ['$', '$$', '$$$', '$$$$', '$$$$$']

type LinesFieldProps = {
  label: string
  lines: Lines | undefined
  items: BasketItemInput[]
  // Builds change the recipe's lines, and 0 there drops one
  allowZero: boolean
  onChange: (lines: Lines | undefined) => void
}

// Item and amount rows for one set of lines. Keys are unique, so a picked item leaves the other
// rows' menus. Blank or emptied lines read as none, the same as a missing field.
const LinesField = ({
  label,
  lines = {},
  items,
  allowZero,
  onChange,
}: LinesFieldProps): ReactElement => {
  const rows = Object.entries(lines)
  const byKey = new Map(items.map((item) => [item.key, item]))
  const unused = items.filter(({ key }) => !(key in lines))
  const write = (next: [string, number][]): void =>
    onChange(next.length > 0 ? Object.fromEntries(next) : undefined)

  return (
    <div className='flex flex-col gap-2'>
      {rows.length > 0 && (
        <ul className='flex flex-col divide-y divide-text-muted/30'>
          {rows.map(([key, quantity], index) => {
            const item = byKey.get(key)
            return (
              <li
                key={key}
                className='group/editable flex items-center gap-3 py-2 text-sm text-text'
              >
                <select
                  aria-label={`${label} item ${index + 1}`}
                  value={key}
                  onChange={(event) =>
                    write(
                      rows.map((row, at) =>
                        at === index ? [event.target.value, row[1]] : row
                      )
                    )
                  }
                  className={`${SELECT} flex-1`}
                >
                  {!item && <option value={key}>{key} (not in the price book)</option>}
                  {[...(item ? [item] : []), ...unused]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.name} ({option.pack})
                      </option>
                    ))}
                </select>
                <span className='w-28'>
                  <InlineInput
                    type='number'
                    step='any'
                    min={allowZero ? '0' : '0.0001'}
                    label={`${label} amount ${index + 1}`}
                    value={Number.isFinite(quantity) ? quantity : ''}
                    onChange={(event) =>
                      write(
                        rows.map((row, at) =>
                          at === index ? [row[0], toNumber(event.target.valueAsNumber)] : row
                        )
                      )
                    }
                  />
                </span>
                <span className='w-12 text-text-muted'>{item?.unit}</span>
                <RemoveRowButton
                  label={`Remove ${label} item ${index + 1}`}
                  onClick={() => write(rows.filter((_, at) => at !== index))}
                />
              </li>
            )
          })}
        </ul>
      )}
      {unused[0] && (
        <AddRowButton
          onClick={() => write([...rows, [unused[0]?.key ?? '', allowZero ? 0 : 1]])}
        >
          Add an item
        </AddRowButton>
      )}
    </div>
  )
}

// The recipe's shopping list for the basket: what one batch buys from the price book, and the
// changes each build makes. Shows each build's prorated cost per serving and $ tier as it is
// typed. Items are added to the price book through the connector's save_basket_items.
export const RecipeBasketEditor = ({ items }: RecipeBasketEditorProps): ReactElement => {
  const headingId = useId()
  const { watch, setValue } = useRecipeForm()
  const recipe = watch()
  const lines = recipe.basketLines
  const builds = recipe.builds ?? []

  const setLines = (next: Lines | undefined): void =>
    setValue('basketLines', next, { shouldDirty: true })
  const setBuildLines = (index: number, next: Lines | undefined): void =>
    setValue(`builds.${index}.basketLines`, next, { shouldDirty: true })

  // Priced from the values as typed, so a blank amount counts as 0 until it is saved
  const { prices } = lines
    ? priceRecipe(
        Object.fromEntries(items.map((item) => [item.key, toCatalogItem(item)])),
        {
          ...recipe,
          servings: toNumber(recipe.servings) || 1,
          costTier: toNumber(recipe.costTier),
          basketLines: lines,
          builds: builds.map((build) => ({ ...build, key: build.key ?? '' })),
        } as RecipeImport
      )
    : { prices: [] }

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-4 rounded-xl bg-surface p-4'>
      <h2 id={headingId} className='text-xl font-semibold text-text'>
        Basket
      </h2>
      <p className='text-sm text-text-muted'>
        What one batch buys, in each item&apos;s unit, spices included. A dish includes the
        lines of the sides and sauces it uses. Cost per serving is prorated by what the recipe
        uses. Without lines, the recipe has no &quot;Add to basket&quot;.
      </p>
      {items.length === 0 && (
        <p role='alert' className='text-sm text-red-400'>
          The price book could not be loaded. Saved lines are kept.
        </p>
      )}
      <LinesField
        label='Basket'
        lines={lines}
        items={items}
        allowZero={false}
        onChange={setLines}
      />

      {lines && prices.length > 0 && (
        <ul className='flex flex-col gap-1 text-sm text-text-muted'>
          {prices.map(({ build, perServing, tier, statedTier }) => (
            <li key={build}>
              <span className='text-text'>{build}</span>: {formatMoney(perServing)}/serving,{' '}
              {TIERS[tier - 1]}
              {tier !== statedTier && (
                <span className='text-red-400'> (the recipe says {TIERS[statedTier - 1]})</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {lines &&
        builds.map((build, index) => (
          <details key={build.key ?? index} open={Boolean(build.basketLines)}>
            <summary className='cursor-pointer text-sm font-medium text-text'>
              {build.label || build.key} shops differently
            </summary>
            <p className='my-2 text-sm text-text-muted'>
              Changes to the lines above for this build: a new amount, a new item, or 0 to drop
              one it does not use.
            </p>
            <LinesField
              label={`${build.label || build.key}`}
              lines={build.basketLines}
              items={items}
              allowZero
              onChange={(next) => setBuildLines(index, next)}
            />
          </details>
        ))}
    </section>
  )
}
