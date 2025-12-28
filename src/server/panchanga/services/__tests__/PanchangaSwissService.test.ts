import { DateTime } from 'luxon'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  sweCalcUt,
  swePhenoUt,
  findEventEnd,
  getAyanamsa,
  revjulMap,
  sweSetSidMode,
} = vi.hoisted(() => {
  const calculateSunriseSunset = vi.fn()
  const calculateMoonriseMoonset = vi.fn()
  const sweCalcUt = vi.fn()
  const swePhenoUt = vi.fn()
  const findEventEnd = vi.fn()
  const getAyanamsa = vi.fn()
  const revjulMap = new Map<number, { year: number; month: number; day: number; hour: number }>()
  const sweSetSidMode = vi.fn()

  return {
    calculateSunriseSunset,
    calculateMoonriseMoonset,
    sweCalcUt,
    swePhenoUt,
    findEventEnd,
    getAyanamsa,
    revjulMap,
    sweSetSidMode,
  }
})

vi.mock('../../utils/astro', () => ({
  calculateSunriseSunset,
  calculateMoonriseMoonset,
  swe_calc_ut: sweCalcUt,
  swe_pheno_ut: swePhenoUt,
  findEventEnd,
  getAyanamsa,
}))

vi.mock('swisseph', () => ({
  swe_set_sid_mode: sweSetSidMode,
  swe_revjul: (jd: number) =>
    revjulMap.get(jd) ?? { year: 2025, month: 1, day: 1, hour: 0 },
  SE_SIDM_LAHIRI: 1,
  SE_GREG_CAL: 1,
  SE_SUN: 0,
  SE_MOON: 1,
  SEFLG_SIDEREAL: 2,
  SEFLG_MOSEPH: 4,
  SEFLG_SPEED: 8,
}))

import { PanchangaSwissService } from '../PanchangaSwissService'

describe('PanchangaSwissService', () => {
  const location = { name: 'Test', lat: 1, lon: 2, tz: 'UTC' }

  beforeEach(() => {
    vi.clearAllMocks()
    revjulMap.clear()
  })

  it('maps computed values into panchanga response', async () => {
    calculateSunriseSunset.mockResolvedValue({
      sunriseJD: 100,
      sunsetJD: 200,
      sunriseTime: DateTime.fromISO('2025-01-06T06:00:00', { zone: 'UTC' }),
      sunsetTime: DateTime.fromISO('2025-01-06T18:00:00', { zone: 'UTC' }),
    })
    calculateMoonriseMoonset.mockResolvedValue({
      moonriseJD: 101,
      moonsetJD: 201,
      moonriseTime: DateTime.fromISO('2025-01-06T07:00:00', { zone: 'UTC' }),
      moonsetTime: DateTime.fromISO('2025-01-06T19:00:00', { zone: 'UTC' }),
    })

    sweCalcUt
      .mockResolvedValueOnce({ longitude: 20, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 140, latitude: 0, distance: 1, speed: 0 })
    swePhenoUt.mockResolvedValue({ phaseAngle: 90, phaseIllum: 0.42 })

    findEventEnd
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(1001)
      .mockResolvedValueOnce(1002)
      .mockResolvedValueOnce(1003)
    getAyanamsa.mockResolvedValue(24.1)

    revjulMap.set(1000, { year: 2025, month: 1, day: 6, hour: 12.5 })
    revjulMap.set(1001, { year: 2025, month: 1, day: 6, hour: 13 })
    revjulMap.set(1002, { year: 2025, month: 1, day: 6, hour: 14 })
    revjulMap.set(1003, { year: 2025, month: 1, day: 6, hour: 15 })

    const service = new PanchangaSwissService()
    const result = await service.computeDaily('2025-01-06', location)

    expect(result.date).toBe('2025-01-06')
    expect(result.sunriseLocal).toBe('06:00:00')
    expect(result.sunsetLocal).toBe('18:00:00')
    expect(result.moonriseLocal).toBe('07:00:00')
    expect(result.moonsetLocal).toBe('19:00:00')
    expect(result.vara.name).toBe('Somavara')
    expect(result.tithi).toEqual(expect.objectContaining({
      number: 11,
      name: 'Ekadashi',
      paksha: 'Shukla',
      endLocal: '12:30:00',
    }))
    expect(result.nakshatra).toEqual(expect.objectContaining({
      number: 11,
      name: 'Purva Phalguni',
      pada: 2,
      endLocal: '13:00:00',
    }))
    expect(result.yoga).toEqual(expect.objectContaining({
      number: 13,
      name: 'Vyaghata',
      endLocal: '14:00:00',
    }))
    expect(result.karana).toEqual(expect.objectContaining({
      number: 21,
      name: 'Vanija',
      type: 'Movable',
      endLocal: '15:00:00',
    }))
    expect(result.moon).toEqual(expect.objectContaining({
      illuminationPct: 42,
      phaseAngleDeg: 90,
      waxing: true,
    }))
    expect(result.rahuKalam).toEqual({ startLocal: '07:30', endLocal: '09:00' })
    expect(result.yamagandam).toEqual({ startLocal: '10:30', endLocal: '12:00' })
    expect(result.ayanamsa.degrees).toBe(24.1)

    expect(sweCalcUt).toHaveBeenCalledTimes(2)
    expect(swePhenoUt).toHaveBeenCalledWith(100, 1, 14)
    expect(getAyanamsa).toHaveBeenCalledWith(100)
    expect(sweSetSidMode).toHaveBeenCalled()
  })

  it('uses fixed karana when index falls on fixed values', async () => {
    calculateSunriseSunset.mockResolvedValue({
      sunriseJD: 10,
      sunsetJD: 20,
      sunriseTime: DateTime.fromISO('2025-01-05T06:00:00', { zone: 'UTC' }),
      sunsetTime: DateTime.fromISO('2025-01-05T18:00:00', { zone: 'UTC' }),
    })
    calculateMoonriseMoonset.mockResolvedValue({
      moonriseJD: 11,
      moonsetJD: 21,
      moonriseTime: DateTime.fromISO('2025-01-05T07:00:00', { zone: 'UTC' }),
      moonsetTime: DateTime.fromISO('2025-01-05T19:00:00', { zone: 'UTC' }),
    })

    sweCalcUt
      .mockResolvedValueOnce({ longitude: 50, latitude: 0, distance: 1, speed: 0 })
      .mockResolvedValueOnce({ longitude: 50, latitude: 0, distance: 1, speed: 0 })
    swePhenoUt.mockResolvedValue({ phaseAngle: 45, phaseIllum: 0.1 })

    findEventEnd.mockResolvedValue(null)
    getAyanamsa.mockResolvedValue(24.5)

    const service = new PanchangaSwissService()
    const result = await service.computeDaily('2025-01-05', location)

    expect(result.karana).toEqual(expect.objectContaining({
      number: 1,
      name: 'Kimstughna',
      type: 'Fixed',
    }))
    expect(result.karana.endLocal).toBeUndefined()
    expect(findEventEnd).toHaveBeenCalledTimes(4)
  })
})
