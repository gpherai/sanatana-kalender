import { describe, it, expect } from 'vitest'
import {
  getCategoryBgClass,
  getCategoryBorderClass,
  getCategoryDynamicStyle,
  getDynamicCategoryClass,
} from '../category-styles'

describe('Category Styles', () => {
  it('builds background class with default opacity', () => {
    expect(getCategoryBgClass('ganesha')).toBe('bg-category-ganesha-15')
  })

  it('builds border class with default opacity', () => {
    expect(getCategoryBorderClass('shiva')).toBe('border-category-shiva-20')
  })

  it('supports custom opacity levels for class helpers', () => {
    expect(getCategoryBgClass('krishna', 10)).toBe('bg-category-krishna-10')
    expect(getCategoryBorderClass('durga', 30)).toBe('border-category-durga-30')
  })

  it('builds dynamic style for custom opacity', () => {
    const result = getCategoryDynamicStyle('oklch(0.5 0.1 30)', 25)
    expect(result).toEqual({
      backgroundColor: 'color-mix(in oklch, oklch(0.5 0.1 30) 25%, transparent)',
    })
  })

  it('builds dynamic class for CSS custom properties', () => {
    expect(getDynamicCategoryClass(15)).toBe('bg-category-dynamic-15')
  })
})
