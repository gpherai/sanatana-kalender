import { describe, it, expect } from 'vitest'
import { ZodError } from 'zod'
import {
  createEnumFromConstants,
  transformFormToApi,
  dateStringSchema,
  dateQuerySchema,
  optionalDateStringSchema,
  timeStringSchema,
  optionalTimeStringSchema,
  formTimeStringSchema,
  createEventSchema,
  updateEventSchema,
  eventFormSchema,
  EventFormData,
} from '../validations'

describe('Validations', () => {
  // =============================================================================
  // Helper Functions
  // =============================================================================
  describe('createEnumFromConstants', () => {
    it('should create a Zod enum from constants array', () => {
      const constants = [
        { value: 'A', label: 'Label A' },
        { value: 'B', label: 'Label B' },
      ] as const

      const schema = createEnumFromConstants(constants)
      
      expect(schema.parse('A')).toBe('A')
      expect(() => schema.parse('C')).toThrow(ZodError)
    })
  })

  // =============================================================================
  // Transformers
  // =============================================================================
  describe('transformFormToApi', () => {
    it('should transform empty strings to null', () => {
      const formData: EventFormData = {
        name: 'Test Event',
        date: '2025-01-01',
        description: '',
        startTime: '',
        endTime: '',
        notes: '',
        eventType: 'OTHER',
        importance: 'MODERATE',
        recurrenceType: 'NONE',
        // Optional fields
        categoryId: '',
        endDate: '',
        tithi: '',
        nakshatra: '',
        maas: '',
        tags: '',
      }

      const result = transformFormToApi(formData)

      expect(result.description).toBeNull()
      expect(result.startTime).toBeNull()
      expect(result.endTime).toBeNull()
      expect(result.notes).toBeNull()
      expect(result.categoryId).toBeNull()
    })

    it('should process tags correctly', () => {
      const formData: Partial<EventFormData> & Pick<EventFormData, 'name' | 'date' | 'eventType' | 'importance' | 'recurrenceType'> = {
        name: 'Test',
        date: '2025-01-01',
        tags: 'tag1, TAG2,  tag3 ',
        eventType: 'OTHER',
        importance: 'MODERATE',
        recurrenceType: 'NONE',
      }

      const result = transformFormToApi(formData)

      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3'])
    })

    it('should handle empty tags', () => {
      const formData: Partial<EventFormData> & Pick<EventFormData, 'name' | 'date' | 'eventType' | 'importance' | 'recurrenceType'> = {
        name: 'Test',
        date: '2025-01-01',
        tags: '',
        eventType: 'OTHER',
        importance: 'MODERATE',
        recurrenceType: 'NONE',
      }

      const result = transformFormToApi(formData)

      expect(result.tags).toEqual([])
    })
  })

  // =============================================================================
  // Schemas
  // =============================================================================
  describe('dateStringSchema', () => {
    it('should validate YYYY-MM-DD', () => {
      expect(dateStringSchema.parse('2025-01-01')).toBe('2025-01-01')
    })

    it('should reject invalid formats', () => {
      expect(() => dateStringSchema.parse('01-01-2025')).toThrow(ZodError)
    })
  })

  describe('dateQuerySchema', () => {
    it('should accept ISO date-time strings', () => {
      expect(dateQuerySchema.parse('2025-01-01T12:00:00Z')).toBe('2025-01-01T12:00:00Z')
    })

    it('should reject non-date prefixes', () => {
      expect(() => dateQuerySchema.parse('01-01-2025T12:00:00Z')).toThrow(ZodError)
    })
  })

  describe('optionalDateStringSchema', () => {
    it('should accept null, undefined, and empty string', () => {
      expect(optionalDateStringSchema.parse(null)).toBeNull()
      expect(optionalDateStringSchema.parse(undefined)).toBeUndefined()
      expect(optionalDateStringSchema.parse('')).toBe('')
    })

    it('should reject invalid date strings when provided', () => {
      expect(() => optionalDateStringSchema.parse('2025/01/01')).toThrow(ZodError)
    })
  })

  describe('timeStringSchema', () => {
    it('should accept lenient times', () => {
      expect(timeStringSchema.parse('9:00')).toBe('9:00')
      expect(timeStringSchema.parse('23:59')).toBe('23:59')
    })

    it('should reject invalid times', () => {
      expect(() => timeStringSchema.parse('24:00')).toThrow(ZodError)
      expect(() => timeStringSchema.parse('12:60')).toThrow(ZodError)
    })
  })

  describe('optionalTimeStringSchema', () => {
    it('should accept null and undefined', () => {
      expect(optionalTimeStringSchema.parse(null)).toBeNull()
      expect(optionalTimeStringSchema.parse(undefined)).toBeUndefined()
    })
  })

  describe('formTimeStringSchema', () => {
    it('should accept empty string or undefined', () => {
      expect(formTimeStringSchema.parse('')).toBe('')
      expect(formTimeStringSchema.parse(undefined)).toBeUndefined()
    })
  })

  describe('createEventSchema', () => {
    it('should apply defaults for importance, recurrence, and tags', () => {
      const payload = {
        name: 'Test Event',
        eventType: 'PUJA',
        date: '2025-01-01',
      }

      const result = createEventSchema.parse(payload)
      expect(result.importance).toBe('MODERATE')
      expect(result.recurrenceType).toBe('NONE')
      expect(result.tags).toEqual([])
    })

    it('should reject invalid endDate formats', () => {
      const payload = {
        name: 'Test Event',
        eventType: 'PUJA',
        date: '2025-01-01',
        endDate: '2025-01-01T00:00:00Z',
      }

      expect(() => createEventSchema.parse(payload)).toThrow(ZodError)
    })
  })

  describe('updateEventSchema', () => {
    it('should allow partial updates', () => {
      const result = updateEventSchema.parse({ name: 'Updated Event' })
      expect(result.name).toBe('Updated Event')
    })

    it('should allow empty payloads', () => {
      expect(updateEventSchema.parse({})).toEqual({
        importance: 'MODERATE',
        recurrenceType: 'NONE',
        tags: [],
      })
    })
  })

  describe('eventFormSchema', () => {
    it('should validate a valid form object', () => {
      const validData = {
        name: 'My Event',
        date: '2025-01-01',
        eventType: 'PUJA',
        importance: 'MAJOR',
        recurrenceType: 'NONE',
      }
      
      const result = eventFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require name', () => {
      const invalidData = {
        name: '', // Empty name
        date: '2025-01-01',
        eventType: 'PUJA',
        importance: 'MODERATE',
        recurrenceType: 'NONE',
      }
      
      const result = eventFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined()
      }
    })

    it('should validate max length for description', () => {
      const invalidData = {
        name: 'Event',
        date: '2025-01-01',
        description: 'a'.repeat(501), // > 500
        eventType: 'OTHER',
        importance: 'MODERATE',
        recurrenceType: 'NONE',
      }
      
      const result = eventFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.description).toBeDefined()
      }
    })
  })
})
