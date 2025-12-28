import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'
import NewEventPage from '../events/new/page'
import EditEventPage from '../events/[id]/page'

const { eventFormMock, notFound } = vi.hoisted(() => ({
  eventFormMock: vi.fn((_props: { mode: string }) => <div data-testid="event-form" />),
  notFound: vi.fn(() => {
    throw new Error('notFound')
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  notFound,
}))

vi.mock('@/components/events', () => ({
  EventForm: (props: { mode: string }) => eventFormMock(props),
}))

vi.mock('@/components/layout', () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('Event Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the new event form', () => {
    render(<NewEventPage />)

    expect(screen.getByText('Nieuw Event')).toBeInTheDocument()
    expect(eventFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'create' })
    )
  })

  it('calls notFound when event does not exist', async () => {
    prismaMock.event.findUnique.mockResolvedValue(null)

    await expect(
      EditEventPage({ params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }) })
    ).rejects.toThrow('notFound')

    expect(notFound).toHaveBeenCalled()
  })

  it('renders edit form with initial data', async () => {
    prismaMock.event.findUnique.mockResolvedValue({
      id: 'evt_1',
      name: 'Edit Event',
      description: null,
      eventType: 'FESTIVAL',
      categoryId: null,
      importance: 'MODERATE',
      recurrenceType: 'NONE',
      tithi: null,
      nakshatra: null,
      maas: null,
      tags: [],
      category: null,
      occurrences: [
        {
          id: 'occ_1',
          date: new Date(2025, 0, 1),
          endDate: null,
          startTime: null,
          endTime: null,
          notes: null,
        },
      ],
    })

    const ui = await EditEventPage({
      params: Promise.resolve({ id: 'ckl9z5rte0000s6m1gj8h3x7d' }),
    })
    render(ui)

    expect(screen.getByText('Event Bewerken')).toBeInTheDocument()
    expect(eventFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'edit',
        initialData: expect.objectContaining({ name: 'Edit Event' }),
      })
    )
  })
})
