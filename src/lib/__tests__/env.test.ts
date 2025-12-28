import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const originalDatabaseUrl = process.env.DATABASE_URL
const originalNodeEnv = process.env.NODE_ENV

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('validates PostgreSQL connection strings', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
    process.env.NODE_ENV = 'production'

    const { env, isDev, isProd, isTest } = await import('../env')

    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/test')
    expect(env.NODE_ENV).toBe('production')
    expect(isProd).toBe(true)
    expect(isDev).toBe(false)
    expect(isTest).toBe(false)
  })

  it('defaults NODE_ENV to development when missing', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/test'
    delete process.env.NODE_ENV

    const { env, isDev, isProd, isTest } = await import('../env')

    expect(env.NODE_ENV).toBe('development')
    expect(isDev).toBe(true)
    expect(isProd).toBe(false)
    expect(isTest).toBe(false)
  })

  it('throws for invalid database URLs', async () => {
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/test'
    process.env.NODE_ENV = 'test'

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(import('../env')).rejects.toThrow('Environment validation failed')

    errorSpy.mockRestore()
  })
})
