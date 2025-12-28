import { describe, it, expect, beforeEach, vi } from 'vitest'

const { checkDatabaseHealth, getPoolStats } = vi.hoisted(() => ({
  checkDatabaseHealth: vi.fn(),
  getPoolStats: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  checkDatabaseHealth,
  getPoolStats,
}))

import { GET } from '../health/route'

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns healthy status when database is up', async () => {
    checkDatabaseHealth.mockResolvedValue(true)
    getPoolStats.mockReturnValue({ totalCount: 5, idleCount: 2, waitingCount: 1 })

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('healthy')
    expect(json.checks.database.status).toBe('up')
    expect(json.checks.database.pool).toEqual({
      total: 5,
      idle: 2,
      waiting: 1,
    })
    expect(typeof json.version).toBe('string')
  })

  it('returns unhealthy status when database is down', async () => {
    checkDatabaseHealth.mockResolvedValue(false)
    getPoolStats.mockReturnValue({ totalCount: 0, idleCount: 0, waitingCount: 0 })

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.status).toBe('unhealthy')
    expect(json.checks.database.status).toBe('down')
  })
})
