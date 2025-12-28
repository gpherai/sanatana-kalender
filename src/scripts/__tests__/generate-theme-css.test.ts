import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { THEME_CATALOG, DEFAULT_THEME_NAME } from '@/config/themes'

const { written } = vi.hoisted(() => ({
  written: {
    path: '',
    data: '',
    encoding: '' as string | undefined,
  },
}))

vi.mock('fs', () => ({
  writeFileSync: vi.fn((filePath: string, data: string, encoding?: string) => {
    written.path = filePath
    written.data = data
    written.encoding = encoding
  }),
  statSync: vi.fn(() => ({ size: written.data.length })),
}))

describe('generate-theme-css script', () => {
  beforeEach(() => {
    vi.resetModules()
    written.path = ''
    written.data = ''
    written.encoding = undefined
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes generated CSS with expected sections', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await import('../generate-theme-css')

    expect(written.data).toContain('DHARMA CALENDAR - GENERATED THEME CSS')
    expect(written.data).toContain(`Themes: ${THEME_CATALOG.length} total`)
    expect(written.data).toContain(`Default theme: ${DEFAULT_THEME_NAME}`)
    expect(written.data).toContain('@theme inline')
    expect(written.data).toContain('.bg-theme-primary-10')
    expect(written.data).not.toMatch(/\.bg-theme-primary\/10\s*\{/)
    expect(written.data).toContain('[data-theme="spiritual-minimal"]')
    expect(written.data).toContain('[data-theme="bhairava-nocturne"]')

    const normalizedPath = written.path.split(path.sep).join('/')
    expect(normalizedPath).toContain('src/app/globals.css')

    logSpy.mockRestore()
  })
})
