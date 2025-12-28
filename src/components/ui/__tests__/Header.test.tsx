import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Mock Theme Toggle to simplify test
vi.mock('@/components/theme', () => ({
  ColorModeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}))

describe('Header Component', () => {
  it('renders logo correctly', () => {
    render(<Header />)
    expect(screen.getByText('Dharma Calendar')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)
    const links = ['Home', 'Almanac', 'Events', 'Instellingen']
    
    links.forEach(link => {
      // Note: text might be hidden on small screens, but present in DOM
      expect(screen.getByText(link)).toBeInTheDocument()
    })
  })

  it('renders "New Event" button', () => {
    render(<Header />)
    expect(screen.getByText('Nieuw')).toBeInTheDocument()
  })
  
  it('renders theme toggle', () => {
      render(<Header />)
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })
})
