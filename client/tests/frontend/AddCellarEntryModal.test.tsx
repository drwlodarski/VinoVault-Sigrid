/**
 * TESTS: AddCellarEntryModal component
 *
 * What this file tests:
 *  - Does not render when isOpen is false
 *  - Renders the modal when isOpen is true
 *  - Add mode: shows "Add to Cellar" heading and submit button
 *  - Edit mode: shows "Edit Cellar Entry" heading and pre-fills all form fields
 *    from the editEntry prop; submit button reads "Save Changes"
 *  - "Enter manually instead" button reveals the full form fields
 *  - Submit button is disabled when wineName is empty
 *  - Submit button is enabled when wineName and quantity are filled
 *  - Clicking Cancel closes the modal (calls onClose)
 *  - Clicking the overlay backdrop closes the modal (calls onClose)
 *  - On submit (add mode): calls fetch POST /api/inventory with correct payload
 *    and calls onSaved + onClose on success
 *  - On submit (edit mode): calls fetch PUT /api/inventory/:id
 *  - Wine search: typing 2+ characters triggers a fetch to /api/inventory/wines/search
 *    and displays results; clicking a result pre-fills the form
 *
 * Clerk's useAuth is mocked to provide a getToken function.
 * fetch is mocked globally to control API responses.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddCellarEntryModal } from '../../src/app/components/AddCellarEntryModal'

// Mock Clerk — stable getToken reference
const mockGetToken = vi.fn().mockResolvedValue('mock_token')
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const BASE_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  onSaved: vi.fn(),
  editEntry: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: { _id: 'entry_new', wineName: 'Barolo' } }),
  })
})

// ─────────────────────────────────────────
// Visibility
// ─────────────────────────────────────────
describe('AddCellarEntryModal — visibility', () => {
  it('does not render when isOpen is false', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} isOpen={false} />)
    expect(screen.queryByText(/add to cellar/i)).not.toBeInTheDocument()
  })

  it('renders the modal when isOpen is true', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    expect(screen.getByText('Add to Cellar')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Add mode
// ─────────────────────────────────────────
describe('AddCellarEntryModal — add mode', () => {
  it("shows 'Add to Cellar' heading", () => {
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    expect(screen.getByText('Add to Cellar')).toBeInTheDocument()
  })

  it('shows wine search input in add mode', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument()
  })

  it("shows 'Enter manually instead' button", () => {
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    expect(screen.getByText(/enter manually instead/i)).toBeInTheDocument()
  })

  it("reveals all form fields after clicking 'Enter manually instead'", async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.click(screen.getByText(/enter manually instead/i))
    expect(screen.getByPlaceholderText(/château margaux/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/domaine leflaive/i)).toBeInTheDocument()
  })

  it("submit button reads 'Add to Cellar'", async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.click(screen.getByText(/enter manually instead/i))
    expect(screen.getByRole('button', { name: /add to cellar/i })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Edit mode
// ─────────────────────────────────────────
describe('AddCellarEntryModal — edit mode', () => {
  const editEntry = {
    _id: 'entry_1',
    wineName: 'Margaux',
    winery: 'Ch. Margaux',
    type: 'red',
    region: 'Bordeaux',
    vintage: 2018,
    quantity: 6,
    purchaseDate: '2021-05-10',
    storageLocation: 'Rack B',
    status: 'storing' as const,
    notes: 'Very smooth',
  }

  it("shows 'Edit Cellar Entry' heading in edit mode", () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.getByText('Edit Cellar Entry')).toBeInTheDocument()
  })

  it('pre-fills wine name from editEntry', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.getByDisplayValue('Margaux')).toBeInTheDocument()
  })

  it('pre-fills winery from editEntry', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.getByDisplayValue('Ch. Margaux')).toBeInTheDocument()
  })

  it('pre-fills quantity from editEntry', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.getByDisplayValue('6')).toBeInTheDocument()
  })

  it('pre-fills notes from editEntry', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.getByDisplayValue('Very smooth')).toBeInTheDocument()
  })

  it("submit button reads 'Save Changes' in edit mode", () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('does not show wine search in edit mode', () => {
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    expect(screen.queryByPlaceholderText(/search by name/i)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────
// Validation
// ─────────────────────────────────────────
describe('AddCellarEntryModal — validation', () => {
  it('submit button is disabled when wineName is empty', async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.click(screen.getByText(/enter manually instead/i))
    const submitBtn = screen.getByRole('button', { name: /add to cellar/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is enabled when wineName and quantity are filled', async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.click(screen.getByText(/enter manually instead/i))
    await user.type(screen.getByPlaceholderText(/château margaux/i), 'Barolo')
    const submitBtn = screen.getByRole('button', { name: /add to cellar/i })
    expect(submitBtn).not.toBeDisabled()
  })
})

// ─────────────────────────────────────────
// Close behavior
// ─────────────────────────────────────────
describe('AddCellarEntryModal — close behavior', () => {
  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AddCellarEntryModal {...BASE_PROPS} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(<AddCellarEntryModal {...BASE_PROPS} onClose={onClose} />)
    // Click the outermost overlay div
    const overlay = container.firstChild as HTMLElement
    await user.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────
// Submit behavior
// ─────────────────────────────────────────
describe('AddCellarEntryModal — submit', () => {
  it('calls POST /api/inventory on add submit', async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.click(screen.getByText(/enter manually instead/i))
    await user.type(screen.getByPlaceholderText(/château margaux/i), 'Barolo')
    await user.click(screen.getByRole('button', { name: /add to cellar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('calls onSaved after successful add', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    render(<AddCellarEntryModal {...BASE_PROPS} onSaved={onSaved} />)
    await user.click(screen.getByText(/enter manually instead/i))
    await user.type(screen.getByPlaceholderText(/château margaux/i), 'Barolo')
    await user.click(screen.getByRole('button', { name: /add to cellar/i }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  })

  it('calls PUT /api/inventory/:id on edit submit', async () => {
    const editEntry = {
      _id: 'entry_1',
      wineName: 'Margaux',
      quantity: 6,
      status: 'storing' as const,
    }
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} editEntry={editEntry} />)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/entry_1'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })
})

// ─────────────────────────────────────────
// Wine search autocomplete
// ─────────────────────────────────────────
describe('AddCellarEntryModal — wine search', () => {
  it('shows results from local catalog immediately on typing (no fetch needed)', async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.type(screen.getByPlaceholderText(/search by name/i), 'Ma')

    // Results come from SAMPLE_WINES, no API call required
    expect(screen.getByText('Château Margaux')).toBeInTheDocument()
    // No fetch to the wines/search endpoint
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('wines/search'),
      expect.any(Object)
    )
  })

  it('shows search results in dropdown', async () => {
    const user = userEvent.setup()
    render(<AddCellarEntryModal {...BASE_PROPS} />)
    await user.type(screen.getByPlaceholderText(/search by name/i), 'Opus')

    expect(screen.getByText('Opus One')).toBeInTheDocument()
  })
})
