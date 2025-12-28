import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterSidebar } from '../FilterSidebar'
import { CATEGORIES } from '@/lib/constants'
import type { FilterState } from '@/hooks/useFilters'

const BASE_FILTERS: FilterState = {
  search: '',
  categories: [],
  eventTypes: [],
  importances: [],
  specialTithis: [],
  sortBy: 'date',
  sortOrder: 'asc',
}

describe('FilterSidebar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows active filter count and clears filters', async () => {
    const onClearFilters = vi.fn()

    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={vi.fn()}
        onToggleFilter={vi.fn()}
        onClearFilters={onClearFilters}
        activeFilterCount={2}
      />
    )

    const clearButton = screen.getByRole('button', { name: /Wissen/i })
    await userEvent.click(clearButton)

    expect(onClearFilters).toHaveBeenCalled()
  })

  it('debounces search input changes', async () => {
    vi.useFakeTimers()
    const onFilterChange = vi.fn()

    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    )

    const input = screen.getByPlaceholderText('Zoeken...')
    fireEvent.change(input, { target: { value: 'shiv' } })

    expect(onFilterChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(onFilterChange).toHaveBeenCalledWith('search', 'shiv')
  })

  it('toggles a category filter', async () => {
    const onToggleFilter = vi.fn()
    const user = userEvent.setup()
    const category = CATEGORIES[0]

    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={vi.fn()}
        onToggleFilter={onToggleFilter}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    )

    const checkbox = screen.getByLabelText(new RegExp(category.label))
    await user.click(checkbox)

    expect(onToggleFilter).toHaveBeenCalledWith('categories', category.value)
  })

  it('clears search when clear button is clicked', async () => {
    const onFilterChange = vi.fn()

    render(
      <FilterSidebar
        filters={{ ...BASE_FILTERS, search: 'shiva' }}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={1}
      />
    )

    const input = screen.getByPlaceholderText('Zoeken...')
    const clearButton = input.parentElement?.querySelector('button')
    expect(clearButton).toBeTruthy()

    await userEvent.click(clearButton as HTMLButtonElement)

    expect(onFilterChange).toHaveBeenCalledWith('search', '')
  })

  it('updates sort order selections', async () => {
    const onFilterChange = vi.fn()

    render(
      <FilterSidebar
        filters={BASE_FILTERS}
        onFilterChange={onFilterChange}
        onToggleFilter={vi.fn()}
        onClearFilters={vi.fn()}
        activeFilterCount={0}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /Sortering/i }))

    const [sortBySelect, sortOrderSelect] = screen.getAllByRole('combobox')

    fireEvent.change(sortBySelect, { target: { value: 'name' } })
    fireEvent.change(sortOrderSelect, { target: { value: 'desc' } })

    expect(onFilterChange).toHaveBeenCalledWith('sortBy', 'name')
    expect(onFilterChange).toHaveBeenCalledWith('sortOrder', 'desc')
  })
})
