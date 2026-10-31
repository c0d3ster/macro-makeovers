'use client'

import type { ReactElement, ReactNode } from 'react'

import { useState } from 'react'

type SymbolScaleProps = {
  label: string
  // Said after the value for screen readers, like " minutes"
  unit?: string
  values: number[]
  // Current "up to" value, undefined for no limit
  value?: number
  // Values that would return nothing on top of the other filters. They keep their color and
  // only stop taking clicks, so the scale still reads the same.
  disabled?: number[]
  onChange: (value: number | undefined) => void
  // Draws one value, lit or dimmed
  renderSymbol: (isLit: boolean, value: number) => ReactNode
  buttonClassName?: string
}

// Hovering a symbol lights everything up to it, and clicking limits the recipes to that value
// and below. Clicking the current value clears the limit.
export const SymbolScale = ({
  label,
  unit = '',
  values,
  value,
  disabled = [],
  onChange,
  renderSymbol,
  buttonClassName = 'h-11 min-w-9 lg:h-8 lg:min-w-5',
}: SymbolScaleProps): ReactElement => {
  const [hovered, setHovered] = useState<number>()
  const litUpTo = hovered ?? value ?? 0

  return (
    <div role='group' aria-label={label} className='flex items-center gap-2'>
      <span className='text-xs font-medium text-text-muted'>{label}</span>
      <div
        className='ml-auto flex items-center lg:ml-0'
        onMouseLeave={() => setHovered(undefined)}
      >
        {values.map((item) => {
          const isSelected = value === item

          return (
            <button
              key={item}
              type='button'
              disabled={!isSelected && disabled.includes(item)}
              aria-label={
                isSelected
                  ? `${label}: clear limit`
                  : `${label}: up to ${item}${unit}`
              }
              aria-pressed={isSelected}
              onMouseEnter={() => setHovered(item)}
              onFocus={() => setHovered(item)}
              onBlur={() => setHovered(undefined)}
              onClick={() => onChange(isSelected ? undefined : item)}
              className={`flex cursor-pointer items-center justify-center rounded px-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed ${buttonClassName}`}
            >
              {renderSymbol(item <= litUpTo, item)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
