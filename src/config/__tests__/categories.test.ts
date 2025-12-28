import { describe, it, expect } from 'vitest'
import {
  CATEGORY_CATALOG,
  CATEGORY_NAMES,
  CATEGORY_COUNT,
  getCategoryByName,
  toCategoryOption,
  getAllCategoryOptions,
  isValidCategoryName,
  getCategoryColor,
  getCategoryIcon,
} from '../categories'

describe('Category catalog', () => {
  it('has unique category names', () => {
    const names = CATEGORY_CATALOG.map((category) => category.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('derives category names and counts', () => {
    expect(CATEGORY_COUNT).toBe(CATEGORY_CATALOG.length)
    expect(CATEGORY_NAMES).toEqual(CATEGORY_CATALOG.map((category) => category.name))
  })

  it('gets categories and options by name', () => {
    const sample = CATEGORY_CATALOG[0]
    expect(getCategoryByName(sample?.name ?? '')).toBe(sample)
    expect(getCategoryByName('unknown')).toBeUndefined()

    const option = toCategoryOption(sample!)
    expect(option).toEqual({
      value: sample?.name,
      label: sample?.displayName,
      icon: sample?.icon,
      color: sample?.color,
    })
  })

  it('returns category helpers', () => {
    const sample = CATEGORY_CATALOG[0]!
    expect(getAllCategoryOptions()).toHaveLength(CATEGORY_CATALOG.length)
    expect(isValidCategoryName(sample.name)).toBe(true)
    expect(isValidCategoryName('bad-category')).toBe(false)
    expect(getCategoryColor(sample.name)).toBe(sample.color)
    expect(getCategoryIcon(sample.name)).toBe(sample.icon)
  })
})
