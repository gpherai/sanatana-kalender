import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// MOCK SETUP
// =============================================================================

// Use vi.hoisted to ensure the mock function exists before vi.mock calls
const { mockComputeDaily } = vi.hoisted(() => {
  return { mockComputeDaily: vi.fn() }
})

// Mock the module
vi.mock('@/server/panchanga', () => {
  return {
    PanchangaSwissService: class {
      computeDaily = mockComputeDaily
    }
  }
})

// Import the service AFTER mocking
import { panchangaService } from '../panchanga.service'

// =============================================================================
// TEST DATA
// =============================================================================

const MOCK_LOCATION = {
  name: 'Den Haag',
  lat: 52.07,
  lon: 4.30,
  timezone: 'Europe/Amsterdam'
}

const MOCK_PANCHANGA_RESULT = {
  date: '2025-01-01',
  tithi: { name: 'Pratipada' },
  // ... minimal required fields
}

describe('Panchanga Service (with Caching)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    panchangaService.clearCache()
    
    // Setup default mock response
    mockComputeDaily.mockResolvedValue(MOCK_PANCHANGA_RESULT)
  })

  it('should call Swiss Service for fresh data', async () => {
    const date = new Date('2025-01-01')
    
    const result = await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    
    expect(result).toBe(MOCK_PANCHANGA_RESULT)
    expect(mockComputeDaily).toHaveBeenCalledTimes(1)
    expect(mockComputeDaily).toHaveBeenCalledWith('2025-01-01', expect.objectContaining({
      name: 'Den Haag'
    }))
  })

  it('should return cached data on second call (Caching check)', async () => {
    const date = new Date('2025-01-01')
    
    // First call: Should hit the "Swiss Service" (mock)
    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    expect(mockComputeDaily).toHaveBeenCalledTimes(1)
    
    // Second call: Should come from CACHE
    const result2 = await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    
    // Should still return correct data
    expect(result2).toBe(MOCK_PANCHANGA_RESULT)
    
    // But computeDaily should NOT have been called again
    expect(mockComputeDaily).toHaveBeenCalledTimes(1)
  })

  it('should clear cache correctly', async () => {
    const date = new Date('2025-01-01')
    
    // 1. Fill cache
    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    expect(mockComputeDaily).toHaveBeenCalledTimes(1)
    
    // 2. Clear cache
    panchangaService.clearCache()
    
    // 3. Call again -> Should call Swiss Service again
    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    expect(mockComputeDaily).toHaveBeenCalledTimes(2)
  })

  it('should expire cache after TTL', async () => {
    vi.useFakeTimers()
    const date = new Date('2025-01-01')

    // 1. Fill cache
    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    expect(mockComputeDaily).toHaveBeenCalledTimes(1)

    // 2. Fast forward time past TTL (24h + 1ms)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1)

    // 3. Call again -> Should call Swiss Service again because cache expired
    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    expect(mockComputeDaily).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('should handle date ranges correctly', async () => {
    const start = new Date('2025-01-01')
    const end = new Date('2025-01-03') // 3 days
    
    const results = await panchangaService.calculateRange(start, end, MOCK_LOCATION, 'Europe/Amsterdam')
    
    expect(results).toHaveLength(3)
    // 3 days calculated
    expect(mockComputeDaily).toHaveBeenCalledTimes(3)
    
    // Verify calls
    expect(mockComputeDaily).toHaveBeenCalledWith('2025-01-01', expect.anything())
    expect(mockComputeDaily).toHaveBeenCalledWith('2025-01-02', expect.anything())
    expect(mockComputeDaily).toHaveBeenCalledWith('2025-01-03', expect.anything())
  })

  it('uses timezone to derive the correct date string', async () => {
    const date = new Date(Date.UTC(2025, 0, 1, 23, 30, 0))

    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Asia/Tokyo')

    expect(mockComputeDaily).toHaveBeenCalledWith('2025-01-02', expect.anything())
  })

  it('caches per location (different locations should not share cache)', async () => {
    const date = new Date('2025-01-01')
    const locationA = { ...MOCK_LOCATION, lat: 52.07, lon: 4.3 }
    const locationB = { ...MOCK_LOCATION, lat: 52.08, lon: 4.31 }

    await panchangaService.calculateDaily(date, locationA, 'Europe/Amsterdam')
    await panchangaService.calculateDaily(date, locationB, 'Europe/Amsterdam')

    expect(mockComputeDaily).toHaveBeenCalledTimes(2)
  })

  it('does not cache failed computations', async () => {
    const date = new Date('2025-01-01')
    mockComputeDaily.mockRejectedValueOnce(new Error('boom'))

    await expect(
      panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')
    ).rejects.toThrow('boom')

    mockComputeDaily.mockResolvedValueOnce(MOCK_PANCHANGA_RESULT)

    await panchangaService.calculateDaily(date, MOCK_LOCATION, 'Europe/Amsterdam')

    expect(mockComputeDaily).toHaveBeenCalledTimes(2)
  })

  it('returns cache stats', () => {
    const stats = panchangaService.getCacheStats()

    expect(stats.size).toBe(0)
    expect(stats.maxSize).toBe(365)
    expect(stats.ttlMs).toBe(24 * 60 * 60 * 1000)
  })
})
