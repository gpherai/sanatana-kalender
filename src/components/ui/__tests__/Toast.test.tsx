import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ToastProvider, useToast } from '../Toast'

// Test Component that uses the hook
function TestComponent() {
  const { showToast, success, error } = useToast()
  
  return (
    <div>
      <button onClick={() => showToast('Default Toast')}>Show Default</button>
      <button onClick={() => success('Success Toast')}>Show Success</button>
      <button onClick={() => error('Error Toast')}>Show Error</button>
    </div>
  )
}

describe('Toast System', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should show a toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // Click button using fireEvent
    fireEvent.click(screen.getByText('Show Default'))
    
    // Check if toast appeared
    expect(screen.getByText('Default Toast')).toBeInTheDocument()
    
    // Verify it disappears after 4 seconds
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    
    // Let's verify it is gone
    expect(screen.queryByText('Default Toast')).not.toBeInTheDocument()
  })

  it('should show different types of toasts', async () => {
     render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText('Show Success'))
    expect(screen.getByText('Success Toast')).toBeInTheDocument()
  })
})
