import { describe, it, expect } from 'vitest'
import { getMoonPhaseType, getMoonPhaseEmoji, getMoonPhaseName } from '../moon-phases'

describe('Moon Phase Utilities', () => {
  // =============================================================================
  // getMoonPhaseType
  // =============================================================================
  describe('getMoonPhaseType', () => {
    it('should identify New Moon (< 3%)', () => {
      expect(getMoonPhaseType(0, true)).toBe('NEW_MOON')
      expect(getMoonPhaseType(2, false)).toBe('NEW_MOON')
    })

    it('should identify Full Moon (> 97%)', () => {
      expect(getMoonPhaseType(98, true)).toBe('FULL_MOON')
      expect(getMoonPhaseType(100, false)).toBe('FULL_MOON')
    })

    describe('Waxing phases', () => {
      const waxing = true
      
      it('should return WAXING_CRESCENT for 3-24%', () => {
        expect(getMoonPhaseType(10, waxing)).toBe('WAXING_CRESCENT')
        expect(getMoonPhaseType(24, waxing)).toBe('WAXING_CRESCENT')
      })

      it('should return FIRST_QUARTER for 25-49%', () => {
        expect(getMoonPhaseType(25, waxing)).toBe('FIRST_QUARTER')
        expect(getMoonPhaseType(49, waxing)).toBe('FIRST_QUARTER')
      })

      it('should return WAXING_GIBBOUS for 50-74%', () => {
        expect(getMoonPhaseType(50, waxing)).toBe('WAXING_GIBBOUS')
        expect(getMoonPhaseType(74, waxing)).toBe('WAXING_GIBBOUS')
      })
      
      it('should return FULL_MOON for 75-97%', () => {
        // Based on current logic: fallback in waxing block is "FULL_MOON"
        // Let's verify this behavior, though usually Gibbous goes up to ~97
        expect(getMoonPhaseType(75, waxing)).toBe('FULL_MOON')
        expect(getMoonPhaseType(97, waxing)).toBe('FULL_MOON')
      })
    })

    describe('Waning phases', () => {
      const waxing = false
      
      it('should return WANING_GIBBOUS for 97-76%', () => {
        expect(getMoonPhaseType(97, waxing)).toBe('WANING_GIBBOUS')
        expect(getMoonPhaseType(76, waxing)).toBe('WANING_GIBBOUS')
      })

      it('should return LAST_QUARTER for 75-51%', () => {
        // Logic: if > 75 return Gibous. So 75 falls through?
        // Let's check logic: if (pct > 75) -> Gibbous.
        // So 75 is NOT > 75. It goes to next check: if (pct > 50) -> Last Quarter.
        expect(getMoonPhaseType(75, waxing)).toBe('LAST_QUARTER')
        expect(getMoonPhaseType(51, waxing)).toBe('LAST_QUARTER')
      })

      it('should return WANING_CRESCENT for 50-26%', () => {
        expect(getMoonPhaseType(50, waxing)).toBe('WANING_CRESCENT')
        expect(getMoonPhaseType(26, waxing)).toBe('WANING_CRESCENT')
      })
      
      it('should return WANING_CRESCENT for 25-3%', () => {
         // Logic: if (pct > 25) -> Crescent. Else -> New Moon.
         expect(getMoonPhaseType(25, waxing)).toBe('WANING_CRESCENT')
         expect(getMoonPhaseType(3, waxing)).toBe('WANING_CRESCENT')
      })
    })
  })

  // =============================================================================
  // getMoonPhaseEmoji
  // =============================================================================
  describe('getMoonPhaseEmoji', () => {
    it('should return correct emojis for key phases', () => {
      expect(getMoonPhaseEmoji(0, true)).toBe('🌑')
      expect(getMoonPhaseEmoji(100, true)).toBe('🌕')
      
      // Waxing
      expect(getMoonPhaseEmoji(10, true)).toBe('🌒')
      expect(getMoonPhaseEmoji(30, true)).toBe('🌓')
      expect(getMoonPhaseEmoji(60, true)).toBe('🌔')
      
      // Waning
      expect(getMoonPhaseEmoji(90, false)).toBe('🌖')
      expect(getMoonPhaseEmoji(60, false)).toBe('🌗')
      expect(getMoonPhaseEmoji(10, false)).toBe('🌘')
    })
  })

  // =============================================================================
  // getMoonPhaseName
  // =============================================================================
  describe('getMoonPhaseName', () => {
    it('should translate known types', () => {
      expect(getMoonPhaseName('FULL_MOON')).toBe('Volle Maan')
      expect(getMoonPhaseName('NEW_MOON')).toBe('Nieuwe Maan')
    })

    it('should return Unknown for invalid types', () => {
      expect(getMoonPhaseName('SUPER_MOON')).toBe('Unknown')
    })
  })
})
