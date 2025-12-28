import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  poolInstances,
  poolConfigs,
  poolOnCalls,
  adapterInstances,
  prismaInstances,
  prismaConstructorArgs,
  prismaQueryRaw,
  prismaDisconnect,
  mockEnv,
} = vi.hoisted(() => ({
  poolInstances: [] as Array<{ totalCount: number; idleCount: number; waitingCount: number }>,
  poolConfigs: [] as Array<Record<string, unknown>>,
  poolOnCalls: [] as Array<{ event: string }>,
  adapterInstances: [] as Array<{ pool: unknown }>,
  prismaInstances: [] as Array<unknown>,
  prismaConstructorArgs: [] as Array<Record<string, unknown>>,
  prismaQueryRaw: vi.fn(),
  prismaDisconnect: vi.fn(),
  mockEnv: {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
    NODE_ENV: 'test',
  },
}))

vi.mock('pg', () => {
  class Pool {
    totalCount = 0
    idleCount = 0
    waitingCount = 0
    on = vi.fn((event: string) => {
      poolOnCalls.push({ event })
      return this
    })
    end = vi.fn()

    constructor(config: Record<string, unknown>) {
      poolConfigs.push(config)
      poolInstances.push(this)
    }
  }

  return { Pool }
})

vi.mock('@prisma/adapter-pg', () => {
  class PrismaPg {
    pool: unknown
    constructor(pool: unknown) {
      this.pool = pool
      adapterInstances.push(this)
    }
  }

  return { PrismaPg }
})

vi.mock('@/generated/prisma/client', () => {
  class PrismaClient {
    $queryRaw = prismaQueryRaw
    $disconnect = prismaDisconnect

    constructor(args: Record<string, unknown>) {
      prismaConstructorArgs.push(args)
      prismaInstances.push(this)
    }
  }

  return { PrismaClient }
})

vi.mock('@/lib/env', () => ({
  env: mockEnv,
}))

async function importDbModule() {
  return await import('../db')
}

function resetGlobalPrisma() {
  const globalForPrisma = globalThis as { prisma?: unknown }
  delete globalForPrisma.prisma
}

describe('Database Client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    poolInstances.length = 0
    poolConfigs.length = 0
    poolOnCalls.length = 0
    adapterInstances.length = 0
    prismaInstances.length = 0
    prismaConstructorArgs.length = 0
    prismaQueryRaw.mockReset()
    prismaDisconnect.mockReset()

    resetGlobalPrisma()
  })

  it('configures pool and prisma client in development', async () => {
    mockEnv.NODE_ENV = 'development'

    const db = await importDbModule()

    expect(poolConfigs).toHaveLength(1)
    expect(poolConfigs[0]).toEqual(expect.objectContaining({
      connectionString: mockEnv.DATABASE_URL,
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }))
    expect(poolOnCalls[0]?.event).toBe('error')

    expect(adapterInstances).toHaveLength(1)
    expect(adapterInstances[0].pool).toBe(poolInstances[0])

    expect(prismaConstructorArgs).toHaveLength(1)
    expect(prismaConstructorArgs[0]).toEqual(expect.objectContaining({
      adapter: adapterInstances[0],
      log: ['warn', 'error'],
    }))

    const globalForPrisma = globalThis as { prisma?: unknown }
    expect(globalForPrisma.prisma).toBe(db.prisma)
  })

  it('reuses prisma client across imports in non-production', async () => {
    mockEnv.NODE_ENV = 'development'

    const first = await importDbModule()
    expect(prismaInstances).toHaveLength(1)

    vi.resetModules()

    const second = await importDbModule()
    expect(second.prisma).toBe(first.prisma)
    expect(prismaInstances).toHaveLength(1)
  })

  it('does not cache prisma client in production', async () => {
    mockEnv.NODE_ENV = 'production'

    await importDbModule()

    const globalForPrisma = globalThis as { prisma?: unknown }
    expect(globalForPrisma.prisma).toBeUndefined()
    expect(prismaConstructorArgs[0]).toEqual(expect.objectContaining({
      log: ['error'],
    }))
  })

  it('returns true when health check query succeeds', async () => {
    const { checkDatabaseHealth } = await importDbModule()

    prismaQueryRaw.mockResolvedValueOnce(1)

    await expect(checkDatabaseHealth()).resolves.toBe(true)
    expect(prismaQueryRaw).toHaveBeenCalledTimes(1)
  })

  it('returns false when health check query fails', async () => {
    const { checkDatabaseHealth } = await importDbModule()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    prismaQueryRaw.mockRejectedValueOnce(new Error('boom'))

    await expect(checkDatabaseHealth()).resolves.toBe(false)
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })

  it('returns pool stats from the active pool', async () => {
    const { getPoolStats } = await importDbModule()
    const pool = poolInstances[0]

    pool.totalCount = 4
    pool.idleCount = 2
    pool.waitingCount = 1

    expect(getPoolStats()).toEqual({
      totalCount: 4,
      idleCount: 2,
      waitingCount: 1,
    })
  })
})
