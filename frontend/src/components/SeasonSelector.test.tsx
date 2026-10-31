import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { SeasonSelector } from './SeasonSelector'
import type { SeasonSummary } from '../types'

afterEach(cleanup)

const open: SeasonSummary = { number: 2, name: 'Season 2', status: 'open', openedAt: null, closedAt: null }
const closed: SeasonSummary = { number: 1, name: 'Season 1', status: 'closed', openedAt: null, closedAt: null }
const draft: SeasonSummary = { number: 3, name: 'Season 3', status: 'draft', openedAt: null, closedAt: null }

describe('SeasonSelector', () => {
  it('marks a closed season as historical', () => {
    render(<SeasonSelector seasons={[closed, open]} value={2} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: /Season 1.*past wording/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Season 2.*current/ })).toBeInTheDocument()
  })

  it('marks a draft season as draft when one is present', () => {
    render(<SeasonSelector seasons={[closed, open, draft]} value={3} onChange={vi.fn()} />)
    expect(screen.getByRole('option', { name: /Season 3.*draft/ })).toBeInTheDocument()
    expect(screen.getByText(/not visible to the public/)).toBeInTheDocument()
  })

  it('does not show the draft notice when a published season is selected', () => {
    render(<SeasonSelector seasons={[closed, open, draft]} value={2} onChange={vi.fn()} />)
    expect(screen.queryByText(/not visible to the public/)).not.toBeInTheDocument()
  })

  it('calls onChange with the chosen season number as a number', () => {
    const onChange = vi.fn()
    render(<SeasonSelector seasons={[closed, open]} value={2} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Season'), { target: { value: '1' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(1)
    expect(typeof onChange.mock.calls[0][0]).toBe('number')
  })

  it('renders nothing when only one season is available', () => {
    const { container } = render(<SeasonSelector seasons={[open]} value={2} onChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
