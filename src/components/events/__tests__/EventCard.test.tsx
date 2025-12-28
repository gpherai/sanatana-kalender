import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { EventCard, EventCardCompact } from '../EventCard'
import type { Category } from '@/types/calendar'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const CATEGORY: Category = {
  id: 'cat_1',
  name: 'ganesha',
  displayName: 'Ganesha',
  icon: 'G',
  color: '#fff',
  description: null,
  sortOrder: 1,
}

describe('EventCard', () => {
  it('renders details and badges', () => {
    render(
      <EventCard
        id="evt_1"
        name="Festival"
        description="Event description"
        date={new Date(2025, 0, 1)}
        endDate={new Date(2025, 0, 3)}
        startTime="09:00"
        endTime="10:00"
        category={CATEGORY}
        eventType="FESTIVAL"
        importance="MAJOR"
        tithi="Pratipada"
        nakshatra="Ashwini"
        tags={['alpha', 'beta', 'gamma', 'delta', 'epsilon']}
      />
    )

    expect(screen.getByText('Belangrijk')).toBeInTheDocument()
    expect(screen.getByText('Event description')).toBeInTheDocument()
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument()
    expect(screen.getByText(/Pratipada/)).toBeInTheDocument()
    expect(screen.getByText(/Ashwini/)).toBeInTheDocument()
    expect(screen.getByText('+1 meer')).toBeInTheDocument()
    expect(screen.getByText('(3 dagen)')).toBeInTheDocument()
  })

  it('falls back to general category when none is provided', () => {
    render(
      <EventCard
        id="evt_5"
        name="No Category"
        date={new Date(2025, 0, 1)}
        eventType="OTHER"
        importance="MINOR"
      />
    )

    expect(screen.getByText('Algemeen')).toBeInTheDocument()
  })

  it('renders a link when onClick is not provided', () => {
    render(
      <EventCard
        id="evt_1"
        name="Festival"
        date={new Date(2025, 0, 1)}
        category={CATEGORY}
        eventType="FESTIVAL"
        importance="MODERATE"
      />
    )

    const link = screen.getByRole('link', { name: /Festival/i })
    expect(link).toHaveAttribute('href', '/events/evt_1')
  })

  it('renders a button when onClick is provided', async () => {
    const onClick = vi.fn()
    render(
      <EventCard
        id="evt_2"
        name="Festival"
        date={new Date(2025, 0, 1)}
        category={CATEGORY}
        eventType="FESTIVAL"
        importance="MODERATE"
        onClick={onClick}
      />
    )

    const button = screen.getByRole('button', { name: /Festival/i })
    await userEvent.click(button)

    expect(onClick).toHaveBeenCalled()
  })
})

describe('EventCardCompact', () => {
  it('renders a link by default', () => {
    render(
      <EventCardCompact
        id="evt_3"
        name="Compact"
        date={new Date(2025, 0, 1)}
        category={CATEGORY}
        eventType="FESTIVAL"
        importance="MODERATE"
      />
    )

    const link = screen.getByRole('link', { name: /Compact/i })
    expect(link).toHaveAttribute('href', '/events/evt_3')
  })

  it('renders a button when onClick is provided', async () => {
    const onClick = vi.fn()
    render(
      <EventCardCompact
        id="evt_4"
        name="Compact"
        date={new Date(2025, 0, 1)}
        category={CATEGORY}
        eventType="FESTIVAL"
        importance="MAJOR"
        onClick={onClick}
      />
    )

    const button = screen.getByRole('button', { name: /Compact/i })
    await userEvent.click(button)

    expect(onClick).toHaveBeenCalled()
  })
})
