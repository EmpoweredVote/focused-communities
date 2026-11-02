import type { ReactNode } from 'react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, type AccessState, type AccountUser } from '../../context/AuthContext'
import { canRateClaims } from '../../lib/access'
import { apiFetch, type ApiResult } from '../../lib/apiFetch'
import { ImpactControl } from './ImpactControl'
import type { ClaimSide } from '../../types'

vi.mock('../../lib/apiFetch', () => ({ apiFetch: vi.fn() }))
const mockApiFetch = vi.mocked(apiFetch)

afterEach(cleanup)
beforeEach(() => {
  mockApiFetch.mockReset()
  localStorage.clear()
})

// Synthetic throughout, as everywhere else in this suite: ids start with
// "test-", every display name is an obvious "Demo" one. Nothing here may look
// like a real person or a real id.
const user = (over: Partial<AccountUser> = {}): AccountUser => ({
  id: 'test-user-a',
  tier: 'connected',
  account_standing: 'active',
  completed_onboarding: true,
  display_name: 'Demo Heron',
  ...over,
})

interface Props {
  claimId: string
  side: ClaimSide | null
  impact: number
  ratingCount: number
  myRating: number | null
  canRate: boolean
}

const props = (over: Partial<Props> = {}): Props => ({
  claimId: 'test-claim-a',
  side: 'supports',
  impact: 5,
  ratingCount: 2,
  myRating: null,
  canRate: true,
  ...over,
})

// A fresh client per test: the mutation writes into the cache, and a shared one
// would carry an earlier test's rating into the next.
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }
}

// The nine names, written out here on purpose. This list IS the pin: a scale
// whose steps all answer to the same name, or to an index, fails here.
const STEP_NAMES = [
  'Low weight',
  'Slightly more than low weight',
  'Well above low weight',
  'Slightly below moderate weight',
  'Moderate weight',
  'Slightly above moderate weight',
  'Well above moderate weight',
  'Slightly below high weight',
  'High weight',
]

describe('ImpactControl', () => {
  it('presents a labelled scale, never a bare number', () => {
    render(<ImpactControl {...props()} />, { wrapper: makeWrapper() })

    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAccessibleName('How much weight does this argument deserve?')

    // Nine steps, each with its own accessible name. A radiogroup rather than a
    // range input (R93): a range announces aria-valuenow, which is the one
    // thing this scale may not say.
    expect(screen.queryByRole('slider')).toBeNull()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(9)

    for (const name of STEP_NAMES) {
      expect(screen.getAllByRole('radio', { name })).toHaveLength(1)
    }
    const names = radios.map((r) => r.closest('label')!.textContent)
    expect(new Set(names).size).toBe(9)
    for (const name of names) {
      expect(name).not.toMatch(/\d/)
    }

    // Words at the ends and the middle; nothing in the scale is a digit.
    expect(group.textContent).toMatch(/Low/)
    expect(group.textContent).toMatch(/Moderate/)
    expect(group.textContent).toMatch(/High/)
    expect(group.textContent).not.toMatch(/\d/)
  })

  it('draws the bar as an outline the fill reads against, not a filled track (I6)', () => {
    render(<ImpactControl {...props({ impact: 9, ratingCount: 4, canRate: false })} />)
    const bar = screen.getByRole('img')
    // The old track was bg-border-light, against which coral read 2.60:1 in
    // light mode and 2.20:1 in dark — under the 3:1 this file's own comment
    // claimed. The interior is the card now and the extent is an outline.
    expect(bar.className).not.toMatch(/bg-border-/)
    expect(bar.className).toContain('border-impact-track')
    expect(bar.className).toContain('bg-surface-card')
  })

  it('shows the aggregate as a bar', () => {
    // Length is the only variable carrying impact, so length is what the test
    // reads. No provider here: the aggregate half must render inside a card,
    // which has neither a QueryClientProvider nor an AuthProvider.
    const { rerender } = render(<ImpactControl {...props({ impact: 9, ratingCount: 4, canRate: false })} />)
    let bar = screen.getByRole('img')
    expect(bar).toHaveAccessibleName('Impact so far: high')
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%')
    expect(screen.getByText(/4 ratings/)).toBeVisible()

    rerender(<ImpactControl {...props({ impact: 1, ratingCount: 1, canRate: false })} />)
    bar = screen.getByRole('img')
    expect(bar).toHaveAccessibleName('Impact so far: low')
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('0%')
    expect(screen.getByText(/1 rating$/)).toBeVisible()

    rerender(<ImpactControl {...props({ impact: 5, ratingCount: 2, canRate: false })} />)
    bar = screen.getByRole('img')
    expect(bar).toHaveAccessibleName('Impact so far: moderate')
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('50%')
  })

  it('lets a connected user change an existing rating', async () => {
    let settle: (value: ApiResult<unknown>) => void = () => {}
    mockApiFetch.mockImplementation(
      () =>
        new Promise<ApiResult<unknown>>((resolve) => {
          settle = resolve
        }),
    )

    const { rerender } = render(<ImpactControl {...props({ myRating: 3 })} />, { wrapper: makeWrapper() })
    expect(screen.getByRole('radio', { name: 'Well above low weight' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: 'High weight' }))

    // The reader's own choice registers at once, before the round trip: the
    // impact bar may lag, their mark may not.
    await waitFor(() => expect(screen.getByRole('radio', { name: 'High weight' })).toBeChecked())
    expect(screen.getByRole('radio', { name: 'Well above low weight' })).not.toBeChecked()

    // The request follows once the choice has settled; the mark did not wait
    // for it (see the assertion above).
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1))
    expect(mockApiFetch).toHaveBeenCalledWith('/api/claims/test-claim-a/rating', {
      method: 'PUT',
      body: JSON.stringify({ rating: 9 }),
    })

    // impact and ratingCount come back from the server; the component does no
    // arithmetic and takes both from the props its parent re-reads.
    await act(async () => {
      settle({ ok: true, data: { data: { impact: 6, ratingCount: 3 } } })
    })
    rerender(<ImpactControl {...props({ myRating: 9, impact: 6, ratingCount: 3 })} />)
    expect(screen.getByRole('radio', { name: 'High weight' })).toBeChecked()
    expect(screen.getByRole('img')).toHaveAccessibleName('Impact so far: moderate')
  })

  it('disables rating for a signed-out visitor but still shows the aggregate', () => {
    // No affordance at all rather than a disabled one: a disabled radio is not
    // focusable and announces nothing a reader can act on, and this component
    // cannot tell "signed out" from "suspended" from "this is a navigation
    // card", so it does not guess at copy. The surface that knows owns the
    // invitation to sign in.
    render(<ImpactControl {...props({ canRate: canRateClaims({ state: 'inform' }) })} />)
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByRole('img')).toHaveAccessibleName('Impact so far: moderate')
    expect(screen.getByText(/2 ratings/)).toBeVisible()
  })

  it('shows no aggregate when nobody has rated', () => {
    // Governed by ratingCount, never by a null impact (R90): impact is still
    // exactly 5 here, so a bar would read the same as "opinion is split".
    const wrapper = makeWrapper()
    const { rerender } = render(<ImpactControl {...props({ impact: 5, ratingCount: 0 })} />, { wrapper })
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Not yet rated')).toBeVisible()
    // An unrated claim still takes ratings — somebody has to be first.
    expect(screen.getAllByRole('radio')).toHaveLength(9)

    rerender(<ImpactControl {...props({ impact: 5, ratingCount: 1 })} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.queryByText('Not yet rated')).toBeNull()
  })

  it('never prints the impact figure, in text or in an accessible name (R78)', () => {
    const { container } = render(<ImpactControl {...props({ impact: 7.25, ratingCount: 7 })} />, {
      wrapper: makeWrapper(),
    })
    // The rating count is the ONE number this control may print, so that is
    // what the sweep subtracts. `not.toMatch(/7/)` over the whole container
    // used to do this job and only passed by coincidence: the count was 3, and
    // setting it to 7 — as here — failed the test with the bug absent.
    expect(container.textContent?.replace('7 ratings', '')).not.toMatch(/\d/)
    expect(screen.getByRole('img')).toHaveAccessibleName('Impact so far: high')

    // Not in an aria-label, a title, a value text or a test id either.
    for (const el of container.querySelectorAll('*')) {
      for (const attr of ['aria-label', 'title', 'aria-valuetext', 'aria-valuenow', 'data-testid']) {
        const value = el.getAttribute(attr)
        if (value !== null) expect(value).not.toMatch(/\d/)
      }
    }
  })

  it('colours the bar and the chosen step with the side, and reaches for no brand token (R94)', () => {
    const fill = () => (screen.getByRole('img').firstElementChild as HTMLElement).className

    const wrapper = makeWrapper()
    const { container, rerender } = render(
      <ImpactControl {...props({ side: 'supports', myRating: 9 })} />,
      { wrapper },
    )
    expect(fill()).toContain('bg-claim-supports')
    // The chosen step carries the side too, and the unchosen ones do not.
    const chosen = screen.getByRole('radio', { name: 'High weight' }).closest('label')!
    expect(chosen.querySelector('[aria-hidden="true"]')!.className).toContain('bg-claim-supports')
    const unchosen = screen.getByRole('radio', { name: 'Low weight' }).closest('label')!
    expect(unchosen.querySelector('[aria-hidden="true"]')!.className).not.toContain('bg-claim-')

    rerender(<ImpactControl {...props({ side: 'opposes', myRating: 9 })} />)
    expect(fill()).toContain('bg-claim-opposes')
    expect(fill()).not.toContain('bg-claim-supports')

    // A root claim has no side, so the bar takes a neutral fill rather than
    // picking one — and a neutral fill a reader can see. This used to be
    // bg-border-medium, a hairline colour at 1.58:1 on the card and 1.30:1
    // inside the old track, which made the bar and the checked step invisible
    // on the default landing view (I5). The ratios themselves are checked in
    // index.contrast.test.ts; what this pins is that the component asks for
    // the token that has them.
    rerender(<ImpactControl {...props({ side: null, myRating: 9 })} />)
    expect(fill()).toContain('bg-claim-neutral')
    expect(fill()).not.toMatch(/bg-border-/)
    const neutralStep = screen.getByRole('radio', { name: 'High weight' }).closest('label')!
    expect(neutralStep.querySelector('[aria-hidden="true"]')!.className).toContain(
      'bg-claim-neutral',
    )

    // Semantic tokens only, and never a colour on text: opposes reads 3.14:1 on
    // white, which clears 3:1 for a bar and fails 4.5:1 for anything to read.
    for (const el of container.querySelectorAll<HTMLElement>('*')) {
      expect(el.className).not.toMatch(/ev-teal|ev-coral/)
      expect(el.className).not.toMatch(/text-claim-/)
    }
  })
})

describe('ImpactControl — one sweep is one rating (I4)', () => {
  // An arrow-key sweep across a native radio group checks each radio it
  // passes, firing `change` every time. These tests drive the change events a
  // sweep produces; what they pin is that eight choices are one request, not
  // eight ratings and a 429 for the keyboard reader alone.
  function sweep(names: string[]) {
    for (const name of names) {
      fireEvent.click(screen.getByRole('radio', { name }))
    }
  }

  it('sends one request for a sweep across the whole scale', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, data: { data: { impact: 6, ratingCount: 3 } } })
    render(<ImpactControl {...props({ myRating: null })} />, { wrapper: makeWrapper() })

    sweep(STEP_NAMES)

    // Nothing has gone yet, and the reader can already see where they are.
    expect(mockApiFetch).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'High weight' })).toBeChecked()

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1))
    expect(mockApiFetch).toHaveBeenCalledWith('/api/claims/test-claim-a/rating', {
      method: 'PUT',
      body: JSON.stringify({ rating: 9 }),
    })
  })

  it('sends the settled choice at once when focus leaves the group', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, data: { data: { impact: 6, ratingCount: 3 } } })
    render(
      <>
        <ImpactControl {...props({ myRating: null })} />
        <button type="button">Somewhere else</button>
      </>,
      { wrapper: makeWrapper() },
    )

    const chosen = screen.getByRole('radio', { name: 'Moderate weight' })
    fireEvent.click(chosen)
    expect(mockApiFetch).not.toHaveBeenCalled()

    // focusOut, not blur: React attaches onBlur to the bubbling focusout.
    fireEvent.focusOut(screen.getByRole('radiogroup'), {
      relatedTarget: screen.getByRole('button', { name: 'Somewhere else' }),
    })
    // One turn of the microtask queue, no clock time: if this needed the
    // timer it would still be waiting.
    await act(async () => {})
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/claims/test-claim-a/rating', {
      method: 'PUT',
      body: JSON.stringify({ rating: 5 }),
    })
  })

  it('puts the mark back where the server has it when a sweep is refused', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, error: 'Forbidden', status: 403, reason: 'tier' })
    render(<ImpactControl {...props({ myRating: 5 })} />, { wrapper: makeWrapper() })

    sweep(['Slightly above moderate weight', 'Well above moderate weight', 'High weight'])
    await screen.findByRole('status')

    // One request, and the local choice does not outlive its refusal.
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('radio', { name: 'Moderate weight' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'High weight' })).not.toBeChecked()
  })
})

describe('ImpactControl refusals (R91)', () => {
  async function rateAndFail(result: {
    error: string
    status: number
    reason?: string
    code?: string
  }) {
    mockApiFetch.mockResolvedValue({ ok: false, ...result })
    render(<ImpactControl {...props({ myRating: 5 })} />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('radio', { name: 'High weight' }))
    return await screen.findByRole('status')
  }

  it('says a rating was refused for tier rather than showing a generic failure', async () => {
    const status = await rateAndFail({ error: 'Forbidden', status: 403, reason: 'tier' })
    expect(status.textContent).toMatch(/connected account/i)
    expect(status.textContent).not.toMatch(/Try again/)
    // And the revert is not silent: the mark is back where it was, with the
    // reason beside it.
    expect(screen.getByRole('radio', { name: 'Moderate weight' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'High weight' })).not.toBeChecked()
  })

  it('says a rating was refused because the account is suspended', async () => {
    const status = await rateAndFail({ error: 'Forbidden', status: 403, reason: 'suspended' })
    expect(status.textContent).toMatch(/suspended/i)
    expect(status.textContent).not.toMatch(/connected account/i)
  })

  it('still says something specific when a 403 carries no reason', async () => {
    const status = await rateAndFail({ error: 'Forbidden', status: 403 })
    expect(status.textContent).toMatch(/refused/i)
    expect(status.textContent).not.toMatch(/suspended|connected account/i)
  })

  it('names rate limiting rather than inviting an immediate retry', async () => {
    const status = await rateAndFail({ error: 'Too many requests', status: 429 })
    expect(status.textContent).toMatch(/a lot of ratings at once/i)
    expect(status.textContent).not.toMatch(/suspended|connected account|refused/i)
  })

  // The rating route's own refusals, which reached this component as
  // "Request failed (n)" until apiFetch carried `code`. "Try again" is wrong
  // for both: neither will ever succeed on a retry.
  it('says the claim is gone rather than inviting a retry that cannot work', async () => {
    const status = await rateAndFail({
      error: 'Claim not found',
      status: 404,
      code: 'CLAIM_NOT_FOUND',
    })
    expect(status.textContent).toMatch(/no longer part of this argument/i)
    expect(status.textContent).not.toMatch(/Try again/)
  })

  it('says a merged claim was merged rather than failing silently', async () => {
    const status = await rateAndFail({
      error: 'This point has been merged into another claim',
      status: 409,
      code: 'CLAIM_MERGED',
    })
    expect(status.textContent).toMatch(/merged/i)
    expect(status.textContent).not.toMatch(/Try again/)
  })

  it('still invites a retry when the server failed on its own side', async () => {
    const status = await rateAndFail({
      error: 'Could not save the rating',
      status: 500,
      code: 'CLAIM_RATING_FAILED',
    })
    expect(status.textContent).toMatch(/Try again/)
  })

  it('falls back to a plain retry for a failure it cannot name', async () => {
    // A network drop carries status 0 and no reason. There is nothing honest
    // to say about why, so the control says only what happened.
    const status = await rateAndFail({ error: 'Network error', status: 0 })
    expect(status.textContent).toBe('That rating was not saved. Try again.')
  })
})

describe('canRateClaims (R91)', () => {
  // The server gate is tier + account_standing, and deliberately NOT
  // completed_onboarding — the middleware says so in capitals. These four cases
  // are the ones the client's AccessState cannot answer on its own.
  it('lets a connected reader whose Compass is unfinished rate', () => {
    const auth: AccessState = {
      state: 'connected_no_compass',
      user: user({ completed_onboarding: false }),
    }
    expect(canRateClaims(auth)).toBe(true)

    render(<ImpactControl {...props({ canRate: canRateClaims(auth) })} />, { wrapper: makeWrapper() })
    expect(screen.getAllByRole('radio')).toHaveLength(9)
  })

  it('refuses a suspended reader, who arrives with state "connected" all the same', () => {
    const auth: AccessState = { state: 'connected', user: user({ account_standing: 'suspended' }) }
    expect(canRateClaims(auth)).toBe(false)

    render(<ImpactControl {...props({ canRate: canRateClaims(auth) })} />)
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('lets an empowered reader rate and refuses an inform or still-loading one', () => {
    expect(canRateClaims({ state: 'connected', user: user({ tier: 'empowered' }) })).toBe(true)
    expect(canRateClaims({ state: 'inform' })).toBe(false)
    expect(canRateClaims({ state: 'loading' })).toBe(false)
    // Defensive: a user object that still says `inform` is not a rater, whatever
    // branch it arrived through.
    expect(canRateClaims({ state: 'connected', user: user({ tier: 'inform' }) })).toBe(false)
  })
})
