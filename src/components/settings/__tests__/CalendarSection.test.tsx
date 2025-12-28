import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarSection } from '../CalendarSection'

describe('CalendarSection', () => {
  it('calls onFieldChange for select updates', () => {
    const onFieldChange = vi.fn()

    render(
      <CalendarSection
        defaultView="month"
        weekStartsOn={1}
        timezone="Europe/Amsterdam"
        onFieldChange={onFieldChange}
      />
    )

    fireEvent.change(screen.getByLabelText(/Standaard weergave/i), {
      target: { value: 'week' },
    })
    fireEvent.change(screen.getByLabelText(/Week begint op/i), {
      target: { value: '0' },
    })
    fireEvent.change(screen.getByLabelText(/Tijdzone/i), {
      target: { value: 'Asia/Kolkata' },
    })

    expect(onFieldChange).toHaveBeenCalledWith('defaultView', 'week')
    expect(onFieldChange).toHaveBeenCalledWith('weekStartsOn', 0)
    expect(onFieldChange).toHaveBeenCalledWith('timezone', 'Asia/Kolkata')
  })
})
