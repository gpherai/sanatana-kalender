import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock } from '../../__tests__/helpers/prisma-mock'
import { generateOccurrences, generateOccurrencesForEvents, getRecommendedWindow } from '../recurrence.service'
import type { Event, DailyInfo } from '@/generated/prisma/client'

// Mock event for testing
const MOCK_EVENT_YEARLY: Event = {
  id: 'evt_yearly',
  name: 'Maha Shivaratri',
  recurrenceType: 'YEARLY_LUNAR',
  tithi: 'CHATURDASHI_KRISHNA',
  maas: 'PHALGUNA',
  description: 'Great Night of Shiva',
  slug: 'maha-shivaratri',
  paksha: 'KRISHNA',
  categoryId: 'cat_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  priority: 1,
}

const MOCK_EVENT_MONTHLY: Event = {
  ...MOCK_EVENT_YEARLY,
  id: 'evt_monthly',
  name: 'Ekadashi',
  recurrenceType: 'MONTHLY_LUNAR',
  tithi: 'EKADASHI_SHUKLA',
  maas: null, // Monthly events apply to all months
}

const MOCK_EVENT_NONE: Event = {
  ...MOCK_EVENT_YEARLY,
  id: 'evt_none',
  name: 'One Time Event',
  recurrenceType: 'NONE',
}

describe('Recurrence Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateOccurrences', () => {
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-12-31')
    const options = { startDate, endDate }

    describe('YEARLY_LUNAR', () => {
      it('should generate occurrences based on database results', async () => {
        const mockDbResponse = [
          {
            date: new Date('2025-02-26T00:00:00.000Z'),
            tithiEndTime: '23:45',
            maas: 'PHALGUNA',
          },
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(MOCK_EVENT_YEARLY, options)

        expect(prismaMock.dailyInfo.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
            tithi: MOCK_EVENT_YEARLY.tithi,
          })
        }))

        expect(result).toHaveLength(1)
        expect(result[0].date).toEqual(new Date('2025-02-26T00:00:00.000Z'))
        expect(result[0].endTime).toBe('23:45')
      })

      it('should prefer matching maas when multiple results in the same year', async () => {
        const mockDbResponse = [
          {
            date: new Date('2025-02-10T00:00:00.000Z'),
            tithiEndTime: '10:00',
            maas: 'MAGHA',
          },
          {
            date: new Date('2025-02-26T00:00:00.000Z'),
            tithiEndTime: '23:45',
            maas: 'PHALGUNA',
          },
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(MOCK_EVENT_YEARLY, options)

        expect(result).toHaveLength(1)
        expect(result[0].date).toEqual(new Date('2025-02-26T00:00:00.000Z'))
        expect(result[0].endTime).toBe('23:45')
      })

      it('should handle empty database results gracefully', async () => {
        prismaMock.dailyInfo.findMany.mockResolvedValue([])

        const result = await generateOccurrences(MOCK_EVENT_YEARLY, options)

        expect(result).toEqual([])
      })

      it('should return empty array when tithi is missing', async () => {
        const eventWithoutTithi: Event = {
          ...MOCK_EVENT_YEARLY,
          tithi: null,
        }

        const result = await generateOccurrences(eventWithoutTithi, options)

        expect(result).toEqual([])
        expect(prismaMock.dailyInfo.findMany).not.toHaveBeenCalled()
      })
    })

    describe('MONTHLY_LUNAR', () => {
      it('should generate multiple occurrences for monthly events', async () => {
        const mockDbResponse = [
          { date: new Date('2025-01-11T00:00:00.000Z'), tithiEndTime: '10:00', maas: 'PAUSHA' },
          { date: new Date('2025-02-10T00:00:00.000Z'), tithiEndTime: '11:00', maas: 'MAGHA' },
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(MOCK_EVENT_MONTHLY, options)

        expect(result).toHaveLength(2)
        expect(result[0].date).toEqual(new Date('2025-01-11T00:00:00.000Z'))
        expect(result[1].date).toEqual(new Date('2025-02-10T00:00:00.000Z'))
      })

      it('should handle spanning tithis (consecutive days)', async () => {
        // Mock a tithi that spans two consecutive days (Jan 11 and Jan 12)
        const mockDbResponse = [
          { date: new Date('2025-01-11T00:00:00.000Z'), tithiEndTime: null, maas: 'PAUSHA' }, // Day 1
          { date: new Date('2025-01-12T00:00:00.000Z'), tithiEndTime: '08:00', maas: 'PAUSHA' }, // Day 2
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(MOCK_EVENT_MONTHLY, options)

        expect(result).toHaveLength(2)

        // Day 1: Start
        expect(result[0].date).toEqual(new Date('2025-01-11T00:00:00.000Z'))
        expect(result[0].startTime).toBe('00:00')
        expect(result[0].endTime).toBe('23:59')
        expect(result[0].notes).toContain('Begint op deze dag')

        // Day 2: End
        expect(result[1].date).toEqual(new Date('2025-01-12T00:00:00.000Z'))
        expect(result[1].startTime).toBe('00:00')
        expect(result[1].endTime).toBe('08:00')
        expect(result[1].notes).toContain('Eindigt om 08:00')
      })

      it('should treat non-consecutive days as separate occurrences', async () => {
        const mockDbResponse = [
          { date: new Date('2025-01-11T00:00:00.000Z'), tithiEndTime: '10:00', maas: 'PAUSHA' },
          { date: new Date('2025-01-13T00:00:00.000Z'), tithiEndTime: '11:00', maas: 'PAUSHA' },
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(MOCK_EVENT_MONTHLY, options)

        expect(result).toHaveLength(2)
        expect(result[0].startTime).toBeUndefined()
        expect(result[0].notes).toBeUndefined()
        expect(result[1].startTime).toBeUndefined()
        expect(result[1].notes).toBeUndefined()
      })
    })

    describe('SOLAR Rule', () => {
      it('should generate occurrences for Sankranti events', async () => {
        const sankrantiEvent: Event = {
          ...MOCK_EVENT_YEARLY,
          id: 'evt_sankranti',
          name: 'Makar Sankranti',
          ruleType: 'SOLAR',
          sankranti: 'MAKARA_SANKRANTI',
        }

        const mockDbResponse = [
          {
            date: new Date('2025-01-14T00:00:00.000Z'),
            sankrantiTime: '14:30',
            sankranti: 'MAKARA_SANKRANTI'
          }
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(sankrantiEvent, options)

        expect(prismaMock.dailyInfo.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            sankranti: 'MAKARA_SANKRANTI'
          })
        }))

        expect(result).toHaveLength(1)
        expect(result[0].date).toEqual(new Date('2025-01-14T00:00:00.000Z'))
        expect(result[0].startTime).toBe('14:30')
      })
    })

    describe('Adhika Maas Filtering', () => {
      it('should exclude Adhika months by default (includeAdhika=false)', async () => {
        const adhikaEvent: Event = {
          ...MOCK_EVENT_YEARLY,
          includeAdhika: false, // Default behavior
        }

        prismaMock.dailyInfo.findMany.mockResolvedValue([])

        await generateOccurrences(adhikaEvent, options)

        expect(prismaMock.dailyInfo.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            isAdhika: false 
          })
        }))
      })

      it('should include only Adhika months if isAdhikaOnly=true', async () => {
        const adhikaOnlyEvent: Event = {
          ...MOCK_EVENT_YEARLY,
          isAdhikaOnly: true,
        }

        prismaMock.dailyInfo.findMany.mockResolvedValue([])

        await generateOccurrences(adhikaOnlyEvent, options)

        expect(prismaMock.dailyInfo.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({
            isAdhika: true
          })
        }))
      })

      it('should not filter by isAdhika if includeAdhika=true', async () => {
        const allMonthsEvent: Event = {
          ...MOCK_EVENT_YEARLY,
          includeAdhika: true,
          isAdhikaOnly: false,
        }

        prismaMock.dailyInfo.findMany.mockResolvedValue([])

        await generateOccurrences(allMonthsEvent, options)

        const callArgs = prismaMock.dailyInfo.findMany.mock.calls[0][0]
        // Should NOT have isAdhika in where clause
        expect(callArgs?.where).not.toHaveProperty('isAdhika')
      })
    })

    describe('NONE', () => {

      it('should return empty array for NONE recurrence', async () => {
        const result = await generateOccurrences(MOCK_EVENT_NONE, options)
        expect(result).toEqual([])
        expect(prismaMock.dailyInfo.findMany).not.toHaveBeenCalled()
      })
    })

    describe('Solar recurrences', () => {
      it('should return empty array for YEARLY_SOLAR', async () => {
        const eventSolar: Event = {
          ...MOCK_EVENT_YEARLY,
          id: 'evt_solar_yearly',
          recurrenceType: 'YEARLY_SOLAR',
        }

        const result = await generateOccurrences(eventSolar, options)

        expect(result).toEqual([])
        expect(prismaMock.dailyInfo.findMany).not.toHaveBeenCalled()
      })

      it('should return empty array for MONTHLY_SOLAR', async () => {
        const eventSolar: Event = {
          ...MOCK_EVENT_YEARLY,
          id: 'evt_solar_monthly',
          recurrenceType: 'MONTHLY_SOLAR',
        }

        const result = await generateOccurrences(eventSolar, options)

        expect(result).toEqual([])
        expect(prismaMock.dailyInfo.findMany).not.toHaveBeenCalled()
      })
    })

    describe('maxOccurrences', () => {
      it('should limit occurrences to the configured max', async () => {
        const mockDbResponse = [
          { date: new Date('2025-01-11T00:00:00.000Z'), tithiEndTime: '10:00', maas: 'PAUSHA' },
          { date: new Date('2025-01-25T00:00:00.000Z'), tithiEndTime: '11:00', maas: 'PAUSHA' },
        ]

        prismaMock.dailyInfo.findMany.mockResolvedValue(mockDbResponse as DailyInfo[])

        const result = await generateOccurrences(MOCK_EVENT_MONTHLY, {
          ...options,
          maxOccurrences: 1,
        })

        expect(result).toHaveLength(1)
      })
    })
  })

  describe('generateOccurrencesForEvents', () => {
    it('should generate occurrences for multiple events', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')
      const events = [MOCK_EVENT_YEARLY, MOCK_EVENT_NONE]

      // Mock response for the yearly event
      prismaMock.dailyInfo.findMany.mockResolvedValue([
        { date: new Date('2025-01-15T00:00:00.000Z'), tithiEndTime: '12:00', maas: 'PHALGUNA' } as DailyInfo
      ])

      const result = await generateOccurrencesForEvents(events, { startDate, endDate })

      expect(result.size).toBe(2)
      expect(result.get(MOCK_EVENT_YEARLY.id)).toHaveLength(1)
      expect(result.get(MOCK_EVENT_NONE.id)).toHaveLength(0)
    })
  })

  describe('getRecommendedWindow', () => {
    it('should return correct defaults for recurrence types', () => {
      expect(getRecommendedWindow('YEARLY_LUNAR').yearsAhead).toBe(5)
      expect(getRecommendedWindow('MONTHLY_LUNAR').yearsAhead).toBe(2)
      expect(getRecommendedWindow('NONE').yearsAhead).toBe(0)
    })
  })
})
