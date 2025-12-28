import { describe, it, expect } from 'vitest'
import {
  getApproximateHinduMonth,
  detectSpecialDay,
  getSpecialLunarDays,
  TithiInfo,
} from '../panchanga-helpers'

describe('Panchanga Helpers', () => {
  // =============================================================================
  // getApproximateHinduMonth
  // =============================================================================
  describe('getApproximateHinduMonth', () => {
    it('should return Pausha for January', () => {
      // Note: Month is 0-indexed (0 = Jan)
      // Algorithm: (0 + 9) % 12 = 9 => index 0 of HINDU_MONTHS array?
      // Wait, let's trace logic:
      // HINDU_MONTHS = ["Pausha", "Magha", ...]
      // Jan (0) -> (0+9)%12 = 9.
      // HINDU_MONTHS[9] is "Ashwin". That seems wrong in my manual trace or the constant is ordered differently.
      // Let's re-read the code logic in test creation.
      
      // Code: const index = (month + 9) % 12;
      // Array: 0:Pausha, 1:Magha, 2:Phalguna, 3:Chaitra, 4:Vaishakha, 5:Jyeshtha, 
      //        6:Ashadha, 7:Shravana, 8:Bhadrapada, 9:Ashwin, 10:Kartik, 11:Margashirsha
      
      // If I put Jan (0), index is 9 => Ashwin.
      // Usually Pausha is around Dec/Jan.
      // If code assumes Jan = Pausha (index 0), then formula should be (month + 0) % 12?
      // Or maybe the array is rotated?
      
      // Let's test what the code ACTUALLY does first based on reading it.
      // month=0 (Jan) -> index 9 -> Ashwin
      // month=3 (Apr) -> index 0 -> Pausha (Wait, 3+9=12, 12%12=0) -> Pausha.
      // Chaitra is usually March/April.
      
      // The code comment says: "starting from Pausha (aligns with Gregorian calendar offset)"
      // Let's create a test to verify the CURRENT implementation, even if logic seems odd.
      // If implementation is buggy, the test will pass current code, but we can flag it.
      // Actually, let's test specific dates mentioned in JSDoc example if any.
      // Example says: getApproximateHinduMonth(new Date(2025, 0, 15)) // "Pausha"
      
      // Let's calculate: Jan=0. index=(0+9)%12=9. HINDU_MONTHS[9]="Ashwin".
      // Example says "Pausha".
      // HINDU_MONTHS[0] is "Pausha".
      // So if input is Jan (0), we expect output "Pausha" (0).
      // But formula gives 9.
      // So (month + X) % 12 = 0 where month=0.
      // 0 + X = 0 or 12. So X should be 0 or 12?
      // The code has `(month + 9) % 12`.
      
      // This suggests the code or the example might be out of sync.
      // I will write the test to expect what the JSDoc claims ("Pausha" for Jan), 
      // and if it fails, we found a bug in the helper!
      
      const date = new Date(2025, 0, 15) // Jan 15
      // Expecting based on JSDoc
      expect(getApproximateHinduMonth(date)).toBe('Pausha')
    })

    it('should return Chaitra for April', () => {
      // JSDoc example: getApproximateHinduMonth(new Date(2025, 3, 10)) // "Chaitra"
      // April is month 3.
      const date = new Date(2025, 3, 10) // Apr 10
      expect(getApproximateHinduMonth(date)).toBe('Chaitra')
    })
  })

  // =============================================================================
  // detectSpecialDay
  // =============================================================================
  describe('detectSpecialDay', () => {
    it('should identify Purnima (Full Moon)', () => {
      const tithi: TithiInfo = { number: 15, paksha: 'Shukla', name: 'Purnima' }
      const result = detectSpecialDay(tithi)
      
      expect(result).not.toBeNull()
      expect(result?.type).toBe('purnima')
      expect(result?.emoji).toBe('🌕')
    })

    it('should identify Amavasya (New Moon)', () => {
      const tithi: TithiInfo = { number: 15, paksha: 'Krishna', name: 'Amavasya' }
      const result = detectSpecialDay(tithi)
      
      expect(result?.type).toBe('amavasya')
      expect(result?.emoji).toBe('🌑')
    })

    it('should identify Ekadashi (Shukla)', () => {
      const tithi: TithiInfo = { number: 11, paksha: 'Shukla', name: 'Ekadashi' }
      const result = detectSpecialDay(tithi)
      expect(result?.type).toBe('ekadashi')
      expect(result?.name).toBe('Shukla Ekadashi')
    })

    it('should identify Ekadashi (Krishna)', () => {
      const tithi: TithiInfo = { number: 11, paksha: 'Krishna', name: 'Ekadashi' }
      const result = detectSpecialDay(tithi)
      expect(result?.type).toBe('ekadashi')
      expect(result?.name).toBe('Krishna Ekadashi')
    })

    it('should identify Vinayaka Chaturthi (Shukla 4)', () => {
      const tithi: TithiInfo = { number: 4, paksha: 'Shukla', name: 'Chaturthi' }
      const result = detectSpecialDay(tithi)
      expect(result?.type).toBe('chaturthi')
      expect(result?.name).toBe('Vinayaka Chaturthi')
    })

    it('should identify Sankashti Chaturthi (Krishna 4)', () => {
      const tithi: TithiInfo = { number: 4, paksha: 'Krishna', name: 'Chaturthi' }
      const result = detectSpecialDay(tithi)
      expect(result?.type).toBe('sankashti')
      expect(result?.name).toBe('Sankashti Chaturthi')
    })

    it('should identify Pradosham (13)', () => {
      const tithi: TithiInfo = { number: 13, paksha: 'Shukla', name: 'Trayodashi' }
      const result = detectSpecialDay(tithi)
      expect(result?.type).toBe('pradosham')
    })

    it('should identify Ashtami (8)', () => {
      const tithi: TithiInfo = { number: 8, paksha: 'Shukla', name: 'Ashtami' }
      const result = detectSpecialDay(tithi)
      expect(result?.type).toBe('ashtami')
    })

    it('should return null for non-special days (e.g. Dwitiya)', () => {
      const tithi: TithiInfo = { number: 2, paksha: 'Shukla', name: 'Dwitiya' }
      const result = detectSpecialDay(tithi)
      expect(result).toBeNull()
    })

    it('should return null for undefined tithi', () => {
      // @ts-expect-error - Testing invalid input
      expect(detectSpecialDay(undefined)).toBeNull()
    })
  })

  // =============================================================================
  // getSpecialLunarDays
  // =============================================================================
  describe('getSpecialLunarDays', () => {
    it('should extract special days from a list of days', () => {
      const monthData = [
        { date: new Date('2024-01-01'), tithi: { number: 2, paksha: 'Krishna', name: 'Dwitiya' } as TithiInfo }, // Normal
        { date: new Date('2024-01-11'), tithi: { number: 11, paksha: 'Krishna', name: 'Ekadashi' } as TithiInfo }, // Special
        { date: new Date('2024-01-15'), tithi: { number: 15, paksha: 'Krishna', name: 'Amavasya' } as TithiInfo }, // Special
      ]

      const results = getSpecialLunarDays(monthData)
      
      expect(results).toHaveLength(2)
      expect(results[0].type).toBe('ekadashi')
      expect(results[0].date).toEqual(monthData[1].date)
      expect(results[1].type).toBe('amavasya')
    })

    it('should handle string dates correctly', () => {
      const monthData = [
        { date: '2024-01-11', tithi: { number: 11, paksha: 'Shukla', name: 'Ekadashi' } as TithiInfo }
      ]
      
      const results = getSpecialLunarDays(monthData)
      expect(results).toHaveLength(1)
      expect(results[0].date).toBeInstanceOf(Date)
      expect(results[0].date.toISOString()).toContain('2024-01-11')
    })

    it('should skip days without tithi', () => {
      const monthData = [
        { date: new Date('2024-01-01') } // Missing tithi
      ]

      // @ts-expect-error - simulating partial data
      const results = getSpecialLunarDays(monthData)
      expect(results).toHaveLength(0)
    })
  })
})
