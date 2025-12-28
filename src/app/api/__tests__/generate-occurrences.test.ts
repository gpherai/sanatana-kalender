import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'

const { generateOccurrences, generateOccurrencesForEvents } = vi.hoisted(() => ({
  generateOccurrences: vi.fn(),
  generateOccurrencesForEvents: vi.fn(),
}))

vi.mock('@/services/recurrence.service', () => ({
  generateOccurrences,
  generateOccurrencesForEvents,
}))

import { POST } from '../events/generate-occurrences/route'

describe('POST /api/events/generate-occurrences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires start and end dates', async () => {
    const request = new NextRequest(
      'http://localhost/api/events/generate-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({ endDate: '2025-01-02' }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('startDate and endDate are required')
  })

  it('returns not found when event does not exist', async () => {
    prismaMock.event.findUnique.mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost/api/events/generate-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'ckl9z5rte0000s6m1gj8h3x7d',
          startDate: '2025-01-01',
          endDate: '2025-01-02',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('Event not found')
  })

  it('rejects invalid date formats', async () => {
    const request = new NextRequest(
      'http://localhost/api/events/generate-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({
          startDate: 'bad-date',
          endDate: '2025-01-02',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Invalid date format')
  })

  it('returns early when event has no recurrence', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      name: 'One-off',
      recurrenceType: 'NONE',
    })

    const request = new NextRequest(
      'http://localhost/api/events/generate-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'evt_1',
          startDate: '2025-01-01',
          endDate: '2025-01-02',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.generated).toBe(0)
    expect(generateOccurrences).not.toHaveBeenCalled()
  })

  it('generates occurrences for a recurring event', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      name: 'Recurring',
      recurrenceType: 'YEARLY_LUNAR',
    })
    generateOccurrences.mockResolvedValue([
      { date: new Date(2025, 0, 1), endDate: null, startTime: null, endTime: null, notes: null },
      { date: new Date(2025, 0, 2), endDate: null, startTime: null, endTime: null, notes: null },
    ])
    prismaMock.eventOccurrence.upsert.mockResolvedValue({ id: 'occ_1' })

    const request = new NextRequest(
      'http://localhost/api/events/generate-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'evt_1',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(generateOccurrences).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'evt_1' }),
      expect.objectContaining({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-05'),
      })
    )
    expect(prismaMock.eventOccurrence.upsert).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(200)
    expect(json.generated).toBe(2)
  })

  it('generates occurrences for all recurring events', async () => {
    prismaMock.event.findMany.mockResolvedValue([
      { id: 'evt_1', name: 'Event 1', recurrenceType: 'YEARLY_LUNAR' },
      { id: 'evt_2', name: 'Event 2', recurrenceType: 'MONTHLY_LUNAR' },
    ])
    generateOccurrencesForEvents.mockResolvedValue(
      new Map([
        [
          'evt_1',
          [
            {
              date: new Date(2025, 0, 1),
              endDate: null,
              startTime: null,
              endTime: null,
              notes: null,
            },
          ],
        ],
        ['evt_2', []],
      ])
    )
    prismaMock.eventOccurrence.upsert.mockResolvedValue({ id: 'occ_1' })

    const request = new NextRequest(
      'http://localhost/api/events/generate-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2025-01-01',
          endDate: '2025-01-05',
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const response = await POST(request)
    const json = await response.json()

    expect(generateOccurrencesForEvents).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'evt_1' }),
        expect.objectContaining({ id: 'evt_2' }),
      ]),
      expect.objectContaining({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-05'),
      })
    )
    expect(prismaMock.eventOccurrence.upsert).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(json.eventsProcessed).toBe(2)
    expect(json.generated).toBe(1)
  })
})
