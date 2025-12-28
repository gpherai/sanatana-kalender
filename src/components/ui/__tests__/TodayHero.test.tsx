import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TodayHero } from '../TodayHero'

// Mock child components to simplify testing
vi.mock('./MoonPhase', () => ({
  MoonPhase: () => <div data-testid="moon-phase">MoonPhase Mock</div>
}))

// Mock helpers that are used
vi.mock('@/lib/panchanga-helpers', () => ({
  getApproximateHinduMonth: () => 'Margashirsha',
  detectSpecialDay: () => null
}))

// Mock daily info response
const MOCK_DAILY_INFO = {
  date: '2025-01-01',
  locationName: 'Den Haag',
  sunrise: '08:00',
  sunset: '16:00',
  moonrise: '20:00',
  moonset: '09:00',
  moonPhasePercent: 50,
  moonPhaseName: 'Eerste Kwartier',
  isWaxing: true,
  tithi: { name: 'Pratipada', paksha: 'Shukla', endTime: '12:00' },
  nakshatra: { name: 'Ashwini', pada: 1 },
}

const MOCK_TODAY_EVENTS = [
  {
    eventId: '1',
    title: 'New Year Puja',
    start: '2025-01-01',
    resource: {
      category: 'ganesha',
      categoryIcon: '🐘',
      eventType: 'PUJA',
      importance: 'MAJOR',
    },
  },
]

describe('TodayHero Component', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<TodayHero />)
    expect(screen.getByText(/Loading today's info/i)).toBeInTheDocument()
  })

  it('renders daily info after fetch', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/daily-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_DAILY_INFO),
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TODAY_EVENTS),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
    render(<TodayHero />)

    // Wait for loading to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Loading today's info/i)).not.toBeInTheDocument()
    })

    // Check header info
    expect(screen.getByText('Margashirsha Maas')).toBeInTheDocument()
    expect(screen.getByText(/Pratipada/)).toBeInTheDocument()
    
    // Check sun times
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('16:00')).toBeInTheDocument()
  })

  it('renders today events', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/daily-info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_DAILY_INFO),
        })
      }
      if (url.includes('/api/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_TODAY_EVENTS),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
    render(<TodayHero />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText('New Year Puja')).toBeInTheDocument()
    expect(screen.getByText('🐘')).toBeInTheDocument()
  })
})
