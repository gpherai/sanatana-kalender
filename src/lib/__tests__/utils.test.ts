import { describe, it, expect, vi } from 'vitest'
import {
  cn,
  isValidDate,
  formatDate,
  formatDateForInput,
  formatDateLocal,
  parseCalendarDate,
  safeParseDate,
  addDayForDisplay,
  subtractDayFromDisplay,
  startOfDayUTC,
  endOfDayUTC,
  truncate,
  logDebug,
} from '../utils'

describe('General Utilities', () => {
  // =============================================================================
  // Class Name Utilities
  // =============================================================================
  describe('cn', () => {
    it('should merge classes correctly', () => {
      expect(cn('base', 'extra')).toBe('base extra')
    })
    it('should handle conditional classes', () => {
      expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
    })
    it('should resolve tailwind conflicts', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })
  })

  // =============================================================================
  // Date Utilities
  // =============================================================================
  describe('isValidDate', () => {
    it('returns true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true)
    })
    it('returns false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('formats date in Dutch locale', () => {
      const date = new Date(2025, 0, 1) // 1 Jan 2025
      expect(formatDate(date)).toMatch(/1 januari 2025/i)
    })
    it('handles null/undefined', () => {
      expect(formatDate(null)).toBe('Geen datum')
    })
    it('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('Ongeldige datum')
    })
  })

  describe('formatDateForInput', () => {
    it('formats as YYYY-MM-DD', () => {
      const date = new Date(Date.UTC(2025, 0, 1))
      expect(formatDateForInput(date).startsWith('2025-01-01')).toBe(true)
    })
    it('returns empty string for invalid input', () => {
      expect(formatDateForInput(null)).toBe('')
    })
  })

  describe('formatDateLocal', () => {
    it('formats using local components', () => {
      const date = new Date(2025, 0, 1, 15, 0, 0)
      expect(formatDateLocal(date)).toBe('2025-01-01')
    })
  })

  describe('parseCalendarDate', () => {
    it('parses YYYY-MM-DD to UTC midnight', () => {
      const result = parseCalendarDate('2025-01-01')
      expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    })
    it('throws on invalid format', () => {
      expect(() => parseCalendarDate('01-01-2025')).toThrow()
    })
  })

  describe('safeParseDate', () => {
    it('returns Date for valid string', () => {
      const result = safeParseDate('2025-01-01')
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    })
    it('returns null for invalid format', () => {
      expect(safeParseDate('invalid')).toBeNull()
      expect(safeParseDate('01-01-2025')).toBeNull()
    })
    it('returns null for null/undefined', () => {
      expect(safeParseDate(null)).toBeNull()
    })
  })

  describe('Date Arithmetic', () => {
    it('addDayForDisplay adds 1 day', () => {
      const start = new Date('2025-01-01T00:00:00Z')
      const end = addDayForDisplay(start)
      expect(end.toISOString()).toBe('2025-01-02T00:00:00.000Z')
    })

    it('subtractDayFromDisplay removes 1 day', () => {
      const start = new Date('2025-01-02T00:00:00Z')
      const end = subtractDayFromDisplay(start)
      expect(end.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    })
  })

  describe('Day Boundaries', () => {
    it('startOfDayUTC resets time to 00:00:00', () => {
      const date = new Date('2025-01-01T15:30:45.123Z')
      const start = startOfDayUTC(date)
      expect(start.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    })

    it('endOfDayUTC sets time to 23:59:59.999', () => {
      const date = new Date('2025-01-01T05:00:00Z')
      const end = endOfDayUTC(date)
      expect(end.toISOString()).toBe('2025-01-01T23:59:59.999Z')
    })
  })

  describe('truncate', () => {
    it('truncates long text', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })
    it('keeps short text', () => {
      expect(truncate('Hi', 10)).toBe('Hi')
    })
  })

  describe('Logging', () => {
    it('does not crash', () => {
      logDebug('test')
      expect(true).toBe(true)
    })
  })
})
