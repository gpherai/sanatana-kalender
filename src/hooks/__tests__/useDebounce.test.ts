import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    })

    // Update value
    rerender({ value: 'updated', delay: 500 })

    // Should NOT be updated yet
    expect(result.current).toBe('initial')

    // Advance time by 200ms (not enough)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('initial')

    // Advance remaining time (300ms + buffer)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('updated')
  })
})
