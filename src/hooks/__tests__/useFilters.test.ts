import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilters, DEFAULT_FILTERS } from '../useFilters'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()
const mockPathname = '/events'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}))

describe('useFilters Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset search params
    const keys = Array.from(mockSearchParams.keys())
    keys.forEach(key => mockSearchParams.delete(key))
  })

  it('should return default filters when URL is empty', () => {
    const { result } = renderHook(() => useFilters())
    
    expect(result.current.filters).toEqual(DEFAULT_FILTERS)
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('should parse filters from URL', () => {
    mockSearchParams.set('search', 'diwali')
    mockSearchParams.set('types', 'FESTIVAL')
    // Note: categories must match VALID_CATEGORIES to be parsed
    // Assuming 'ganesha' is valid based on constants
    
    // We need to know VALID_CATEGORIES from constants file to test valid parsing.
    // But since the hook imports them, we assume real constants are used.
    // Let's rely on basic types which usually includes FESTIVAL.
    
    const { result } = renderHook(() => useFilters())
    
    expect(result.current.filters.search).toBe('diwali')
    expect(result.current.filters.eventTypes).toContain('FESTIVAL')
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('should set a filter (search)', () => {
    const { result } = renderHook(() => useFilters())
    
    act(() => {
      result.current.setFilter('search', 'new search')
    })
    
    expect(mockPush).toHaveBeenCalledWith('/events?search=new+search', expect.anything())
  })

  it('should toggle array filters', () => {
    // Start with empty
    const { result } = renderHook(() => useFilters())
    
    // Add value
    act(() => {
      result.current.toggleFilter('eventTypes', 'PUJA')
    })
    
    // Expect URL update
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('types=PUJA'), expect.anything())
  })

  it('should clear all filters', () => {
    const { result } = renderHook(() => useFilters())
    
    act(() => {
      result.current.clearFilters()
    })
    
    expect(mockPush).toHaveBeenCalledWith('/events', expect.anything())
  })

  it('should count active filters correctly', () => {
    mockSearchParams.set('search', 'test')
    mockSearchParams.set('types', 'PUJA,FESTIVAL')
    
    const { result } = renderHook(() => useFilters())
    
    // Groups: Search (1) + Types (1) = 2
    expect(result.current.activeFilterCount).toBe(2)
    
    // Items: Search (1) + Puja (1) + Festival (1) = 3
    expect(result.current.activeFilterItemCount).toBe(3)
  })
})
