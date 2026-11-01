import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router'
import { useFocusedClaim } from './useFocusedClaim'

// Synthetic ids throughout: uuid-shaped so the validator has something real to
// chew on, but all-zeros so nothing here can be mistaken for a live claim.
const ID_A = '00000000-0000-4000-8000-00000000000a'
const ID_B = '00000000-0000-4000-8000-00000000000b'

const lifecycle = { mounts: 0, unmounts: 0 }

function SiblingBand() {
  useEffect(() => {
    lifecycle.mounts++
    return () => {
      lifecycle.unmounts++
    }
  }, [])
  return <div>sibling-band</div>
}

function Probe() {
  const loc = useLocation()
  const nav = useNavigate()
  return (
    <div>
      <div data-testid="loc">{loc.pathname + loc.search}</div>
      <button onClick={() => nav(-1)}>go-back</button>
    </div>
  )
}

function Harness({ target }: { target: string }) {
  const { claimId, claimParamRejected, focusClaim, clearFocusedClaim } = useFocusedClaim()
  return (
    <div>
      <div data-testid="claim-id">{claimId ?? 'none'}</div>
      <div data-testid="rejected">{String(claimParamRejected)}</div>
      <button onClick={() => focusClaim(target)}>focus</button>
      <button onClick={clearFocusedClaim}>clear</button>
    </div>
  )
}

function renderHook(url = '/communities/test-slug', entries: string[] = [], target = ID_B) {
  return render(
    <MemoryRouter initialEntries={[...entries, url]} initialIndex={entries.length}>
      <Routes>
        <Route
          path="/communities/:slug"
          element={
            <>
              <Harness target={target} />
              <SiblingBand />
              <Probe />
            </>
          }
        />
        <Route path="/earlier" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

const claimId = () => screen.getByTestId('claim-id').textContent
const rejected = () => screen.getByTestId('rejected').textContent
const loc = () => screen.getByTestId('loc').textContent

beforeEach(() => {
  lifecycle.mounts = 0
  lifecycle.unmounts = 0
})
afterEach(cleanup)

describe('useFocusedClaim', () => {
  it('reads a uuid ?claim= and reports no claim when the parameter is absent', () => {
    renderHook(`/communities/test-slug?claim=${ID_A}`)
    expect(claimId()).toBe(ID_A)
    expect(rejected()).toBe('false')
    cleanup()
    renderHook()
    expect(claimId()).toBe('none')
    expect(rejected()).toBe('false')
  })

  it('accepts a uuid whichever case it is written in', () => {
    renderHook(`/communities/test-slug?claim=${ID_A.toUpperCase()}`)
    expect(claimId()).toBe(ID_A.toUpperCase())
    expect(rejected()).toBe('false')
  })

  it('treats a bare ?claim= as absent and raises no notice', () => {
    renderHook('/communities/test-slug?claim=')
    expect(claimId()).toBe('none')
    expect(rejected()).toBe('false')
  })

  it.each(['abc', '123', `${ID_A}x`, ID_A.slice(0, -1), ID_A.replace(/-/g, ''), 'null', '%20'])(
    'rejects ?claim=%s visibly rather than quietly showing the root',
    (bad) => {
      renderHook(`/communities/test-slug?claim=${bad}`)
      expect(claimId()).toBe('none')
      expect(rejected()).toBe('true')
    },
  )

  it('puts the focused claim in the URL so it is linkable', () => {
    renderHook()
    fireEvent.click(screen.getByText('focus'))
    expect(loc()).toBe(`/communities/test-slug?claim=${ID_B}`)
    expect(claimId()).toBe(ID_B)
  })

  it('keeps ?season= when the focused claim changes', () => {
    // The object form of setSearchParams would drop ?season= here, sending the
    // reader back to the default season the moment they opened a claim.
    renderHook(`/communities/test-slug?season=2&claim=${ID_A}`)
    fireEvent.click(screen.getByText('focus'))
    expect(loc()).toContain('season=2')
    expect(loc()).toContain(`claim=${ID_B}`)
  })

  it('clears ?claim= without disturbing ?season=', () => {
    renderHook(`/communities/test-slug?season=2&claim=${ID_A}`)
    fireEvent.click(screen.getByText('clear'))
    expect(loc()).toBe('/communities/test-slug?season=2')
    expect(claimId()).toBe('none')
  })

  it('replaces rather than pushes, so back leaves the community', () => {
    renderHook('/communities/test-slug', ['/earlier'])
    fireEvent.click(screen.getByText('focus'))
    expect(loc()).toContain(`claim=${ID_B}`)
    fireEvent.click(screen.getByText('go-back'))
    expect(loc()).toBe('/earlier')
  })

  it('does not remount a sibling band when ?claim= changes', () => {
    renderHook()
    const band = screen.getByText('sibling-band')
    expect(lifecycle.mounts).toBe(1)

    fireEvent.click(screen.getByText('focus'))

    expect(loc()).toContain(`claim=${ID_B}`)
    expect(screen.getByText('sibling-band')).toBe(band)
    expect(lifecycle.mounts).toBe(1)
    expect(lifecycle.unmounts).toBe(0)
  })
})
