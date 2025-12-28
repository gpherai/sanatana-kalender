import { describe, it, expect } from 'vitest'
import {
  THEME_CATALOG,
  THEME_NAMES,
  DEFAULT_THEME,
  DEFAULT_THEME_NAME,
  getDefaultTheme,
  getThemeByName,
  getThemeNames,
  getSpecialThemes,
  getStandardThemes,
  getThemesByCategory,
  getAllThemeOptions,
  isValidThemeName,
  parseStoredThemeState,
  serializeThemeState,
} from '../themes'

describe('Theme catalog', () => {
  it('has unique theme names', () => {
    const names = THEME_CATALOG.map((theme) => theme.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('defines a single default theme', () => {
    const defaults = THEME_CATALOG.filter((theme) => theme.isDefault)
    expect(defaults).toHaveLength(1)
    expect(DEFAULT_THEME.name).toBe(defaults[0]?.name)
    expect(DEFAULT_THEME_NAME).toBe(DEFAULT_THEME.name)
    expect(getDefaultTheme().name).toBe(DEFAULT_THEME.name)
  })

  it('gets themes by name and category', () => {
    const first = THEME_CATALOG[0]
    expect(getThemeByName(first?.name ?? '')).toBe(first)
    expect(getThemeByName('unknown-theme')).toBeUndefined()

    const specials = getSpecialThemes()
    expect(specials.every((theme) => theme.category === 'special')).toBe(true)

    const standard = getStandardThemes()
    expect(standard.every((theme) => theme.category !== 'special')).toBe(true)

    const classic = getThemesByCategory('classic')
    expect(classic.every((theme) => theme.category === 'classic')).toBe(true)
  })

  it('maps to theme options consistently', () => {
    const options = getAllThemeOptions()
    expect(options).toHaveLength(THEME_CATALOG.length)
    expect(options[0]).toEqual(expect.objectContaining({
      name: THEME_CATALOG[0]?.name,
      displayName: THEME_CATALOG[0]?.displayName,
      description: THEME_CATALOG[0]?.description,
    }))
  })

  it('validates stored theme state', () => {
    const valid = serializeThemeState({
      themeName: DEFAULT_THEME_NAME,
      colorMode: 'system',
    })
    expect(parseStoredThemeState(valid)).toEqual({
      themeName: DEFAULT_THEME_NAME,
      colorMode: 'system',
    })

    expect(parseStoredThemeState('{bad json}')).toBeNull()
    expect(parseStoredThemeState(JSON.stringify({ themeName: 'bad', colorMode: 'dark' })))
      .toBeNull()
    expect(parseStoredThemeState(JSON.stringify({ themeName: DEFAULT_THEME_NAME, colorMode: 'bad' })))
      .toBeNull()
  })

  it('exposes theme names', () => {
    expect(getThemeNames()).toEqual(THEME_NAMES)
    expect(isValidThemeName(DEFAULT_THEME_NAME)).toBe(true)
    expect(isValidThemeName('bad-theme')).toBe(false)
  })
})
