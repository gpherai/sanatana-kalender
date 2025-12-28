import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'
import { formatDateLocal } from '@/lib/utils'
import { GET, POST } from '../events/route'

describe('API Events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid query parameters', async () => {
    const request = new NextRequest('http://localhost/api/events?start=bad-date')

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('returns calendar events for valid query', async () => {
    const occurrenceDate = new Date(2025, 0, 1)
    prismaMock.eventOccurrence.findMany.mockResolvedValue([
      {
        id: 'occ_1',
        date: occurrenceDate,
        endDate: null,
        startTime: '09:00',
        endTime: '10:00',
        notes: 'note',
        event: {
          id: 'evt_1',
          name: 'Test Event',
          description: null,
          eventType: 'FESTIVAL',
          importance: 'MAJOR',
          categoryId: 'cat_1',
          category: {
            id: 'cat_1',
            name: 'ganesha',
            displayName: 'Ganesha',
            icon: '🐘',
            color: '#fff',
            description: null,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tithi: null,
          nakshatra: null,
          maas: null,
          tags: [],
        },
      },
    ])

    const request = new NextRequest(
      'http://localhost/api/events?start=2025-01-01&end=2025-01-02'
    )

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].eventId).toBe('evt_1')
    expect(json[0].start).toBe(formatDateLocal(occurrenceDate))
    expect(json[0].resource.eventType).toBe('FESTIVAL')
  })

  it('rejects invalid event payloads', async () => {
    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('VALIDATION_ERROR')
  })

  it('creates an event with an initial occurrence', async () => {
    prismaMock.$transaction.mockImplementation(async (operation) => {
      if (typeof operation === 'function') {
        return operation(prismaMock)
      }
      return []
    })
    prismaMock.event.create.mockResolvedValue({
      id: 'evt_1',
    })
    prismaMock.eventOccurrence.create.mockResolvedValue({
      id: 'occ_1',
    })

    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Event',
        eventType: 'FESTIVAL',
        date: '2025-01-01',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(prismaMock.event.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Test Event',
        eventType: 'FESTIVAL',
      }),
    }))
    expect(prismaMock.eventOccurrence.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        eventId: 'evt_1',
        date: new Date(2025, 0, 1),
      }),
    }))
    expect(response.status).toBe(201)
    expect(json.id).toBe('evt_1')
  })

  it('rejects unknown category IDs', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/events', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Event',
        eventType: 'FESTIVAL',
        date: '2025-01-01',
        categoryId: 'ckl9z5rte0000s6m1gj8h3x7d',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.message).toBe('Categorie niet gevonden')
  })
})
