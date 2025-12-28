import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'vitest-mock-extended'
import { vi } from 'vitest'

const prismaMock = mockDeep<PrismaClient>()

vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock,
}))

export { prismaMock }