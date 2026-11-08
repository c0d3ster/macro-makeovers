import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BASKET_STORAGE_KEY } from '@/libs/basket'
import { BasketProvider } from '@/providers'

import { AddToBasketButton } from './AddToBasketButton'
import { BasketNavLink } from './BasketNavLink'

const renderWithBasket = (slug: string): void => {
  render(
    <BasketProvider>
      <BasketNavLink />
      <AddToBasketButton slug={slug} title='Spicy Turkey Chili' />
    </BasketProvider>
  )
}

describe('AddToBasketButton', () => {
  beforeEach(() => localStorage.clear())

  afterEach(() => cleanup())

  it('shows nothing for a recipe without price data', () => {
    renderWithBasket('no-price-data')

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('adds the recipe, updates the header count, and saves it', () => {
    renderWithBasket('spicy-turkey-chili')

    expect(
      screen.getByRole('link', { name: 'Basket, empty' })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add to basket' }))

    expect(screen.getByText('In your basket')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Basket, 1 recipe' })
    ).toBeInTheDocument()
    expect(localStorage.getItem(BASKET_STORAGE_KEY)).toContain(
      'spicy-turkey-chili'
    )
  })

  it('removes the recipe again', () => {
    renderWithBasket('spicy-turkey-chili')
    fireEvent.click(screen.getByRole('button', { name: 'Add to basket' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(
      screen.getByRole('button', { name: 'Add to basket' })
    ).toBeInTheDocument()
  })

  it('picks up a basket saved on an earlier visit', () => {
    localStorage.setItem(
      BASKET_STORAGE_KEY,
      JSON.stringify({ entries: [{ slug: 'spicy-turkey-chili', batches: 1 }] })
    )
    renderWithBasket('spicy-turkey-chili')

    expect(screen.getByText('In your basket')).toBeInTheDocument()
  })
})
