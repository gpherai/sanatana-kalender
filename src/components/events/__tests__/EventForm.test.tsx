import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventForm } from '../EventForm'
import { ERROR_MESSAGES } from '@/lib/patterns'
import type { Category } from '@/types/calendar'

const mockUseFetch = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks')
  return {
    ...actual,
    useFetch: (...args: unknown[]) => mockUseFetch(...args),
  }
})

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
  }),
}))

const push = vi.fn()
const refresh = vi.fn()
const back = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    refresh,
    back,
  }),
}))

const CATEGORIES: Category[] = [
  {
    id: 'cat_1',
    name: 'ganesha',
    displayName: 'Ganesha',
    icon: '🐘',
    color: '#fff',
    description: null,
    sortOrder: 1,
  },
]

describe('EventForm', () => {
  beforeEach(() => {
    mockUseFetch.mockReturnValue({
      data: CATEGORIES,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    vi.stubGlobal('fetch', vi.fn())
    toastSuccess.mockClear()
    toastError.mockClear()
    push.mockClear()
    refresh.mockClear()
    back.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows validation errors when required fields are missing', async () => {
    render(<EventForm mode="create" />)

    await userEvent.click(screen.getByRole('button', { name: 'Aanmaken' }))

    expect(screen.getByText(ERROR_MESSAGES.REQUIRED_NAME)).toBeInTheDocument()
    expect(screen.getByText(ERROR_MESSAGES.REQUIRED_DATE)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Naam/i), {
      target: { value: 'Fixed name' },
    })

    expect(screen.queryByText(ERROR_MESSAGES.REQUIRED_NAME)).not.toBeInTheDocument()
  })

  it('submits a valid payload and calls onSuccess', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    const onSuccess = vi.fn()

    render(
      <EventForm
        mode="create"
        initialData={{ tags: 'TagOne, TagTwo' }}
        onSuccess={onSuccess}
      />
    )

    fireEvent.change(screen.getByLabelText(/Naam/i), {
      target: { value: '  Diwali  ' },
    })
    fireEvent.change(screen.getByLabelText(/Beschrijving/i), {
      target: { value: '  Description  ' },
    })
    fireEvent.change(screen.getByLabelText(/Startdatum/i), {
      target: { value: '2025-01-01' },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Aanmaken' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const [, init] = fetchMock.mock.calls[0] ?? []
    const body = JSON.parse((init as RequestInit).body as string)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events',
      expect.objectContaining({ method: 'POST' })
    )
    expect(body.name).toBe('Diwali')
    expect(body.description).toBe('Description')
    expect(body.date).toBe('2025-01-01')
    expect(body.tags).toEqual(['tagone', 'tagtwo'])
    expect(toastSuccess).toHaveBeenCalledWith('Event aangemaakt!')
    expect(onSuccess).toHaveBeenCalled()
  })

  it('submits edit mode and navigates when onSuccess is not provided', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    render(
      <EventForm
        mode="edit"
        initialData={{ id: 'evt_1', name: 'Existing', date: '2025-01-01' }}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/events/evt_1',
      expect.objectContaining({ method: 'PUT' })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Event bijgewerkt!')
    expect(push).toHaveBeenCalledWith('/events')
    expect(refresh).toHaveBeenCalled()
  })

  it('shows toast error when API responds with an error', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Opslaan mislukt' }),
    } as Response)

    render(<EventForm mode="create" />)

    fireEvent.change(screen.getByLabelText(/Naam/i), {
      target: { value: 'Error Event' },
    })
    fireEvent.change(screen.getByLabelText(/Startdatum/i), {
      target: { value: '2025-01-01' },
    })

    await userEvent.click(screen.getByRole('button', { name: 'Aanmaken' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Opslaan mislukt')
    })
  })

  it('disables category select while loading categories', () => {
    mockUseFetch.mockReturnValueOnce({
      data: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<EventForm mode="create" />)

    const categorySelect = screen.getByLabelText(/Categorie/i)
    expect(categorySelect).toBeDisabled()
  })

  it('adds and removes tags using the tag input', async () => {
    render(<EventForm mode="create" />)

    const tagInput = screen.getByPlaceholderText('Voeg tag toe...')
    fireEvent.change(tagInput, { target: { value: 'karma' } })

    const addButton = tagInput.parentElement?.querySelector('button')
    expect(addButton).toBeTruthy()
    await userEvent.click(addButton as HTMLButtonElement)

    expect(screen.getByText('#karma')).toBeInTheDocument()

    const chip = screen.getByText('#karma').closest('span')
    const removeButton = chip?.querySelector('button')
    expect(removeButton).toBeTruthy()
    await userEvent.click(removeButton as HTMLButtonElement)

    expect(screen.queryByText('#karma')).not.toBeInTheDocument()
  })

  it('adds tags on Enter and prevents duplicates', async () => {
    render(<EventForm mode="create" />)

    const tagInput = screen.getByPlaceholderText('Voeg tag toe...')
    await userEvent.type(tagInput, 'bhakti{enter}')

    expect(screen.getByText('#bhakti')).toBeInTheDocument()

    await userEvent.type(tagInput, 'bhakti{enter}')

    expect(screen.getAllByText('#bhakti')).toHaveLength(1)
  })
})
