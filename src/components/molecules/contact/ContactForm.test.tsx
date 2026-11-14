import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Toast } from '@/libs/Toast'

import { ContactForm } from './ContactForm'

const mockUseSubmit = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useSubmitContactForm: () => mockUseSubmit(),
  }
})

const DISH = 'What dish should we make over?'
const RECIPE = 'Recipe link (optional)'
const DETAILS = 'Anything else? (optional)'

const mockMutation = (mutate: ReturnType<typeof vi.fn>): void => {
  mockUseSubmit.mockReturnValue([mutate, { loading: false, error: null }])
}

const fill = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

const fillRequired = (): void => {
  fill('Name', 'Jane Doe')
  fill('Email', 'jane@example.com')
  fill(DISH, 'Chicken parm')
}

const submit = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Send my idea' }))
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutation(
      vi.fn().mockResolvedValue({ data: { submitContactForm: { id: '1' } } })
    )
  })

  it('asks for a makeover idea', () => {
    render(<ContactForm />)

    expect(
      screen.getByRole('heading', { name: 'Have an idea for a macro makeover?' })
    ).toBeInTheDocument()

    const labels = ['Name', 'Email', DISH, RECIPE, DETAILS]
    labels.forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    )
  })

  it('sends the idea and resets the form', async () => {
    const mutate = vi
      .fn()
      .mockResolvedValue({ data: { submitContactForm: { id: '1' } } })
    mockMutation(mutate)
    render(<ContactForm />)

    fillRequired()
    fill(RECIPE, 'https://example.com/chicken-parm')
    fill(DETAILS, 'Keep the crispy crust.')
    submit()

    await waitFor(() =>
      expect(Toast.success).toHaveBeenCalledWith(
        'Thanks! Your makeover idea is in.'
      )
    )

    expect(mutate).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          dish: 'Chicken parm',
          recipeUrl: 'https://example.com/chicken-parm',
          details: 'Keep the crispy crust.',
        },
      },
    })
    expect(screen.getByLabelText(DISH)).toHaveValue('')
  })

  it('sends blank optional fields as null', async () => {
    const mutate = vi
      .fn()
      .mockResolvedValue({ data: { submitContactForm: { id: '1' } } })
    mockMutation(mutate)
    render(<ContactForm />)

    fillRequired()
    submit()

    await waitFor(() => expect(mutate).toHaveBeenCalled())

    expect(mutate.mock.calls[0]?.[0]).toMatchObject({
      variables: { input: { recipeUrl: null, details: null } },
    })
  })

  it('shows an error when sending fails', async () => {
    mockMutation(vi.fn().mockRejectedValue(new Error('Server error')))
    render(<ContactForm />)

    fillRequired()
    submit()

    await waitFor(() =>
      expect(Toast.error).toHaveBeenCalledWith(
        'Failed to send your idea. Please try again in a few minutes.'
      )
    )
  })

  it('validates the required fields', async () => {
    render(<ContactForm />)

    submit()

    await waitFor(() =>
      expect(Toast.error).toHaveBeenCalledWith(
        'Please fix the following errors: Name is required, Invalid email address, Tell us the dish'
      )
    )
  })

  it('rejects a recipe link that is not a full URL', async () => {
    render(<ContactForm />)

    fillRequired()
    fill(RECIPE, 'chicken parm recipe')
    submit()

    await waitFor(() =>
      expect(Toast.error).toHaveBeenCalledWith(
        'Please fix the following errors: Use a full link, like https://...'
      )
    )
  })

  it('shows a loading state while sending', async () => {
    mockMutation(vi.fn().mockImplementation(() => new Promise(() => {})))
    render(<ContactForm />)

    fillRequired()
    submit()

    expect(
      await screen.findByRole('button', { name: 'Sending...' })
    ).toBeDisabled()
  })
})
