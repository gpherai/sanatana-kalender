import { describe, it, expect } from 'vitest'
import {
  isValidTimeFormat,
  isValidDateFormat,
  isValidDatePrefix,
  isValidCuid,
  TIME_REGEX_LENIENT,
  DATETIME_REGEX,
  ERROR_MESSAGES,
} from '../patterns'

describe('Validation Patterns', () => {
  // =============================================================================
  // Time Validation
  // =============================================================================
  describe('isValidTimeFormat (Strict HH:mm)', () => {
    it('should validate correct times', () => {
      expect(isValidTimeFormat('00:00')).toBe(true)
      expect(isValidTimeFormat('09:00')).toBe(true)
      expect(isValidTimeFormat('12:30')).toBe(true)
      expect(isValidTimeFormat('23:59')).toBe(true)
    })

    it('should reject invalid times', () => {
      expect(isValidTimeFormat('24:00')).toBe(false) // 24 is invalid (use 00)
      expect(isValidTimeFormat('12:60')).toBe(false) // 60 min is invalid
      expect(isValidTimeFormat('9:00')).toBe(false)  // Single digit hour rejected (Strict)
      expect(isValidTimeFormat('12:5')).toBe(false)  // Single digit min rejected
      expect(isValidTimeFormat('text')).toBe(false)
    })
  })

  describe('TIME_REGEX_LENIENT (Lenient HH:mm)', () => {
    it('should accept single-digit hours', () => {
      expect(TIME_REGEX_LENIENT.test('9:00')).toBe(true)
      expect(TIME_REGEX_LENIENT.test('0:05')).toBe(true)
    })

    it('should reject out-of-range values', () => {
      expect(TIME_REGEX_LENIENT.test('24:00')).toBe(false)
      expect(TIME_REGEX_LENIENT.test('12:60')).toBe(false)
    })
  })

  // =============================================================================
  // Date Validation
  // =============================================================================
  describe('isValidDateFormat (YYYY-MM-DD)', () => {
    it('should validate correct dates', () => {
      expect(isValidDateFormat('2025-01-01')).toBe(true)
      expect(isValidDateFormat('1999-12-31')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidDateFormat('01-01-2025')).toBe(false) // DD-MM-YYYY
      expect(isValidDateFormat('2025/01/01')).toBe(false)
      expect(isValidDateFormat('2025-1-1')).toBe(false)   // Missing leading zeros
      expect(isValidDateFormat('2025-01-01T12:00:00Z')).toBe(false) // ISO string
    })
  })

  describe('isValidDatePrefix', () => {
    it('should validate strings starting with YYYY-MM-DD', () => {
      expect(isValidDatePrefix('2025-01-01')).toBe(true)
      expect(isValidDatePrefix('2025-01-01T12:00:00Z')).toBe(true)
      expect(isValidDatePrefix('2025-01-01 extra info')).toBe(true)
    })

    it('should reject strings not starting with date', () => {
      expect(isValidDatePrefix('01-01-2025')).toBe(false)
      expect(isValidDatePrefix('text')).toBe(false)
    })
  })

  describe('DATETIME_REGEX (ISO 8601)', () => {
    it('should validate ISO date-time strings', () => {
      expect(DATETIME_REGEX.test('2025-12-18T10:30:00.000Z')).toBe(true)
      expect(DATETIME_REGEX.test('2025-12-18T10:30:00Z')).toBe(true)
      expect(DATETIME_REGEX.test('2025-12-18T10:30:00')).toBe(true)
    })

    it('should reject non-ISO formats', () => {
      expect(DATETIME_REGEX.test('2025-12-18')).toBe(false)
      expect(DATETIME_REGEX.test('2025-12-18 10:30:00')).toBe(false)
      expect(DATETIME_REGEX.test('2025/12/18T10:30:00')).toBe(false)
    })
  })

  // =============================================================================
  // CUID Validation
  // =============================================================================
  describe('isValidCuid', () => {
    it('should validate correct CUIDs', () => {
      // CUID regex: ^c[a-z0-9]{24}$
      // Length = 1 ('c') + 24 = 25 chars total.
      const validCuid = 'c' + 'a'.repeat(24)
      expect(isValidCuid(validCuid)).toBe(true)
    })

    it('should reject invalid CUIDs', () => {
      expect(isValidCuid('short')).toBe(false)
      expect(isValidCuid('d' + 'a'.repeat(24))).toBe(false) // Must start with c
      expect(isValidCuid('c' + 'A'.repeat(24))).toBe(false) // Must be lowercase (usually) based on regex [a-z0-9]
    })
  })

  // =============================================================================
  // Error Messages
  // =============================================================================
  describe('ERROR_MESSAGES', () => {
    it('should generate dynamic messages', () => {
      expect(ERROR_MESSAGES.TOO_SHORT(5)).toBe('Minimaal 5 karakters')
      expect(ERROR_MESSAGES.TOO_LONG(10)).toBe('Maximaal 10 karakters')
    })
  })
})
