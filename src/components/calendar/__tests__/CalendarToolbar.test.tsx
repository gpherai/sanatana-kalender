import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarToolbar } from '../CalendarToolbar'

// Mock props
const defaultProps = {
  date: new Date('2025-01-01'),
  view: 'month' as const,
  onNavigate: vi.fn(),
  onView: vi.fn(),
  label: 'Januari 2025',
  localizer: {} as Record<string, never>,
  views: ['month', 'week', 'agenda'],
  children: null,
}

describe('CalendarToolbar', () => {
  it('renders current date (month year)', () => {
    render(<CalendarToolbar {...defaultProps} />)
    expect(screen.getByText(/Januari 2025/i)).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<CalendarToolbar {...defaultProps} />)
    expect(screen.getByText('Vandaag')).toBeInTheDocument()
    expect(screen.getByLabelText('Vorige')).toBeInTheDocument()
    expect(screen.getByLabelText('Volgende')).toBeInTheDocument()
  })

  it('calls onNavigate when clicking buttons', () => {
    render(<CalendarToolbar {...defaultProps} />)
    
    fireEvent.click(screen.getByLabelText('Vorige'))
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('PREV')

    fireEvent.click(screen.getByLabelText('Volgende'))
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('NEXT')

    fireEvent.click(screen.getByText('Vandaag'))
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('TODAY')
  })

  it('renders view buttons', () => {
    render(<CalendarToolbar {...defaultProps} />)
    expect(screen.getByText('Maand')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Agenda')).toBeInTheDocument()
  })

  it('calls onView when changing view', () => {
    render(<CalendarToolbar {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Week'))
    expect(defaultProps.onView).toHaveBeenCalledWith('week')
  })
})
