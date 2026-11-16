import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BASKET_STORAGE_KEY, recipeEntry } from '@/libs/basket'
import { readContentCatalog } from '@/libs/basket/contentCatalog'
import { BasketProvider } from '@/providers'

import { BasketView } from './BasketView'

// Send to cart ships dark: with the handoff off, it stays the placeholder
vi.mock('@/apiClients', () => ({
  useGroceryHandoffOptions: () => ({ data: undefined }),
  useGroceryStores: () => [vi.fn(), { loading: false }],
  useSendBasketToGrocer: () => [vi.fn(), { loading: false }],
}))

const RECIPES = {
  'spicy-turkey-chili': { title: 'Spicy Turkey Chili' },
  'turkey-taco-grillers': { title: 'Turkey Taco Grillers' },
}

const catalog = readContentCatalog()

const renderBasket = (): void => {
  render(
    <BasketProvider>
      <BasketView catalog={catalog} recipes={RECIPES} />
    </BasketProvider>
  )
}

const saveBasket = (slugs: string[]): void =>
  localStorage.setItem(
    BASKET_STORAGE_KEY,
    JSON.stringify({ entries: slugs.map((slug) => recipeEntry(catalog, slug)) })
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

  it('drops a saved recipe that no longer has basket data', () => {
    localStorage.setItem(
      BASKET_STORAGE_KEY,
      JSON.stringify({
        entries: [recipeEntry(catalog, 'spicy-turkey-chili'), { slug: 'gone', servings: 2 }],
      })
    )
    renderBasket()

    expect(
      screen.getAllByRole('button', { name: /^More servings of/ })
    ).toHaveLength(1)
    expect(localStorage.getItem(BASKET_STORAGE_KEY)).not.toContain('gone')
  })

  it('names the chain behind each price, and no store for the summary', () => {
    saveBasket(['spicy-turkey-chili'])
    renderBasket()

    expect(screen.getAllByText(/Walmart price/).length).toBeGreaterThan(0)
    expect(screen.getByText(/lowest prices found at national chains/)).toBeInTheDocument()
    expect(screen.queryByText(/lowest prices found at national chains and/)).not.toBeInTheDocument()
  })
})
