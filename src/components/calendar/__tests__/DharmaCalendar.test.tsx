import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'
import { DharmaCalendar } from '../DharmaCalendar'
import type { CalendarEventResponse } from '@/types/calendar'

let lastCalendarProps: Record<string, unknown> | null = null

vi.mock('../EventDetailModal', () => ({
  EventDetailModal: ({
    event,
    isOpen,
  }: {
    event: { title: string }
    isOpen: boolean
  }) => (isOpen ? <div data-testid="event-modal">{event.title}</div> : null),
}))

vi.mock('react-big-calendar', () => ({
  Calendar: (props: Record<string, unknown>) => {
    lastCalendarProps = props
    const events = (props.events as unknown[] | undefined) ?? []
    const firstEvent = events[0] as { start?: unknown } | undefined
    const startType = firstEvent?.start instanceof Date ? 'date' : 'none'

    return (
      <div
        data-testid="calendar"
        data-events-count={events.length}
        data-first-event-start={startType}
      />
    )
  },
  dateFnsLocalizer: () => ({}),
}))

describe('DharmaCalendar', () => {
  beforeEach(() => {
    lastCalendarProps = null
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches events and passes them to the calendar', async () => {
    const fetchMock = vi.mocked(fetch)
    const event: CalendarEventResponse = {
      id: 'occ_1',
      eventId: 'evt_1',
      title: 'Test Event',
      start: '2025-01-01',
      end: '2025-01-02',
      allDay: true,
      resource: {
        description: null,
        eventType: 'FESTIVAL',
        importance: 'MAJOR',
        category: null,
        categoryId: null,
        tithi: null,
        nakshatra: null,
        maas: null,
        tags: [],
        notes: null,
        startTime: null,
        endTime: null,
        originalEndDate: null,
      },
    }

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [event],
    } as Response)

    const now = new Date()
    const expectedStart = startOfMonth(addMonths(now, -1))
    const expectedEnd = endOfMonth(addMonths(now, 1))

    render(<DharmaCalendar />)

    const calendar = await screen.findByTestId('calendar')

    await waitFor(() => {
      expect(calendar).toHaveAttribute('data-events-count', '1')
    })

    // Format dates using formatDateLocal (matches component implementation)
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startStr = formatDateLocal(expectedStart)
    const endStr = formatDateLocal(expectedEnd)

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/events?start=${startStr}T00:00:00.000Z&end=${endStr}T23:59:59.999Z`
    )
    expect(calendar).toHaveAttribute('data-first-event-start', 'date')
    expect(lastCalendarProps?.view).toBe('month')
  })

  it('shows loading overlay while fetching', async () => {
    const fetchMock = vi.mocked(fetch)
    let resolveFetch: (value: Response) => void

    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }) as Promise<Response>
    )

    render(<DharmaCalendar />)

    expect(screen.getByText('Laden...')).toBeInTheDocument()

    resolveFetch!({
      ok: true,
      json: async () => [],
    } as Response)

    await waitFor(() => {
      expect(screen.queryByText('Laden...')).not.toBeInTheDocument()
    })
  })

  it('clears loading state when fetch fails', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new Error('boom'))

    render(<DharmaCalendar />)

    expect(screen.getByText('Laden...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Laden...')).not.toBeInTheDocument()
    })
  })

  it('opens event detail modal when selecting an event', async () => {
    const fetchMock = vi.mocked(fetch)
    const event: CalendarEventResponse = {
      id: 'occ_1',
      eventId: 'evt_1',
      title: 'Test Event',
      start: '2025-01-01',
      end: '2025-01-02',
      allDay: true,
      resource: {
        description: null,
        eventType: 'FESTIVAL',
        importance: 'MAJOR',
        category: null,
        categoryId: null,
        tithi: null,
        nakshatra: null,
        maas: null,
        tags: [],
        notes: null,
        startTime: null,
        endTime: null,
        originalEndDate: null,
      },
    }

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [event],
    } as Response)

    render(<DharmaCalendar />)

    await waitFor(() => {
      expect((lastCalendarProps?.events as unknown[])?.length).toBe(1)
    })

    const events = lastCalendarProps?.events as unknown[]
    const onSelectEvent = lastCalendarProps?.onSelectEvent as (value: unknown) => void

    await act(async () => {
      onSelectEvent?.(events[0])
    })

    expect(await screen.findByTestId('event-modal')).toHaveTextContent('Test Event')
  })

  it('builds event styles based on category color and importance', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    render(<DharmaCalendar />)

    await waitFor(() => {
      expect(lastCalendarProps).not.toBeNull()
    })

    const eventPropGetter = lastCalendarProps?.eventPropGetter as (value: unknown) => {
      style: Record<string, unknown>
    }

    const event = {
      resource: {
        category: { color: '#123456' },
        importance: 'MAJOR',
      },
    }

    const result = eventPropGetter(event)
    expect(result.style.backgroundColor).toBe('#123456')
    expect(result.style.fontWeight).toBe('bold')
  })

  it('marks weekends with a background style', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    render(<DharmaCalendar />)

    await waitFor(() => {
      expect(lastCalendarProps).not.toBeNull()
    })

    const dayPropGetter = lastCalendarProps?.dayPropGetter as (value: Date) => {
      style?: Record<string, unknown>
    }

    const sunday = new Date(2025, 0, 5)
    const weekday = new Date(2025, 0, 6)

    expect(dayPropGetter(sunday).style).toBeDefined()
    expect(dayPropGetter(weekday).style).toBeUndefined()
  })
})
