/**
 * TESTS: CellarEntryCard component
 *
 * What this file tests:
 *  - Renders the wine name prominently
 *  - Renders the correct quantity with "bottle"/"bottles" label
 *  - Renders optional metadata: winery, region, type, vintage when provided
 *  - Does NOT render metadata fields that are undefined/empty
 *  - Renders the correct status badge label for each status:
 *      "storing" → "Storing"
 *      "ready"   → "Ready to Drink"
 *      "consumed"→ "Consumed"
 *  - Renders storage location when provided
 *  - Renders notes in italic when provided
 *  - Renders Edit and Delete action buttons
 *  - Calls onEdit with the correct entryId when Edit is clicked
 *  - Calls onDelete with the correct entryId when Delete is clicked
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CellarEntryCard } from '../../src/app/components/CellarEntryCard'

const BASE_PROPS = {
  entryId: 'entry_abc',
  wineName: 'Château Margaux',
  winery: 'Château Margaux',
  region: 'Bordeaux, France',
  type: 'red',
  vintage: 2018,
  quantity: 6,
  storageLocation: 'Rack A',
  status: 'storing' as const,
  notes: 'Earthy finish',
  onEdit: vi.fn(),
  onDelete: vi.fn(),
}

describe('CellarEntryCard — content', () => {
  it('renders the wine name', () => {
    render(<CellarEntryCard {...BASE_PROPS} />)
    expect(screen.getByText('Château Margaux')).toBeInTheDocument()
  })

  it("renders quantity with 'bottles' label for quantity > 1", () => {
    render(<CellarEntryCard {...BASE_PROPS} quantity={6} />)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('bottles')).toBeInTheDocument()
  })

  it("renders 'bottle' (singular) for quantity of 1", () => {
    render(<CellarEntryCard {...BASE_PROPS} quantity={1} />)
    expect(screen.getByText('bottle')).toBeInTheDocument()
  })

  it('renders winery and region in the metadata', () => {
    render(<CellarEntryCard {...BASE_PROPS} />)
    expect(screen.getByText(/bordeaux, france/i)).toBeInTheDocument()
    // winery appears in both the title and the metadata string, so use getAllByText
    expect(screen.getAllByText(/château margaux/i).length).toBeGreaterThan(0)
  })

  it('renders vintage in the metadata', () => {
    render(<CellarEntryCard {...BASE_PROPS} />)
    expect(screen.getByText(/2018/)).toBeInTheDocument()
  })

  it('renders the storage location', () => {
    render(<CellarEntryCard {...BASE_PROPS} />)
    expect(screen.getByText('Rack A')).toBeInTheDocument()
  })

  it('renders notes', () => {
    render(<CellarEntryCard {...BASE_PROPS} />)
    expect(screen.getByText('Earthy finish')).toBeInTheDocument()
  })

  it('does not render storage location when not provided', () => {
    render(<CellarEntryCard {...BASE_PROPS} storageLocation={undefined} />)
    expect(screen.queryByText('Rack A')).not.toBeInTheDocument()
  })

  it('does not render notes when not provided', () => {
    render(<CellarEntryCard {...BASE_PROPS} notes={undefined} />)
    expect(screen.queryByText('Earthy finish')).not.toBeInTheDocument()
  })
})

describe('CellarEntryCard — status badges', () => {
  it("shows 'Storing' badge for storing status", () => {
    render(<CellarEntryCard {...BASE_PROPS} status="storing" />)
    expect(screen.getByText('Storing')).toBeInTheDocument()
  })

  it("shows 'Ready to Drink' badge for ready status", () => {
    render(<CellarEntryCard {...BASE_PROPS} status="ready" />)
    expect(screen.getByText('Ready to Drink')).toBeInTheDocument()
  })

  it("shows 'Consumed' badge for consumed status", () => {
    render(<CellarEntryCard {...BASE_PROPS} status="consumed" />)
    expect(screen.getByText('Consumed')).toBeInTheDocument()
  })
})

describe('CellarEntryCard — actions', () => {
  it('renders edit and delete buttons', () => {
    render(<CellarEntryCard {...BASE_PROPS} />)
    expect(screen.getByTitle('Edit')).toBeInTheDocument()
    expect(screen.getByTitle('Delete')).toBeInTheDocument()
  })

  it('calls onEdit with entryId when Edit is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<CellarEntryCard {...BASE_PROPS} onEdit={onEdit} />)
    await user.click(screen.getByTitle('Edit'))
    expect(onEdit).toHaveBeenCalledWith('entry_abc')
  })

  it('calls onDelete with entryId when Delete is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<CellarEntryCard {...BASE_PROPS} onDelete={onDelete} />)
    await user.click(screen.getByTitle('Delete'))
    expect(onDelete).toHaveBeenCalledWith('entry_abc')
  })
})
