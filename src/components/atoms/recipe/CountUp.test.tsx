import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CountUp } from './CountUp'

describe('CountUp', () => {
  it('keeps the real number in the text', () => {
    render(<CountUp value={520} />)

    expect(screen.getByText('520')).toBeInTheDocument()
  })

  it('hands the number to the CSS counter', () => {
    render(<CountUp value={520} />)

    expect(screen.getByText('520').style.getPropertyValue('--count')).toBe(
      '520'
    )
  })
})
