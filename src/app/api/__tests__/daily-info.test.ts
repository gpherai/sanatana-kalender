import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'
import { DEFAULT_LOCATION } from '@/lib/constants'
import type { DailyPanchangaFull } from '@/server/panchanga'

const { calculateDaily, calculateRange } = vi.hoisted(() => ({
  calculateDaily: vi.fn(),
  calculateRange: vi.fn(),
}))

vi.mock('@/services/panchanga.service', () => ({
  panchangaService: {
    calculateDaily,
    calculateRange,
  },
}))

import { GET } from '../daily-info/route'

const basePanchanga: DailyPanchangaFull = {
  date: '2025-01-01',
  location: { name: 'Test', lat: 1, lon: 2, tz: 'UTC' },
  sunriseLocal: '06:00:00',
  sunsetLocal: '18:00:00',
  sunriseUtcIso: '2025-01-01T06:00:00Z',
  sunsetUtcIso: '2025-01-01T18:00:00Z',
  moonriseLocal: '07:00:00',
  moonsetLocal: '19:00:00',
  moonriseUtcIso: '2025-01-01T07:00:00Z',
  moonsetUtcIso: '2025-01-01T19:00:00Z',
  ayanamsa: { id: 1, name: 'Lahiri', degrees: 24.1 },
  vara: { name: 'Somavara', computedAt: 'sunrise' },
  tithi: { number: 1, name: 'Pratipada', paksha: 'Shukla' },
  nakshatra: { number: 1, name: 'Ashwini', pada: 1 },
  yoga: { number: 1, name: 'Vishkumbha' },
  karana: { number: 1, name: 'Kimstughna', type: 'Fixed' },
  moon: { illuminationPct: 10, phaseAngleDeg: 0, waxing: true },
  meta: { engine: 'swisseph', flags: ['SEFLG_MOSEPH'], swissephVersion: '2.0.0' },
}

describe('GET /api/daily-info', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.userPreference.findUnique.mockResolvedValue(null)
  })

  it('rejects invalid date formats', async () => {
    const request = new NextRequest('http://localhost/api/daily-info?date=bad-date')

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.message).toBe('Ongeldige datum formaat. Gebruik YYYY-MM-DD.')
  })

  it('rejects ranges where start is after end', async () => {
    const request = new NextRequest(
      'http://localhost/api/daily-info?start=2025-02-01&end=2025-01-01'
    )

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.message).toBe('Startdatum moet voor einddatum liggen.')
  })

  it('returns daily info for a valid date', async () => {
    calculateDaily.mockResolvedValue(basePanchanga)

    const request = new NextRequest('http://localhost/api/daily-info?date=2025-01-01')

    const response = await GET(request)
    const json = await response.json()

    expect(calculateDaily).toHaveBeenCalledWith(
      expect.any(Date),
      expect.objectContaining({
        name: DEFAULT_LOCATION.name,
        lat: DEFAULT_LOCATION.lat,
        lon: DEFAULT_LOCATION.lon,
      }),
      DEFAULT_LOCATION.timezone
    )
    expect(response.status).toBe(200)
    expect(json.date).toBe('2025-01-01')
    expect(json.moonPhasePercent).toBe(10)
  })

  it('returns daily info for a valid range', async () => {
    calculateRange.mockResolvedValue([
      basePanchanga,
      {
        ...basePanchanga,
        date: '2025-01-02',
        moon: { illuminationPct: 25, phaseAngleDeg: 0, waxing: true },
      },
    ])

    const request = new NextRequest(
      'http://localhost/api/daily-info?start=2025-01-01&end=2025-01-02'
    )

    const response = await GET(request)
    const json = await response.json()

    expect(calculateRange).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      expect.objectContaining({
        name: DEFAULT_LOCATION.name,
        lat: DEFAULT_LOCATION.lat,
        lon: DEFAULT_LOCATION.lon,
      }),
      DEFAULT_LOCATION.timezone
    )
    expect(response.status).toBe(200)
    expect(json).toHaveLength(2)
    expect(json[1].date).toBe('2025-01-02')
  })

  it('rejects ranges longer than 90 days', async () => {
    const request = new NextRequest(
      'http://localhost/api/daily-info?start=2025-01-01&end=2025-04-15'
    )

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.message).toBe('Maximum bereik is 90 dagen.')
    expect(calculateRange).not.toHaveBeenCalled()
  })
})
