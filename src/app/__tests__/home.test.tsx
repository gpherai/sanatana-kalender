import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'
import Home from '../page'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/calendar', () => ({
  DharmaCalendar: () => <div data-testid="calendar" />,
}))

vi.mock('@/components/ui', () => ({
  TodayHero: () => <div data-testid="today-hero" />,
}))

vi.mock('@/components/layout', () => ({
  PageLayout: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}))

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no upcoming events exist', async () => {
    prismaMock.eventOccurrence.findMany.mockResolvedValue([])
    prismaMock.category.findMany.mockResolvedValue([])

    const ui = await Home()
    render(ui)

    expect(screen.getByText('Geen aankomende events')).toBeInTheDocument()
    expect(screen.getByText('Voeg er een toe')).toBeInTheDocument()
  })

  it('renders major events when present', async () => {
    prismaMock.eventOccurrence.findMany.mockResolvedValue([
      {
        id: 'occ_1',
        date: new Date(),
        endDate: null,
        event: {
          id: 'evt_1',
          name: 'Maha Shivaratri',
          importance: 'MAJOR',
          category: { icon: '🕉️' },
        },
      },
    ])
    prismaMock.category.findMany.mockResolvedValue([
      {
        id: 'cat_1',
        displayName: 'Ganesha',
        icon: '🐘',
        color: '#fff',
      },
    ])

    const ui = await Home()
    render(ui)

    expect(screen.getByText('Belangrijke Events (7 dagen)')).toBeInTheDocument()
    expect(screen.getByText('Maha Shivaratri')).toBeInTheDocument()
  })
})
