import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock } from '@/__tests__/helpers/prisma-mock'
import { GET } from '../categories/route'

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns categories ordered by sortOrder', async () => {
    prismaMock.category.findMany.mockResolvedValue([
      {
        id: 'cat_1',
        name: 'ganesha',
        displayName: 'Ganesha',
        icon: '🐘',
        color: '#fff',
        description: null,
        sortOrder: 1,
      },
    ])

    const response = await GET()
    const json = await response.json()

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { sortOrder: 'asc' },
    }))
    expect(response.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].name).toBe('ganesha')
  })

  it('returns server error when prisma fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    prismaMock.category.findMany.mockRejectedValue(new Error('boom'))

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBe('INTERNAL_ERROR')

    errorSpy.mockRestore()
  })
})
