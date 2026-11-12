'use client'

import type { ReactElement } from 'react'

import { useId, useState } from 'react'
import { useWatch } from 'react-hook-form'

import { useRecipeForm } from './recipeFormFields'

type ScopedSection = 'ingredients' | 'steps' | 'notes' | 'components'

type BuildScopePickerProps = {
  section: ScopedSection
  index: number
}

type Mode = 'all' | 'only' | 'skip'

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'all', label: 'Every build' },
  { mode: 'only', label: 'Only these' },
  { mode: 'skip', label: 'All but these' },
]

// Which builds an ingredient line, step, or note shows for. Hidden while the recipe has one build.
export const BuildScopePicker = ({
  section,
  index,
}: BuildScopePickerProps): ReactElement | null => {
  const { control, setValue } = useRecipeForm()
  const builds = useWatch({ control, name: 'builds' }) ?? []
  const onlyBuilds = useWatch({ control, name: `${section}.${index}.onlyBuilds` })
  const skipBuilds = useWatch({ control, name: `${section}.${index}.skipBuilds` })
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  if (builds.length < 2) return null

  const mode: Mode = onlyBuilds?.length ? 'only' : skipBuilds?.length ? 'skip' : 'all'
  const chosen = (mode === 'only' ? onlyBuilds : skipBuilds) ?? []
  const labelOf = (key: string): string =>
    builds.find((build) => build.key === key)?.label || key
  const summary =
    mode === 'all'
      ? 'Every build'
      : `${mode === 'only' ? 'Only' : 'Not'}: ${chosen.map(labelOf).join(', ')}`

  const write = (next: Mode, keys: string[]): void => {
    const list = keys.length > 0 ? keys : undefined
    setValue(`${section}.${index}.onlyBuilds`, next === 'only' ? list : undefined, {
      shouldDirty: true,
    })
    setValue(`${section}.${index}.skipBuilds`, next === 'skip' ? list : undefined, {
      shouldDirty: true,
    })
  }

  // Switching modes keeps the picked builds, so "only beef" turns into "all but beef"
  const pickMode = (next: Mode): void => {
    if (next === 'all') {
      write('all', [])
      return
    }
    const firstOther = builds.find(({ isDefault }) => !isDefault)?.key
    write(next, chosen.length > 0 ? chosen : firstOther ? [firstOther] : [])
  }

  const toggle = (key: string | undefined): void => {
    if (!key) return
    write(
      mode,
      chosen.includes(key) ? chosen.filter((item) => item !== key) : [...chosen, key]
    )
  }

  return (
    <div className='text-xs text-text-muted'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer rounded-full border px-2 py-0.5 hover:text-text ${
          mode === 'all' ? 'border-text-muted/30' : 'border-primary/50 text-primary'
        }`}
      >
        Builds: {summary}
      </button>
      {isOpen && (
        <div
          id={panelId}
          className='mt-2 flex flex-col gap-2 rounded-md border border-text-muted/30 bg-background p-2'
        >
          <div role='radiogroup' aria-label='Shows for' className='flex flex-wrap gap-3'>
            {MODES.map((option) => (
              <label key={option.mode} className='flex items-center gap-1'>
                <input
                  type='radio'
                  checked={mode === option.mode}
                  onChange={() => pickMode(option.mode)}
                />
                {option.label}
              </label>
            ))}
          </div>
          {mode !== 'all' && (
            <div className='flex flex-wrap gap-3'>
              {builds.map((build) => (
                <label key={build.key ?? build.label} className='flex items-center gap-1'>
                  <input
                    type='checkbox'
                    checked={Boolean(build.key && chosen.includes(build.key))}
                    onChange={() => toggle(build.key)}
                  />
                  {build.label || build.key}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
