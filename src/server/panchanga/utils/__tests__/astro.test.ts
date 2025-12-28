import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  riseTransQueue,
  revjulResults,
  mockCalcResult,
  mockPhenoResult,
  mockAyanamsa,
  sweJulday,
  sweRiseTrans,
  sweRevjul,
  sweCalcUt,
  swePhenoUt,
  sweGetAyanamsa,
} = vi.hoisted(() => {
  const riseTransQueue: number[] = []
  const revjulResults = new Map<number, { year: number; month: number; day: number; hour: number }>()
  const mockCalcResult = {
    value: { longitude: 0, latitude: 0, distance: 0, speed: 0 },
  }
  const mockPhenoResult = {
    value: { phaseAngle: 0, phase: 0 },
  }
  const mockAyanamsa = { value: 0 }

  const sweJulday = vi.fn(() => 0)
  const sweRiseTrans = vi.fn(
    (
      _tjd: number,
      _ipl: number,
      _starname: string,
      _epheFlag: number,
      _rsmi: number,
      _geolon: number,
      _geolat: number,
      _geoalt: number,
      _atpress: number,
      _attemp: number,
      cb: (result: { error?: string; transitTime?: number }) => void
    ) => {
      const transitTime = riseTransQueue.shift()
      if (typeof transitTime === 'number') {
        cb({ transitTime })
      } else {
        cb({ error: 'no transit' })
      }
    }
  )
  const sweRevjul = vi.fn((jd: number) => {
    return revjulResults.get(jd) ?? { year: 2000, month: 1, day: 1, hour: 0 }
  })
  const sweCalcUt = vi.fn(
    (
      _jd: number,
      _ipl: number,
      _iflag: number,
      cb: (result: {
        error?: string
        longitude: number
        latitude: number
        distance: number
        speed: number
      }) => void
    ) => {
      cb(mockCalcResult.value)
    }
  )
  const swePhenoUt = vi.fn(
    (
      _jd: number,
      _ipl: number,
      _flags: number,
      cb: (result: { error?: string; phaseAngle: number; phase: number }) => void
    ) => {
      cb(mockPhenoResult.value)
    }
  )
  const sweGetAyanamsa = vi.fn((_jd: number, cb: (value: number) => void) => {
    cb(mockAyanamsa.value)
  })

  return {
    riseTransQueue,
    revjulResults,
    mockCalcResult,
    mockPhenoResult,
    mockAyanamsa,
    sweJulday,
    sweRiseTrans,
    sweRevjul,
    sweCalcUt,
    swePhenoUt,
    sweGetAyanamsa,
  }
})

vi.mock('swisseph', () => ({
  swe_set_sid_mode: vi.fn(),
  swe_julday: sweJulday,
  swe_rise_trans: sweRiseTrans,
  swe_revjul: sweRevjul,
  swe_calc_ut: sweCalcUt,
  swe_pheno_ut: swePhenoUt,
  swe_get_ayanamsa_ut: sweGetAyanamsa,
  SE_SIDM_LAHIRI: 1,
  SE_GREG_CAL: 1,
  SE_SUN: 0,
  SE_MOON: 1,
  SEFLG_MOSEPH: 2,
  SE_CALC_RISE: 4,
  SE_CALC_SET: 8,
  SE_BIT_DISC_CENTER: 16,
}))

import {
  calculateMoonriseMoonset,
  calculateSunriseSunset,
  findEventEnd,
  getAyanamsa,
  swe_calc_ut,
  swe_pheno_ut,
} from '../astro'

describe('Astro Utilities', () => {
  beforeEach(() => {
    riseTransQueue.length = 0
    revjulResults.clear()

    mockCalcResult.value = { longitude: 0, latitude: 0, distance: 0, speed: 0 }
    mockPhenoResult.value = { phaseAngle: 0, phase: 0 }
    mockAyanamsa.value = 0

    sweJulday.mockClear()
    sweRiseTrans.mockClear()
    sweRevjul.mockClear()
    sweCalcUt.mockClear()
    swePhenoUt.mockClear()
    sweGetAyanamsa.mockClear()
  })

  it('finds an event crossing without wrap', async () => {
    const startJD = 100
    const result = await findEventEnd(
      startJD,
      async (jd) => jd - startJD,
      0.2,
      30
    )

    expect(result).not.toBeNull()
    expect(Math.abs((result ?? 0) - 100.2)).toBeLessThan(0.001)
  })

  it('finds an event crossing with wrap-around', async () => {
    const startJD = 200
    const result = await findEventEnd(
      startJD,
      async (jd) => ((jd - startJD) + 29.8) % 30,
      0.1,
      30
    )

    expect(result).not.toBeNull()
    expect(Math.abs((result ?? 0) - 200.3)).toBeLessThan(0.01)
  })

  it('returns null when no bracket is found', async () => {
    const startJD = 300
    const result = await findEventEnd(startJD, async () => 1, 10, 30)
    expect(result).toBeNull()
  })

  it('wraps swe_calc_ut results', async () => {
    mockCalcResult.value = { longitude: 12, latitude: 3, distance: 1.5, speed: 0.1 }

    await expect(swe_calc_ut(1, 2, 3)).resolves.toEqual(mockCalcResult.value)
    expect(sweCalcUt).toHaveBeenCalledWith(1, 2, 3, expect.any(Function))
  })

  it('rejects swe_calc_ut when Swiss Ephemeris returns an error', async () => {
    mockCalcResult.value = {
      error: 'bad',
      longitude: 0,
      latitude: 0,
      distance: 0,
      speed: 0,
    }

    await expect(swe_calc_ut(1, 2, 3)).rejects.toThrow('bad')
  })

  it('wraps swe_pheno_ut results', async () => {
    mockPhenoResult.value = { phaseAngle: 120, phase: 0.42 }

    await expect(swe_pheno_ut(4, 5, 6)).resolves.toEqual({
      phaseAngle: 120,
      phaseIllum: 0.42,
    })
    expect(swePhenoUt).toHaveBeenCalledWith(4, 5, 6, expect.any(Function))
  })

  it('rejects swe_pheno_ut when Swiss Ephemeris returns an error', async () => {
    mockPhenoResult.value = { error: 'nope', phaseAngle: 0, phase: 0 }

    await expect(swe_pheno_ut(4, 5, 6)).rejects.toThrow('nope')
  })

  it('returns sunrise and sunset data for a date', async () => {
    riseTransQueue.push(111, 222)
    revjulResults.set(111, { year: 2025, month: 1, day: 1, hour: 6 })
    revjulResults.set(222, { year: 2025, month: 1, day: 1, hour: 18 })

    const loc = { name: 'Test', lat: 1, lon: 2, tz: 'UTC' }

    const result = await calculateSunriseSunset('2025-01-01', loc)

    expect(result.sunriseJD).toBe(111)
    expect(result.sunsetJD).toBe(222)
    expect(result.sunriseTime.hour).toBe(6)
    expect(result.sunsetTime.hour).toBe(18)
    expect(result.sunriseTime.zoneName).toBe('UTC')

    expect(sweJulday).toHaveBeenCalledWith(2025, 1, 1, 0, 1)
    expect(sweRiseTrans).toHaveBeenCalledTimes(2)
    expect(sweRiseTrans.mock.calls[0][1]).toBe(0)
    expect(sweRiseTrans.mock.calls[1][1]).toBe(0)
    expect(sweRiseTrans.mock.calls[0][4]).toBe(4 | 16)
    expect(sweRiseTrans.mock.calls[1][4]).toBe(8 | 16)
    expect(sweRiseTrans.mock.calls[0][5]).toBe(2)
    expect(sweRiseTrans.mock.calls[0][6]).toBe(1)
  })

  it('returns moonrise and moonset data for a date', async () => {
    riseTransQueue.push(333, 444)
    revjulResults.set(333, { year: 2025, month: 1, day: 2, hour: 3 })
    revjulResults.set(444, { year: 2025, month: 1, day: 2, hour: 21 })

    const loc = { name: 'Test', lat: 10, lon: 20, tz: 'UTC' }

    const result = await calculateMoonriseMoonset('2025-01-02', loc)

    expect(result.moonriseJD).toBe(333)
    expect(result.moonsetJD).toBe(444)
    expect(result.moonriseTime.hour).toBe(3)
    expect(result.moonsetTime.hour).toBe(21)

    expect(sweRiseTrans).toHaveBeenCalledTimes(2)
    expect(sweRiseTrans.mock.calls[0][1]).toBe(1)
    expect(sweRiseTrans.mock.calls[1][1]).toBe(1)
    expect(sweRiseTrans.mock.calls[0][5]).toBe(20)
    expect(sweRiseTrans.mock.calls[0][6]).toBe(10)
  })

  it('returns the ayanamsa value', async () => {
    mockAyanamsa.value = 24.1

    await expect(getAyanamsa(123)).resolves.toBe(24.1)
    expect(sweGetAyanamsa).toHaveBeenCalledWith(123, expect.any(Function))
  })
})
