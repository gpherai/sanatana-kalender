import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DayDetailsPanel } from '../DayDetailsPanel'
import type { DailyInfoResponse } from '@/types'

// Mock dependencies
vi.mock('@/components/ui/MoonPhase', () => ({
  MoonPhase: () => <div data-testid="moon-phase">MoonPhase</div>
}))

vi.mock('@/lib/panchanga-helpers', () => ({
  getApproximateHinduMonth: () => 'Margashirsha',
}))

const MOCK_DATE = new Date('2025-01-01')

const MOCK_INFO = {
  date: '2025-01-01',
  locationName: 'Den Haag',
  locationLat: 52.0705,
  locationLon: 4.3007,
  sunrise: '08:00',
  sunset: '16:00',
  moonrise: '20:00',
  moonset: '09:00',
  moonPhasePercent: 50,
  moonPhaseName: 'First Quarter',
  moonPhaseType: 'FIRST_QUARTER',
  moonPhaseEmoji: '🌓',
  isWaxing: true,
  tithi: { number: 1, name: 'Pratipada', paksha: 'Shukla' as const, endTime: '12:00' },
  nakshatra: { number: 1, name: 'Ashwini', pada: 1 as const, endTime: '14:00' },
  yoga: { number: 1, name: 'Vishkumbha', endTime: '10:00' },
  karana: { number: 1, name: 'Bava', type: 'Movable', endTime: '11:00' },
  rahuKalam: { start: '12:00', end: '13:30' },
  // Deprecated fields for backward compatibility
  tithiEndTime: '12:00',
  nakshatraEndTime: '14:00',
  yogaEndTime: '10:00',
  karanaType: 'Movable',
  karanaEndTime: '11:00',
  yogaName: 'Vishkumbha',
  karanaName: 'Bava',
} as unknown as DailyInfoResponse

const MOCK_EVENTS = [
  {
    id: '1',
    eventId: 'evt_1',
    title: 'Test Event',
    start: '2025-01-01',
    end: '2025-01-02',
    allDay: true,
    resource: {
      category: {
        id: 'test_id',
        name: 'test',
        displayName: 'Test',
        icon: '🧪',
        color: 'oklch(0.6 0.15 250)',
        description: null,
        sortOrder: 0,
      },
      categoryId: 'test_id',
      eventType: 'OTHER',
      importance: 'MODERATE',
      description: 'Test description',
      tithi: null,
      nakshatra: null,
      maas: null,
      tags: [],
      notes: null,
      startTime: null,
      endTime: null,
      originalEndDate: null,
    },
  },
]

const MOCK_SPECIAL_DAYS = [
  {
    date: MOCK_DATE,
    type: 'ekadashi',
    name: 'Ekadashi',
    description: 'Fasting day',
    emoji: '🙏',
  },
]

describe('DayDetailsPanel', () => {
  it('renders header info correctly', () => {
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={MOCK_INFO}
        selectedDayEvents={[]}
        selectedDaySpecial={[]}
        onEventClick={vi.fn()}
        showEvents={true}
        showSpecialDays={true}
      />
    )

    // Date
    expect(screen.getByText(/1 januari 2025/i)).toBeInTheDocument()
    
    // Hindu Month (mocked)
    expect(screen.getByText(/Margashirsha Maas/)).toBeInTheDocument()
    
    // Tithi
    expect(screen.getByText(/Pratipada/)).toBeInTheDocument()
    
    // Nakshatra
    expect(screen.getByText(/Ashwini/)).toBeInTheDocument()
  })

  it('renders sun and moon times', () => {
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={MOCK_INFO}
        selectedDayEvents={[]}
        selectedDaySpecial={[]}
        onEventClick={vi.fn()}
        showEvents={true}
        showSpecialDays={true}
      />
    )

    expect(screen.getByText('08:00')).toBeInTheDocument() // Sunrise
    expect(screen.getByText('16:00')).toBeInTheDocument() // Sunset
    expect(screen.getByText('20:00')).toBeInTheDocument() // Moonrise
  })

  it('renders events and handles click', () => {
    const onEventClick = vi.fn()
    
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={MOCK_INFO}
        selectedDayEvents={MOCK_EVENTS}
        selectedDaySpecial={[]}
        onEventClick={onEventClick}
        showEvents={true}
        showSpecialDays={true}
      />
    )

    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('🧪')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Test Event'))
    expect(onEventClick).toHaveBeenCalledWith(MOCK_EVENTS[0])
  })

  it('renders special days when enabled', () => {
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={MOCK_INFO}
        selectedDayEvents={[]}
        selectedDaySpecial={MOCK_SPECIAL_DAYS}
        onEventClick={vi.fn()}
        showEvents={true}
        showSpecialDays={true}
      />
    )

    expect(screen.getByText('Ekadashi')).toBeInTheDocument()
    expect(screen.getByText('Fasting day')).toBeInTheDocument()
  })

  it('hides special days when disabled', () => {
    render(
      <DayDetailsPanel
        selectedDate={MOCK_DATE}
        selectedDayInfo={MOCK_INFO}
        selectedDayEvents={[]}
        selectedDaySpecial={MOCK_SPECIAL_DAYS}
        onEventClick={vi.fn()}
        showEvents={true}
        showSpecialDays={false} // Disabled
      />
    )

    expect(screen.queryByText('Ekadashi')).not.toBeInTheDocument()
  })

  it('renders panchanga details (yoga, karana)', () => {
    render(
        <DayDetailsPanel
          selectedDate={MOCK_DATE}
          selectedDayInfo={MOCK_INFO}
          selectedDayEvents={[]}
          selectedDaySpecial={[]}
          onEventClick={vi.fn()}
          showEvents={true}
          showSpecialDays={true}
        />
      )
      
      expect(screen.getByText('Vishkumbha')).toBeInTheDocument()
      expect(screen.getByText(/Bava/)).toBeInTheDocument()
      expect(screen.getByText(/Rahu Kalam/)).toBeInTheDocument()
  })
})