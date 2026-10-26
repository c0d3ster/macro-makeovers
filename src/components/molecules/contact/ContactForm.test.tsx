import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Toast } from '@/libs/Toast'

import { ContactForm } from './ContactForm'

// Mock only the API client that ContactForm actually uses
const mockSubmitContactForm = vi.fn()

vi.mock('@/apiClients', async () => {
  const actual = await vi.importActual('@/apiClients')
  return {
    ...actual,
    useSubmitContactForm: () => mockSubmitContactForm(),
  }
})

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock behavior
    mockSubmitContactForm.mockReturnValue([
      vi.fn().mockResolvedValue({ data: { submitContactForm: { id: '1' } } }),
      { loading: false, error: null },
    ])
  })

  it('renders all form fields', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Subject')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
  })

  it('renders submit button with correct text', () => {
    render(<ContactForm />)

    const submitButton = screen.getByRole('button', {
      name: 'Send Message',
    })

    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveTextContent('Send Message')
  })

  it('handles form submission successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Send Message',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(Toast.success).toHaveBeenCalledWith(
        "Message sent successfully! I'll get back to you within 24 hours."
      )
    })

    // Check that form was reset
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Subject')).toHaveValue('')
    expect(screen.getByLabelText('Message')).toHaveValue('')
  })

  it('handles form submission error', async () => {
    // Mock the mutation function to throw an error
    const mockMutation = vi.fn().mockRejectedValue(new Error('Server error'))
    mockSubmitContactForm.mockReturnValue([mockMutation, {} as any])

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Send Message',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(Toast.error).toHaveBeenCalledWith(
        'Failed to send message. Please try again or contact support if the issue persists.'
      )
    })
  })

  it('handles network errors', async () => {
    // Mock the mutation function to throw a network error
    const mockMutation = vi
      .fn()
      .mockRejectedValue(
        new Error('Network error. Please check your connection and try again.')
      )
    mockSubmitContactForm.mockReturnValue([mockMutation, {} as any])

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Send Message',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(Toast.error).toHaveBeenCalledWith(
        'Failed to send message. Please try again or contact support if the issue persists.'
      )
    })
  })

  it('validates required fields', async () => {
    render(<ContactForm />)

    // Submit the form without filling it out
    const submitButton = screen.getByRole('button', {
      name: 'Send Message',
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(Toast.error).toHaveBeenCalledWith(
        'Please fix the following errors: Name is required, Invalid email address, Subject is required, Message must be at least 10 characters'
      )
    })
  })

  it('shows loading state during submission', async () => {
    // Mock the mutation function to never resolve (for loading state)
    const mockMutation = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    mockSubmitContactForm.mockReturnValue([mockMutation, {} as any])

    render(<ContactForm />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Project Inquiry' },
    })
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'I would like to discuss a project.' },
    })

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: 'Send Message',
    })
    fireEvent.click(submitButton)

    // Check that button shows loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Sending...')
    })
  })
})
