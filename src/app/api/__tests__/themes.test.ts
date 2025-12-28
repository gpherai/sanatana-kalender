import { describe, it, expect } from 'vitest'
import { THEME_CATALOG } from '@/config/themes'
import { GET } from '../themes/route'

describe('GET /api/themes', () => {
  it('returns catalog themes in API format', async () => {
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveLength(THEME_CATALOG.length)
    expect(json[0]).toEqual(expect.objectContaining({
      id: THEME_CATALOG[0]?.name,
      name: THEME_CATALOG[0]?.name,
      displayName: THEME_CATALOG[0]?.displayName,
      isDefault: THEME_CATALOG[0]?.isDefault,
    }))
  })
})
