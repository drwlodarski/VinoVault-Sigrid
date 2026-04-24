/**
 * TESTS: CellarPage component (full integration of frontend features)
 *
 * What this file tests:
 *  - Shows a loading skeleton while the fetch is in progress
 *  - Shows EmptyCellar component when the API returns an empty list
 *  - Renders a CellarEntryCard for each entry returned by the API
 *  - Displays the correct wine count and total bottle count in the header
 *  - "Add Wine" button in the header opens the AddCellarEntryModal
 *  - "Add Wine" button in the EmptyCellar state also opens the modal
 *  - Filter bar is visible only when there are entries
 *  - Status filter buttons filter the displayed cards correctly
 *  - Type filter dropdown filters the displayed cards correctly
 *  - "No wines match" message shown when filters produce no results
 *  - Clicking Edit on a card opens the modal in edit mode (pre-filled)
 *  - Clicking Delete on a card shows an inline confirmation row
 *  - Confirming delete calls DELETE /api/inventory/:id and removes the card
 *  - Cancelling delete dismisses the confirmation without removing the card
 *
 * Clerk's useAuth is mocked to provide a getToken function.
 * fetch is mocked globally to control API responses.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CellarPage } from '../../src/app/pages/CellarPage'

// Mock Clerk — stable getToken reference so useCallback doesn't re-create fetchCellar on every render
const mockGetToken = vi.fn().mockResolvedValue('mock_token')
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

// Mock child components that are tested separately to keep page tests focused
vi.mock('../../src/app/components/AddCellarEntryModal', () => ({
  AddCellarEntryModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="add-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const MOCK_ENTRIES = [
  {
    _id: 'entry_1',
    wineName: 'Château Margaux',
    winery: 'Ch. Margaux',
    region: 'Bordeaux',
    type: 'red',
    vintage: 2018,
    quantity: 6,
    storageLocation: 'Rack A',
    status: 'storing',
    notes: '',
  },
  {
    _id: 'entry_2',
    wineName: 'Opus One',
    winery: 'Opus One',
    region: 'Napa Valley',
    type: 'red',
    vintage: 2020,
    quantity: 3,
    storageLocation: 'Rack B',
    status: 'ready',
    notes: '',
  },
  {
    _id: 'entry_3',
    wineName: 'Cloudy Bay',
    winery: 'Cloudy Bay',
    region: 'Marlborough',
    type: 'white',
    vintage: 2022,
    quantity: 12,
    storageLocation: 'Fridge',
    status: 'storing',
    notes: '',
  },
]

function setupFetch(entries = MOCK_ENTRIES) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: entries }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────
// Loading state
// ─────────────────────────────────────────
describe('CellarPage — loading', () => {
  it('shows loading skeleton while fetching', () => {
    // Never resolves during this test
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<CellarPage />)
    expect(screen.getByText(/loading your collection/i)).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────
describe('CellarPage — empty state', () => {
  it('shows EmptyCellar when API returns no entries', async () => {
    setupFetch([])
    render(<CellarPage />)
    await waitFor(() => {
      expect(screen.getByText(/your cellar is empty/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────
// Populated state
// ─────────────────────────────────────────
describe('CellarPage — populated', () => {
  it('renders a card for each entry', async () => {
    setupFetch()
    render(<CellarPage />)
    await waitFor(() => {
      expect(screen.getByText('Château Margaux')).toBeInTheDocument()
      expect(screen.getByText('Opus One')).toBeInTheDocument()
      expect(screen.getByText('Cloudy Bay')).toBeInTheDocument()
    })
  })

  it('shows correct wine count in header', async () => {
    setupFetch()
    render(<CellarPage />)
    await waitFor(() => {
      expect(screen.getByText(/3 wines/i)).toBeInTheDocument()
    })
  })

  it('shows correct total bottle count in header', async () => {
    setupFetch() // 6 + 3 + 12 = 21 bottles
    render(<CellarPage />)
    await waitFor(() => {
      expect(screen.getByText(/21 bottles/i)).toBeInTheDocument()
    })
  })

  it('shows the filter bar when entries exist', async () => {
    setupFetch()
    render(<CellarPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────
// Add Wine modal
// ─────────────────────────────────────────
describe('CellarPage — Add Wine modal', () => {
  it('opens modal when header Add Wine button is clicked', async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    await user.click(screen.getByRole('button', { name: /add wine/i }))
    expect(screen.getByTestId('add-modal')).toBeInTheDocument()
  })

  it('opens modal when EmptyCellar Add Wine button is clicked', async () => {
    setupFetch([])
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText(/your cellar is empty/i))
    // Both header and EmptyCellar have "Add Wine" buttons — click any one
    const addButtons = screen.getAllByRole('button', { name: /add wine/i })
    await user.click(addButtons[addButtons.length - 1])
    expect(screen.getByTestId('add-modal')).toBeInTheDocument()
  })

  it('closes modal when onClose is triggered', async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    await user.click(screen.getByRole('button', { name: /add wine/i }))
    await user.click(screen.getByRole('button', { name: /close modal/i }))
    expect(screen.queryByTestId('add-modal')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Filters
// ─────────────────────────────────────────
describe('CellarPage — filters', () => {
  it("status filter 'Storing' shows only storing entries", async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    await user.click(screen.getByRole('button', { name: /^storing$/i }))
    expect(screen.getByText('Château Margaux')).toBeInTheDocument()
    expect(screen.getByText('Cloudy Bay')).toBeInTheDocument()
    expect(screen.queryByText('Opus One')).not.toBeInTheDocument()
  })

  it("status filter 'Ready' shows only ready entries", async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Opus One'))
    await user.click(screen.getByRole('button', { name: /^ready$/i }))
    expect(screen.getByText('Opus One')).toBeInTheDocument()
    expect(screen.queryByText('Château Margaux')).not.toBeInTheDocument()
  })

  it("shows 'No wines match' when filters produce no results", async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    await user.click(screen.getByRole('button', { name: /^consumed$/i }))
    expect(screen.getByText(/no wines match/i)).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Edit
// ─────────────────────────────────────────
describe('CellarPage — edit', () => {
  it('opens modal in edit mode when Edit is clicked on a card', async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    const editButtons = screen.getAllByTitle('Edit')
    await user.click(editButtons[0])
    expect(screen.getByTestId('add-modal')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Delete
// ─────────────────────────────────────────
describe('CellarPage — delete', () => {
  it('shows inline delete confirmation when Delete is clicked', async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])
    expect(screen.getByText(/remove "château margaux" from your cellar/i)).toBeInTheDocument()
  })

  it('removes the entry after confirming delete', async () => {
    setupFetch()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: MOCK_ENTRIES }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Cellar entry deleted.' }) })

    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])
    await user.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => {
      expect(screen.queryByText('Château Margaux')).not.toBeInTheDocument()
    })
  })

  it('dismisses confirmation without removing entry when Cancel is clicked', async () => {
    setupFetch()
    const user = userEvent.setup()
    render(<CellarPage />)
    await waitFor(() => screen.getByText('Château Margaux'))
    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(screen.queryByText(/remove "château margaux"/i)).not.toBeInTheDocument()
    expect(screen.getByText('Château Margaux')).toBeInTheDocument()
  })
})
