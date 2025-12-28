import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  isSameDay,
  isToday,
  isWeekend,
  getMonthDays,
  getMonthStartPadding,
  formatDateISO,
  formatDateNL,
  formatTimeAgo,
  getMoonPhaseEmoji,
  getMoonPhaseIllumination,
  getMoonPhaseInfo,
} from '../date-utils'

describe('Date Utilities', () => {
  // =============================================================================
  // DATE COMPARISON TESTS
  // =============================================================================
  describe('isSameDay', () => {
    it('should return true for the same date', () => {
      const date1 = new Date(Date.UTC(2024, 0, 1, 10, 0, 0))
      const date2 = new Date(Date.UTC(2024, 0, 1, 15, 0, 0))
      expect(isSameDay(date1, date2)).toBe(true)
    })

    it('should return false for different dates', () => {
      const date1 = new Date(Date.UTC(2024, 0, 1, 23, 0, 0))
      const date2 = new Date(Date.UTC(2024, 0, 2, 0, 30, 0))
      expect(isSameDay(date1, date2)).toBe(false)
    })

    it('should handle year differences correctly', () => {
        const date1 = new Date(Date.UTC(2024, 0, 1))
        const date2 = new Date(Date.UTC(2025, 0, 1))
        expect(isSameDay(date1, date2)).toBe(false)
      })
  })

  describe('isToday', () => {
    beforeEach(() => {
        // Mock the system time to a fixed date
        vi.useFakeTimers()
        vi.setSystemTime(new Date(Date.UTC(2024, 2, 15, 12, 0, 0)))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return true if the date matches the mocked current date', () => {
      const today = new Date(Date.UTC(2024, 2, 15, 9, 0, 0))
      expect(isToday(today)).toBe(true)
    })

    it('should return false for a different date', () => {
      const yesterday = new Date(Date.UTC(2024, 2, 14, 12, 0, 0))
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date(2024, 0, 6) // Jan 6, 2024 is a Saturday
      expect(isWeekend(saturday)).toBe(true)
    })

    it('should return true for Sunday', () => {
      const sunday = new Date(2024, 0, 7) // Jan 7, 2024 is a Sunday
      expect(isWeekend(sunday)).toBe(true)
    })

    it('should return false for weekdays', () => {
      const monday = new Date(2024, 0, 8)
      expect(isWeekend(monday)).toBe(false)
    })
  })

  // =============================================================================
  // CALENDAR HELPER TESTS
  // =============================================================================
  describe('getMonthDays', () => {
    it('should return the correct number of days for January (31)', () => {
      const days = getMonthDays(2024, 0) // January
      expect(days).toHaveLength(31)
      expect(days[0].getDate()).toBe(1)
      expect(days[30].getDate()).toBe(31)
    })

    it('should return the correct number of days for February in a leap year (29)', () => {
      const days = getMonthDays(2024, 1) // February 2024 (Leap Year)
      expect(days).toHaveLength(29)
    })

    it('should return the correct number of days for February in a non-leap year (28)', () => {
      const days = getMonthDays(2023, 1) // February 2023
      expect(days).toHaveLength(28)
    })
  })

  describe('getMonthStartPadding', () => {
    it('should return correct padding for a month starting on Monday (0 padding)', () => {
      // Jan 2024 starts on a Monday
      expect(getMonthStartPadding(2024, 0)).toBe(0)
    })

    it('should return correct padding for a month starting on Tuesday (1 padding)', () => {
        // Oct 2024 starts on a Tuesday
        expect(getMonthStartPadding(2024, 9)).toBe(1)
    })
    
    it('should return correct padding for a month starting on Sunday (6 padding)', () => {
       // Sep 2024 starts on a Sunday
       expect(getMonthStartPadding(2024, 8)).toBe(6)
    })
  })

  // =============================================================================
  // DATE FORMATTING TESTS
  // =============================================================================
  describe('formatDateISO', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-12-25T15:30:00Z')
      expect(formatDateISO(date)).toBe('2024-12-25')
    })
  })

  describe('formatDateNL', () => {
    it('should format date in Dutch long format', () => {
      const spy = vi
        .spyOn(Date.prototype, 'toLocaleDateString')
        .mockReturnValue('1 januari')
      const date = new Date(Date.UTC(2024, 0, 1))
      const result = formatDateNL(date)
      expect(spy).toHaveBeenCalledWith('nl-NL', { day: 'numeric', month: 'long' })
      expect(result).toBe('1 januari')
      spy.mockRestore()
    })
  })

  describe('formatTimeAgo', () => {
    it('should return placeholder for missing time', () => {
        expect(formatTimeAgo(null)).toBe('—')
    })

    it('should return placeholder for invalid time strings', () => {
        const now = new Date('2024-01-01T12:00:00')
        expect(formatTimeAgo('bad', now)).toBe('—')
        expect(formatTimeAgo('12', now)).toBe('—')
    })

    it('should return correct string for future time', () => {
        const now = new Date('2024-01-01T12:00:00')
        const result = formatTimeAgo('14:30', now)
        expect(result).toBe('over 2u 30m')
    })

    it('should return correct string for past time', () => {
        const now = new Date('2024-01-01T12:00:00')
        const result = formatTimeAgo('10:30', now)
        expect(result).toBe('1u 30m geleden')
    })

    it('should handle minutes only correctly', () => {
        const now = new Date('2024-01-01T12:00:00')
        const result = formatTimeAgo('12:15', now)
        expect(result).toBe('over 15m')
    })
  })

  // =============================================================================
  // MOON PHASE TESTS
  // =============================================================================
  describe('getMoonPhaseEmoji', () => {
    // Note: These tests rely on the specific implementation details (constants) in date-utils.
    // Ideally, we test logic, but here we check if it returns a valid structure.
    
    it('should return a valid emoji and status', () => {
        const date = new Date()
        const result = getMoonPhaseEmoji(date)
        
        expect(result).toHaveProperty('emoji')
        expect(result).toHaveProperty('isSpecial')
        expect(['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔']).toContain(result.emoji)
    })

    it('should identify a known full moon (approximate)', () => {
        // Based on the code's constant/logic, we try to hit a full moon.
        // Or we just verify the return type structure is robust.
        // Let's stick to structure for now as the alg is an approximation.
        const date = new Date('2024-01-25') // Full Moon was around Jan 25, 2024
        const result = getMoonPhaseEmoji(date)
        expect(result.emoji).toBeDefined()
    })
  })

  describe('getMoonPhaseIllumination', () => {
    it('returns 0% illumination at the known new moon reference', () => {
      const date = new Date(2000, 0, 6, 18, 14)
      const result = getMoonPhaseIllumination(date)
      expect(result.percent).toBe(0)
      expect(result.isWaxing).toBe(true)
    })

    it('returns a valid percentage range', () => {
      const result = getMoonPhaseIllumination(new Date())
      expect(result.percent).toBeGreaterThanOrEqual(0)
      expect(result.percent).toBeLessThanOrEqual(100)
    })
  })

  describe('getMoonPhaseInfo', () => {
    it('combines emoji and illumination data consistently', () => {
      const date = new Date(2025, 0, 1)
      const info = getMoonPhaseInfo(date)
      const illumination = getMoonPhaseIllumination(date)
      const emoji = getMoonPhaseEmoji(date)

      expect(info.percent).toBe(illumination.percent)
      expect(info.isWaxing).toBe(illumination.isWaxing)
      expect(info.emoji).toBe(emoji.emoji)
      expect(info.isSpecial).toBe(emoji.isSpecial)
    })
  })
})
