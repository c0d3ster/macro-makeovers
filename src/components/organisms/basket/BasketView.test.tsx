import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BASKET_STORAGE_KEY } from '@/libs/basket'
import { BasketProvider } from '@/providers'

import { BasketView } from './BasketView'

const RECIPES = {
  'spicy-turkey-chili': { title: 'Spicy Turkey Chili' },
  'turkey-taco-grillers': { title: 'Turkey Taco Grillers' },
}

const renderBasket = (): void => {
  render(
    <BasketProvider>
      <BasketView recipes={RECIPES} />
    </BasketProvider>
  )
}

const saveBasket = (slugs: string[]): void =>
  localStorage.setItem(
    BASKET_STORAGE_KEY,
    // No servings saved reads as each recipe's own
    JSON.stringify({ entries: slugs.map((slug) => ({ slug })) })
  )

describe('BasketView', () => {
  beforeEach(() => localStorage.clear())

  afterEach(() => cleanup())

  it('points to the recipes when the basket is empty', () => {
    renderBasket()

    expect(screen.getByText('Your basket is empty')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Browse recipes' })
    ).toHaveAttribute('href', '/recipes')
  })

  it('shows the trip cost, the list by store section, and Send to cart', () => {
    saveBasket(['spicy-turkey-chili', 'turkey-taco-grillers'])
    renderBasket()

    expect(screen.getByText('before tax')).toBeInTheDocument()
    // Bundling saves something, so the trip is set against the recipes as they normally cost
    expect(
      screen.getByRole('columnheader', { name: 'Normally' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Produce' })).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Ground turkey 93\/7/ })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Send to cart' }))

    expect(screen.getByText(/coming with the paid plan/)).toBeInTheDocument()
  })

  it('adds the suggested recipe', () => {
    saveBasket(['spicy-turkey-chili'])
    renderBasket()

    fireEvent.click(screen.getByRole('button', { name: 'Add it' }))

    expect(
      screen.getAllByRole('button', { name: /^More servings of/ })
    ).toHaveLength(2)
  })
})
