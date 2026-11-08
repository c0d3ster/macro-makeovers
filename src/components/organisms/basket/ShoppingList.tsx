'use client'

import type { ReactElement } from 'react'

import { useState } from 'react'

import type { BasketLine } from '@/libs/basket'

import {
  describePurchase,
  formatMoney,
  groupBySection,
  SECTION_LABELS,
  toShoppingListText,
} from '@/libs/basket'
import { useBasket } from '@/providers'

import type { BasketRecipeLookup } from './basketRecipes'

import { recipeInfo } from './basketRecipes'

type ShoppingListProps = {
  lines: BasketLine[]
  recipes: BasketRecipeLookup
}

const COPIED_MS = 2000

// The pooled list, grouped by store section, with check-offs for the store and a copy button
export const ShoppingList = ({
  lines,
  recipes,
}: ShoppingListProps): ReactElement => {
  const { checked, toggleChecked, includePantry, setIncludePantry } =
    useBasket()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  )

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(toShoppingListText(lines, checked))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    setTimeout(setCopyState, COPIED_MS, 'idle')
  }

  return (
    <section aria-labelledby='shopping-list'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
        <h2 id='shopping-list' className='text-xl font-bold text-text'>
          Shopping list
        </h2>
        <div className='flex flex-wrap items-center gap-4 text-sm'>
          <label className='flex cursor-pointer items-center gap-2 text-text-muted'>
            <input
              type='checkbox'
              checked={includePantry}
              onChange={(event) => setIncludePantry(event.target.checked)}
              className='size-4 accent-primary'
            />
            Include pantry staples
          </label>
          <button
            type='button'
            onClick={() => void copy()}
            className='cursor-pointer rounded-md border border-text-muted/30 px-3 py-1.5 text-text hover:border-primary'
          >
            {
              {
                idle: 'Copy list',
                copied: 'Copied',
                failed: 'Copy failed',
              }[copyState]
            }
          </button>
        </div>
      </div>

      <div className='flex flex-col gap-5'>
        {groupBySection(lines).map(({ section, lines: sectionLines }) => (
          <div key={section}>
            <h3 className='mb-1 text-sm font-medium text-text-muted'>
              {SECTION_LABELS[section]}
            </h3>
            <ul className='divide-y divide-text-muted/15 rounded-xl bg-surface'>
              {sectionLines.map((line) => {
                const { key, item, cost, usedBy } = line
                const isChecked = checked.has(key)
                const inputId = `item-${key}`

                return (
                  <li key={key} className='flex items-start gap-3 px-4 py-3'>
                    <input
                      id={inputId}
                      type='checkbox'
                      checked={isChecked}
                      onChange={() => toggleChecked(key)}
                      className='mt-1 size-4 shrink-0 accent-primary'
                    />
                    <label htmlFor={inputId} className='min-w-0 flex-1'>
                      <span
                        className={`block ${isChecked ? 'text-text-muted line-through' : 'text-text'}`}
                      >
                        {item.name}
                      </span>
                      <span className='block text-xs text-text-muted'>
                        {describePurchase(line)}
                        {item.perishable && ' · short shelf life'}
                        {usedBy.length > 1 &&
                          ` · shared by ${usedBy
                            .map(({ slug }) => recipeInfo(recipes, slug).title)
                            .join(', ')}`}
                      </span>
                    </label>
                    <span className='shrink-0 text-sm text-text-muted tabular-nums'>
                      {formatMoney(cost)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
