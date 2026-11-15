import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Grocer } from '@/graphql/generated/graphql'
import { BASKET_STORAGE_KEY } from '@/libs/basket'
import { BasketProvider } from '@/providers'

import { SendToCart } from './SendToCart'

const mocks = vi.hoisted(() => ({
  options: undefined as unknown,
  findStores: vi.fn(),
  stores: undefined as unknown,
  send: vi.fn(),
}))

vi.mock('@/apiClients', () => ({
  useGroceryHandoffOptions: () => ({
    data: mocks.options ? { groceryHandoffOptions: mocks.options } : undefined,
  }),
  useGroceryStores: () => [
    mocks.findStores,
    { loading: false, data: mocks.stores ? { groceryStores: mocks.stores } : undefined },
  ],
  useSendBasketToGrocer: () => [mocks.send, { loading: false }],
}))

const options = (overrides: Record<string, unknown> = {}) => ({
  enabled: true,
  signedIn: true,
  hasPaidAccess: true,
  grocers: [
    { grocer: Grocer.Kroger, connected: true },
    { grocer: Grocer.Instacart, connected: true },
  ],
  remembered: null,
  defaultGrocer: null,
  disclosure: 'We may earn a commission when you check out through Instacart.',
  ...overrides,
})

const renderSendToCart = (): void => {
  render(
    <BasketProvider>
      <SendToCart />
    </BasketProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Send to cart' }))
}

describe('SendToCart', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      BASKET_STORAGE_KEY,
      JSON.stringify({ entries: [{ slug: 'spicy-turkey-chili' }] })
    )
    mocks.options = undefined
    mocks.stores = undefined
    vi.clearAllMocks()
  })

  afterEach(() => cleanup())

  it('stays a placeholder while the handoff is off', () => {
    renderSendToCart()

    expect(screen.getByText(/coming with the paid plan/)).toBeInTheDocument()
  })

  it('shows free members the upgrade prompt, not the picker', () => {
    mocks.options = options({ hasPaidAccess: false })
    renderSendToCart()

    expect(screen.getByText(/part of the paid plan/)).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('asks a first-time member for a zip, then preselects Kroger and its store', () => {
    mocks.options = options()
    mocks.stores = {
      defaultGrocer: Grocer.Kroger,
      krogerStores: [{ id: 's1', name: 'Kroger Downtown', address: '1 Main St' }],
    }
    renderSendToCart()

    fireEvent.change(screen.getByLabelText('Your zip code'), { target: { value: '45202' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find stores' }))

    expect(mocks.findStores).toHaveBeenCalledWith({ variables: { zip: '45202' } })
    expect(screen.getByRole('radio', { name: /Kroger/ })).toBeChecked()
    expect(screen.getByLabelText('Pickup store')).toHaveValue('s1')
    expect(screen.getByText(/We may earn a commission/)).toBeInTheDocument()
  })

  it('warns about Instacart prices and uses its required button text', () => {
    mocks.options = options()
    renderSendToCart()

    fireEvent.click(screen.getByRole('radio', { name: /Instacart/ }))

    expect(screen.getByText(/charge more than their shelf prices/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shop on Instacart' })).toBeEnabled()
  })

  it('sends the basket and lists what the grocer could not match', async () => {
    mocks.options = options({
      remembered: { grocer: Grocer.Instacart, storeId: null, storeName: null, zip: '45202' },
      defaultGrocer: Grocer.Instacart,
    })
    mocks.send.mockResolvedValue({
      data: {
        sendBasketToGrocer: {
          grocer: Grocer.Instacart,
          url: 'https://instacart.example/list',
          matchedCount: 9,
          unmatched: [{ key: 'achiote', name: 'Achiote paste', display: '1 × 3.5 oz' }],
        },
      },
    })
    renderSendToCart()

    fireEvent.click(screen.getByRole('button', { name: 'Shop on Instacart' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Open your list on Instacart' })).toHaveAttribute(
        'href',
        'https://instacart.example/list'
      )
    )

    expect(screen.getByText(/Achiote paste/)).toBeInTheDocument()
    expect(mocks.send).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          grocer: Grocer.Instacart,
          includePantry: false,
          checked: [],
          zip: '45202',
          entries: [{ slug: 'spicy-turkey-chili', servings: expect.any(Number) }],
        }),
      },
    })
  })

  it('sends a member who has not connected Kroger to sign in', () => {
    mocks.options = options({
      grocers: [{ grocer: Grocer.Kroger, connected: false }],
      remembered: { grocer: Grocer.Kroger, storeId: 's1', storeName: 'Kroger', zip: '45202' },
      defaultGrocer: Grocer.Kroger,
    })
    renderSendToCart()

    expect(screen.getByRole('link', { name: 'Connect your Kroger account' })).toHaveAttribute(
      'href',
      '/api/grocery/kroger/connect'
    )
  })

  it('shows a clear message when the send fails, and points back to the list', async () => {
    mocks.options = options({
      remembered: { grocer: Grocer.Instacart, storeId: null, storeName: null, zip: null },
    })
    mocks.send.mockRejectedValue({
      errors: [{ message: 'Instacart could not make your list.', extensions: { code: 'GROCER_UNAVAILABLE' } }],
    })
    renderSendToCart()

    fireEvent.click(screen.getByRole('button', { name: 'Shop on Instacart' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Instacart could not make your list.')
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/copy the shopping list/)
  })
})
