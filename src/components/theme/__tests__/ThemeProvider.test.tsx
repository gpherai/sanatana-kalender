import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../ThemeProvider'
import { THEME_STORAGE_KEY, serializeThemeState } from '@/config/themes'

function ThemeConsumer() {
  const { themeName, toggleColorMode, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-name">{themeName}</span>
      <button type="button" onClick={toggleColorMode}>
        toggle
      </button>
      <button type="button" onClick={() => setTheme('traditional-rich')}>
        set-theme
      </button>
    </div>
  )
}

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

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.matchMedia = mockMatchMedia(false) as typeof window.matchMedia
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  it('applies stored theme and color mode from localStorage', async () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      serializeThemeState({ themeName: 'traditional-rich', colorMode: 'dark' })
    )

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'traditional-rich')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByTestId('theme-name')).toHaveTextContent('traditional-rich')
  })

  it('toggles color mode and updates DOM class', async () => {
    render(
      <ThemeProvider defaultColorMode="light">
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'toggle' }))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('updates theme via setTheme', async () => {
    render(
      <ThemeProvider defaultTheme="spiritual-minimal">
        <ThemeConsumer />
      </ThemeProvider>
    )

    await userEvent.click(screen.getByRole('button', { name: 'set-theme' }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'traditional-rich')
    })
  })
})
