import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AlmanacFilters } from '../AlmanacFilters'

const defaultProps = {
  year: 2025,
  month: 0, // Jan
  showMoonPhases: true,
  showSpecialDays: true,
  showEvents: true,
  onYearChange: vi.fn(),
  onMonthChange: vi.fn(),
  onToggleFilter: vi.fn(),
}

describe('AlmanacFilters', () => {
  it('renders current year', () => {
    render(<AlmanacFilters {...defaultProps} />)
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('handles year navigation', () => {
    render(<AlmanacFilters {...defaultProps} />)
    
    // Prev year
    fireEvent.click(screen.getByLabelText('Vorig jaar'))
    expect(defaultProps.onYearChange).toHaveBeenCalledWith(2024)

    // Next year
    fireEvent.click(screen.getByLabelText('Volgend jaar'))
    expect(defaultProps.onYearChange).toHaveBeenCalledWith(2026)
  })

  it('handles month selection', () => {
    render(<AlmanacFilters {...defaultProps} />)
    
    // Click February
    fireEvent.click(screen.getByText('Feb'))
    expect(defaultProps.onMonthChange).toHaveBeenCalledWith(1) // 0-indexed
  })

  it('handles filter toggles', () => {
    render(<AlmanacFilters {...defaultProps} />)
    
    fireEvent.click(screen.getByText(/Maanfases/))
    expect(defaultProps.onToggleFilter).toHaveBeenCalledWith('moonPhases')

    fireEvent.click(screen.getByText(/Speciale dagen/))
    expect(defaultProps.onToggleFilter).toHaveBeenCalledWith('specialDays')

    fireEvent.click(screen.getByText(/Events/))
    expect(defaultProps.onToggleFilter).toHaveBeenCalledWith('events')
  })
})
