import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventDetailModal } from '../EventDetailModal'
import { CalendarEvent } from '@/types/calendar'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock Toast hook
const mockError = vi.fn()
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ error: mockError }),
}))

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test Data
const MOCK_EVENT: CalendarEvent = {
  id: 'evt_1',
  eventId: 'evt_1',
  title: 'Ganesha Puja',
  start: new Date('2025-01-01T10:00:00'),
  end: new Date('2025-01-01T12:00:00'),
  allDay: false,
  resource: {
    description: 'A special puja for Lord Ganesha.',
    eventType: 'PUJA',
    importance: 'MODERATE',
    category: {
        id: 'cat_1',
        name: 'ganesha',
        displayName: 'Ganesha',
        icon: '🐘',
        color: 'oklch(0.6 0.1 30)',
        sortOrder: 1,
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    categoryId: 'cat_1',
    tithi: 'PRATIPADA_SHUKLA',
    nakshatra: 'ASHWINI',
    maas: 'CHAITRA',
    tags: ['puja', 'morning'],
    startTime: '10:00',
    endTime: '12:00',
    notes: 'Bring flowers.',
    originalEndDate: null,
  },
}

describe('EventDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch implementation
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('renders nothing when closed', () => {
    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={false}
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByText('Ganesha Puja')).not.toBeInTheDocument()
  })

  it('renders event details when open', () => {
    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={vi.fn()}
      />
    )
    
    // Title
    expect(screen.getByText('Ganesha Puja')).toBeInTheDocument()
    
    // Description
    expect(screen.getByText('A special puja for Lord Ganesha.')).toBeInTheDocument()
    
    // Notes
    expect(screen.getByText('Bring flowers.')).toBeInTheDocument()
    
    // Time
    expect(screen.getByText('10:00')).toBeInTheDocument()
    
    // Tags
    expect(screen.getByText('#puja')).toBeInTheDocument()
  })

  it('navigates to edit page on edit click', () => {
    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={vi.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('Bewerken'))
    
    expect(mockPush).toHaveBeenCalledWith('/events/evt_1')
  })

  it('handles delete flow', async () => {
    const onClose = vi.fn()
    const onDeleted = vi.fn()
    
    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={onClose}
        onDeleted={onDeleted}
      />
    )
    
    // 1. Click trash icon (find by svg or role, here likely button containing trash icon)
    // The trash button is the third button in the action bar.
    // Easier to find by aria-label if it had one, or by exclusion.
    // Let's rely on finding the SVG icon wrapper button.
    // Actually, buttons don't have aria-labels in the component code for trash (except close).
    // Let's add test-id or find by class/structure.
    // Or we can find all buttons and pick the last one.
    
    // Alternative: The delete button appears AFTER clicking the trash icon.
    // The trash icon button renders a specific SVG.
    // Let's try to query selector.
    
    // In code:
    // <button onClick={() => setShowDeleteConfirm(true)} ...><Trash2 ... /></button>
    
    // We can use container.querySelector if needed, but let's try getting all buttons.
    const closeButton = screen.getByRole('button', { name: 'Sluiten' })
    const editButton = screen.getByRole('button', { name: 'Bewerken' })
    const openButton = screen.getByRole('button', { name: /open volledige pagina/i })
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(
      (button) => ![closeButton, editButton, openButton].includes(button)
    )

    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn!)
    
    // 2. Confirm message should appear
    expect(screen.getByText(/Weet je zeker/)).toBeInTheDocument()
    
    // 3. Click "Ja, verwijderen"
    fireEvent.click(screen.getByText('Ja, verwijderen'))
    
    // 4. Expect fetch DELETE
    expect(mockFetch).toHaveBeenCalledWith('/api/events/evt_1', expect.objectContaining({
      method: 'DELETE'
    }))
    
    // 5. Wait for callbacks
    await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
        expect(onDeleted).toHaveBeenCalled()
    })
  })

  it('hides delete confirmation when cancelled', () => {
    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Sluiten' })
    const editButton = screen.getByRole('button', { name: 'Bewerken' })
    const openButton = screen.getByRole('button', { name: /open volledige pagina/i })
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(
      (button) => ![closeButton, editButton, openButton].includes(button)
    )

    fireEvent.click(deleteBtn!)
    expect(screen.getByText(/Weet je zeker/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Annuleren'))
    expect(screen.queryByText(/Weet je zeker/)).not.toBeInTheDocument()
  })

  it('shows toast error when delete fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Sluiten' })
    const editButton = screen.getByRole('button', { name: 'Bewerken' })
    const openButton = screen.getByRole('button', { name: /open volledige pagina/i })
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(
      (button) => ![closeButton, editButton, openButton].includes(button)
    )

    fireEvent.click(deleteBtn!)
    fireEvent.click(screen.getByText('Ja, verwijderen'))

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith('Kon event niet verwijderen')
    })
  })

  it('closes confirm dialog on escape without closing modal', () => {
    const onClose = vi.fn()

    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={onClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Sluiten' })
    const editButton = screen.getByRole('button', { name: 'Bewerken' })
    const openButton = screen.getByRole('button', { name: /open volledige pagina/i })
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(
      (button) => ![closeButton, editButton, openButton].includes(button)
    )

    fireEvent.click(deleteBtn!)
    expect(screen.getByText(/Weet je zeker/)).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByText(/Weet je zeker/)).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes modal on escape when not confirming delete', () => {
    const onClose = vi.fn()

    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={onClose}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when clicking the backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={onClose}
      />
    )

    const backdrop = container.firstChild as HTMLElement
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalled()
  })

  it('shows multi-day label when original end date is set', () => {
    const multiDayEvent: CalendarEvent = {
      ...MOCK_EVENT,
      resource: {
        ...MOCK_EVENT.resource,
        originalEndDate: new Date('2025-01-03T00:00:00'),
      },
    }

    render(
      <EventDetailModal
        event={multiDayEvent}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/3 dagen/)).toBeInTheDocument()
    expect(screen.getByText(/tot/i)).toBeInTheDocument()
  })

  it('does not render notes section when notes are missing', () => {
    const noNotesEvent: CalendarEvent = {
      ...MOCK_EVENT,
      resource: {
        ...MOCK_EVENT.resource,
        notes: null,
      },
    }

    render(
      <EventDetailModal
        event={noNotesEvent}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Notities')).not.toBeInTheDocument()
  })

  it('navigates to event page from external link button', () => {
    render(
      <EventDetailModal
        event={MOCK_EVENT}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const openButton = screen.getByTitle('Open volledige pagina')
    fireEvent.click(openButton)

    expect(mockPush).toHaveBeenCalledWith('/events/evt_1')
  })
})
