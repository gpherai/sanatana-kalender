import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  EVENT_TYPES,
  RECURRENCE_TYPES,
  IMPORTANCE_LEVELS,
  PAKSHAS,
  TITHIS,
  TITHIS_BY_PAKSHA,
  NAKSHATRAS,
  MAAS,
  MOON_PHASES,
  DEFAULT_LOCATION,
} from '../constants'

describe('Constants', () => {
  it('defines unique values for core enums', () => {
    const uniqueCount = (values: string[]) => new Set(values).size

    const eventValues = EVENT_TYPES.map((t) => t.value)
    expect(uniqueCount(eventValues)).toBe(eventValues.length)

    const recurrenceValues = RECURRENCE_TYPES.map((t) => t.value)
    expect(uniqueCount(recurrenceValues)).toBe(recurrenceValues.length)

    const importanceValues = IMPORTANCE_LEVELS.map((t) => t.value)
    expect(uniqueCount(importanceValues)).toBe(importanceValues.length)

    const pakshaValues = PAKSHAS.map((t) => t.value)
    expect(uniqueCount(pakshaValues)).toBe(pakshaValues.length)
  })

  it('defines expected counts for lunar and calendar lists', () => {
    expect(TITHIS).toHaveLength(30)
    expect(NAKSHATRAS).toHaveLength(27)
    expect(MAAS).toHaveLength(12)
    expect(MOON_PHASES).toHaveLength(8)
  })

  it('groups tithis by paksha consistently', () => {
    const shukla = TITHIS_BY_PAKSHA.Shukla
    const krishna = TITHIS_BY_PAKSHA.Krishna

    expect(shukla).toHaveLength(15)
    expect(krishna).toHaveLength(15)
    expect(shukla.every((t) => t.paksha === 'Shukla')).toBe(true)
    expect(krishna.every((t) => t.paksha === 'Krishna')).toBe(true)

    const allValues = [...shukla, ...krishna].map((t) => t.value)
    expect(new Set(allValues).size).toBe(TITHIS.length)
  })

  it('exposes category options in UI-friendly format', () => {
    expect(CATEGORIES.length).toBeGreaterThan(0)
    const sample = CATEGORIES[0]
    expect(sample).toHaveProperty('value')
    expect(sample).toHaveProperty('label')
    expect(sample).toHaveProperty('icon')
    expect(sample).toHaveProperty('color')
  })

  it('defines a valid default location', () => {
    expect(DEFAULT_LOCATION.name.length).toBeGreaterThan(0)
    expect(DEFAULT_LOCATION.timezone.length).toBeGreaterThan(0)
    expect(DEFAULT_LOCATION.lat).toBeGreaterThanOrEqual(-90)
    expect(DEFAULT_LOCATION.lat).toBeLessThanOrEqual(90)
    expect(DEFAULT_LOCATION.lon).toBeGreaterThanOrEqual(-180)
    expect(DEFAULT_LOCATION.lon).toBeLessThanOrEqual(180)
  })
})
