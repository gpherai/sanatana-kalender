import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonthGrid } from '../MonthGrid'
import { formatDateISO } from '@/lib/date-utils'
import type { CalendarEventResponse } from '@/types/calendar'

describe('MonthGrid', () => {
  it('renders event count and handles date selection', async () => {
    const onSelectDate = vi.fn()
    const date = new Date(2025, 0, 2)
    const dateKey = formatDateISO(date)
    const event: CalendarEventResponse = {
      id: 'occ_1',
      eventId: 'evt_1',
      title: 'Event',
      start: '2025-01-02',
      end: '2025-01-03',
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

    render(
      <MonthGrid
        year={2025}
        month={0}
        days={[date]}
        startPadding={0}
        dailyInfoMap={new Map()}
        eventsMap={new Map([[dateKey, [event, event, event]]])}
        specialDaysMap={new Map()}
        moonPhasesMap={new Map()}
        selectedDate={date}
        onSelectDate={onSelectDate}
        showMoonPhases={false}
        showSpecialDays={false}
        showEvents={true}
      />
    )

    expect(screen.getByText('3')).toBeInTheDocument()

    const dayNumber = screen.getByText('2')
    const dayButton = dayNumber.closest('button')
    expect(dayButton).toBeTruthy()
    expect(dayButton).toHaveClass('bg-theme-primary')

    await userEvent.click(dayButton as HTMLButtonElement)
    expect(onSelectDate).toHaveBeenCalledWith(date)
  })
})
