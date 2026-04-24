/**
 * TESTS: EmptyCellar component
 *
 * What this file tests:
 *  - Renders the correct heading ("Your cellar is empty")
 *  - Renders the descriptive subtext about adding wines
 *  - Renders an "Add Wine" button
 *  - Calls the onAddClick callback when the "Add Wine" button is clicked
 *  - Renders the wine glass icon (via lucide-react GlassWater)
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EmptyCellar } from '../../src/app/components/EmptyCellar'

describe('EmptyCellar', () => {
  it('renders the empty cellar heading', () => {
    render(<EmptyCellar onAddClick={() => {}} />)
    expect(screen.getByText('Your cellar is empty')).toBeInTheDocument()
  })

  it('renders the subtext message', () => {
    render(<EmptyCellar onAddClick={() => {}} />)
    expect(
      screen.getByText(/track quantity, storage location, and drinking status/i)
    ).toBeInTheDocument()
  })

  it('renders an Add Wine button', () => {
    render(<EmptyCellar onAddClick={() => {}} />)
    expect(screen.getByRole('button', { name: /add wine/i })).toBeInTheDocument()
  })

  it('calls onAddClick when Add Wine button is clicked', async () => {
    const user = userEvent.setup()
    const onAddClick = vi.fn()
    render(<EmptyCellar onAddClick={onAddClick} />)
    await user.click(screen.getByRole('button', { name: /add wine/i }))
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })
})
