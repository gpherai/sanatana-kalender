import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../ThemeProvider'
import { ColorModeToggle, ColorModeSelect } from '../ColorModeToggle'

function mockMatchMedia(matches = false) {
  return vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }))
}

describe('ColorModeToggle', () => {
  beforeEach(() => {
    window.matchMedia = mockMatchMedia(false) as typeof window.matchMedia
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('toggles between light and dark', async () => {
    render(
      <ThemeProvider defaultColorMode="light">
        <ColorModeToggle />
      </ThemeProvider>
    )

    const button = await screen.findByLabelText(/Switch to dark mode/i)
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByLabelText(/Switch to light mode/i)).toBeInTheDocument()
    })
  })

  it('updates color mode via select', async () => {
    render(
      <ThemeProvider defaultColorMode="light">
        <ColorModeSelect />
      </ThemeProvider>
    )

    const select = await screen.findByLabelText('Kleurmodus selecteren')
    fireEvent.change(select, { target: { value: 'dark' } })

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})
