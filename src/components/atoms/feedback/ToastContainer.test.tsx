import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ToastContainer } from './ToastContainer'

// Mock react-toastify
vi.mock('react-toastify', () => ({
  ToastContainer: vi.fn(),
}))

// Mock the CSS import
vi.mock('react-toastify/dist/ReactToastify.css', () => ({}))

describe('ToastContainer', () => {
  it('renders ToastContainer with correct props', async () => {
    const { ToastContainer: MockedToastContainer } = await import(
      'react-toastify'
    )

    render(<ToastContainer />)

    const [callProps] = (MockedToastContainer as any).mock.calls[0]

    expect(callProps).toEqual({
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      newestOnTop: false,
      closeOnClick: true,
      rtl: false,
      pauseOnFocusLoss: true,
      draggable: true,
      pauseOnHover: true,
      theme: 'dark',
      closeButton: false,
      icon: false,
      className: 'mt-20',
    })
  })

  it('renders ToastContainer component', async () => {
    const { ToastContainer: MockedToastContainer } = await import(
      'react-toastify'
    )

    // Mock the component to return a div for testing
    ;(MockedToastContainer as any).mockReturnValue(
      <div data-testid='toast-container'>Toast Container</div>
    )

    render(<ToastContainer />)

    expect(screen.getByTestId('toast-container')).toBeInTheDocument()
  })

  it('has correct configuration for user experience', async () => {
    const { ToastContainer: MockedToastContainer } = await import(
      'react-toastify'
    )

    render(<ToastContainer />)

    const props = (MockedToastContainer as any).mock.calls[0][0]

    // Check positioning
    expect(props.position).toBe('top-right')

    // Check timing
    expect(props.autoClose).toBe(5000)

    // Check interaction settings
    expect(props.closeOnClick).toBe(true)
    expect(props.pauseOnFocusLoss).toBe(true)
    expect(props.pauseOnHover).toBe(true)
    expect(props.draggable).toBe(true)

    // Check visual settings
    expect(props.hideProgressBar).toBe(false)
    expect(props.newestOnTop).toBe(false)
    expect(props.rtl).toBe(false)
    expect(props.theme).toBe('dark')

    // Check button and icon settings
    expect(props.closeButton).toBe(false)
    expect(props.icon).toBe(false)

    // Check styling
    expect(props.className).toBe('mt-20')
  })

  it('maintains consistent configuration across renders', async () => {
    const { ToastContainer: MockedToastContainer } = await import(
      'react-toastify'
    )

    const { rerender } = render(<ToastContainer />)

    // Clear previous calls
    ;(MockedToastContainer as any).mockClear()

    // Re-render
    rerender(<ToastContainer />)

    const props = (MockedToastContainer as any).mock.calls[0][0]

    // Verify all props are the same
    expect(props.position).toBe('top-right')
    expect(props.autoClose).toBe(5000)
    expect(props.hideProgressBar).toBe(false)
    expect(props.newestOnTop).toBe(false)
    expect(props.closeOnClick).toBe(true)
    expect(props.rtl).toBe(false)
    expect(props.pauseOnFocusLoss).toBe(true)
    expect(props.draggable).toBe(true)
    expect(props.pauseOnHover).toBe(true)
    expect(props.theme).toBe('dark')
    expect(props.closeButton).toBe(false)
    expect(props.icon).toBe(false)
    expect(props.className).toBe('mt-20')
  })
})
