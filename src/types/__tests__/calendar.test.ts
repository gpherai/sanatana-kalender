import { describe, it, expect } from 'vitest'
import { EventType, Importance } from '@/generated/prisma/enums'
import {
  parseCalendarEvent,
  isValidEventType,
  isValidImportance,
  isValidTimeString,
  toTimeString,
} from '../calendar'

describe('Calendar types helpers', () => {
  it('parses calendar events into Date objects', () => {
    const response = {
      id: 'occ_1',
      eventId: 'evt_1',
      title: 'Test Event',
      start: '2025-01-01',
      end: '2025-01-02',
      allDay: true,
      resource: {
        description: 'desc',
        eventType: EventType.FESTIVAL,
        importance: Importance.MAJOR,
        category: null,
        categoryId: null,
        tithi: null,
        nakshatra: null,
        maas: null,
        tags: [],
        notes: null,
        startTime: '09:00',
        endTime: '10:00',
        originalEndDate: '2025-01-02T00:00:00.000Z',
      },
    }

    const parsed = parseCalendarEvent(response)

    expect(parsed.start).toBeInstanceOf(Date)
    expect(parsed.end).toBeInstanceOf(Date)
    expect(parsed.resource.originalEndDate).toBeInstanceOf(Date)
    expect(parsed.resource.eventType).toBe(EventType.FESTIVAL)
    expect(parsed.resource.importance).toBe(Importance.MAJOR)
  })

  it('validates enum strings', () => {
    expect(isValidEventType(EventType.FESTIVAL)).toBe(true)
    expect(isValidEventType('BAD_VALUE')).toBe(false)
    expect(isValidImportance(Importance.MINOR)).toBe(true)
    expect(isValidImportance('BAD_VALUE')).toBe(false)
  })

  it('validates and converts time strings', () => {
    expect(isValidTimeString('09:00')).toBe(true)
    expect(isValidTimeString('9:00')).toBe(false)
    expect(toTimeString('10:30')).toBe('10:30')
    expect(toTimeString('30:99')).toBeNull()
  })
})
