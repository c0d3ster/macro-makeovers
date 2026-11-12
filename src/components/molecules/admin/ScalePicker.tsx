'use client'

import type { ReactElement, ReactNode } from 'react'

import { useId, useState } from 'react'

type ScalePickerProps = {
  label: string
  value?: number
  onChange: (value: number) => void
  // Draws one step of the scale, lit or dimmed
  renderSymbol: (isLit: boolean) => ReactNode
  max?: number
  // For an optional rating: adds a "None" step before the scale that clears the value
  onClear?: () => void
  error?: string
}

// A rating picked by clicking the same symbols the recipe page shows. Real radios underneath,
// so the arrow keys work.
export const ScalePicker = ({
  label,
  value,
  onChange,
  renderSymbol,
  max = 5,
  onClear,
  error,
}: ScalePickerProps): ReactElement => {
  const name = useId()
  const [hovered, setHovered] = useState<number>()
  const litUpTo = hovered ?? value ?? 0
  const steps = Array.from({ length: max }, (_, index) => index + 1)

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <span aria-hidden='true'>{label}</span>
        <div
          role='radiogroup'
          aria-label={label}
          className='flex items-center'
        >
          {onClear && (
            <label className='mr-1 flex h-6 cursor-pointer items-center rounded px-1 text-xs has-checked:text-text has-focus-visible:ring-2 has-focus-visible:ring-primary'>
              <input
                type='radio'
                name={name}
                aria-label={`${label} none`}
                checked={value === undefined}
                onChange={onClear}
                className='sr-only'
              />
              None
            </label>
          )}
          {steps.map((step) => (
            <label
              key={step}
              onMouseEnter={() => setHovered(step)}
              onMouseLeave={() => setHovered(undefined)}
              className='flex h-6 min-w-6 cursor-pointer items-center justify-center rounded has-focus-visible:ring-2 has-focus-visible:ring-primary md:min-w-3'
            >
              <input
                type='radio'
                name={name}
                aria-label={`${label} ${step} of ${max}`}
                checked={value === step}
                onChange={() => onChange(step)}
                className='sr-only'
              />
              {renderSymbol(step <= litUpTo)}
            </label>
          ))}
        </div>
      </div>
      {error && (
        <span role='alert' className='text-xs text-red-400'>
          {error}
        </span>
      )}
    </div>
  )
}
