import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'
import { GET, DELETE, PUT } from '../events/[id]/route'

const MOCK_EVENT = {
  id: 'ckl9z5rte0000s6m1gj8h3x7d',
  name: 'Test Event',
  description: null,
  eventType: 'FESTIVAL',
  recurrenceType: 'NONE',
  importance: 'MODERATE',
  categoryId: null,
  category: null,
  tithi: null,
  nakshatra: null,
  maas: null,
  tags: [],
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  occurrences: [
    {
      id: 'occ_1',
      eventId: 'ckl9z5rte0000s6m1gj8h3x7d',
      date: new Date(2025, 0, 1),
      endDate: null,
      startTime: null,
      endTime: null,
      notes: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    },
  ],
}

describe('API Events by ID', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid event IDs', async () => {
    const response = await GET(new NextRequest('http://localhost/api/events/bad'), {
      params: Promise.resolve({ id: 'bad' }),
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.message).toBe('Ongeldig event ID formaat')
  })

  it('returns not found for missing events', async () => {
    prismaMock.event.findUnique.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/events/test'), {
      params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }),
    })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('NOT_FOUND')
  })

  it('returns event details when found', async () => {
    prismaMock.event.findUnique.mockResolvedValue(MOCK_EVENT)

    const response = await GET(new NextRequest('http://localhost/api/events/test'), {
      params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.id).toBe('ckl9z5rte0000s6m1gj8h3x7d')
  })

  it('rejects invalid update payloads', async () => {
    prismaMock.event.findUnique.mockResolvedValue(MOCK_EVENT)

    const request = new NextRequest('http://localhost/api/events/test', {
      method: 'PUT',
      body: JSON.stringify({ date: 'bad-date' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }),
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('VALIDATION_ERROR')
    expect(prismaMock.event.update).not.toHaveBeenCalled()
  })

  it('updates event and first occurrence when payload is valid', async () => {
    prismaMock.event.findUnique.mockResolvedValue(MOCK_EVENT)
    prismaMock.$transaction.mockImplementation(async (operation) => {
      if (typeof operation === 'function') {
        return operation(prismaMock)
      }
      return []
    })
    prismaMock.event.update.mockResolvedValue({
      ...MOCK_EVENT,
      name: 'Updated Event',
    })
    prismaMock.eventOccurrence.update.mockResolvedValue({
      id: 'occ_1',
    })

    const request = new NextRequest('http://localhost/api/events/test', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Event',
        date: '2025-02-01',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }),
    })
    const json = await response.json()

    expect(prismaMock.event.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'ckl9z5rte0000s6m1gj8h3x7d' },
      data: expect.objectContaining({
        name: 'Updated Event',
      }),
    }))
    expect(prismaMock.eventOccurrence.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'occ_1' },
      data: expect.objectContaining({
        date: new Date(2025, 1, 1),
      }),
    }))
    expect(response.status).toBe(200)
    expect(json.name).toBe('Updated Event')
  })

  it('deletes events when they exist', async () => {
    prismaMock.event.findUnique.mockResolvedValue({ id: 'ckl9z5rte0000s6m1gj8h3x7d' })
    prismaMock.event.delete.mockResolvedValue({ id: 'ckl9z5rte0000s6m1gj8h3x7d' })

    const response = await DELETE(new NextRequest('http://localhost/api/events/test'), {
      params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }),
    })
    const json = await response.json()

    expect(prismaMock.event.delete).toHaveBeenCalledWith({
      where: { id: 'ckl9z5rte0000s6m1gj8h3x7d' },
    })
    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
  })
})
