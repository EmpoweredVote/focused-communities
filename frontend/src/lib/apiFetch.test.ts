import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './apiFetch'

/**
 * `apiFetch` is the single fetch seam for the whole app, and these tests pin the
 * part of it that is easiest to lose in a refactor: WHICH failures it can
 * describe.
 *
 * Three envelope shapes reach it from the API, and all three are real:
 *
 *   { error: 'Connected account required', reason: 'tier' }   tierGuards, engine auth
 *   { error: { code: 'CLAIM_NOT_FOUND', message: '...' } }    every claims route
 *   { reason: 'rate_limited' }                                the rate limiter
 *
 * A client that reads only the first cannot tell CLAIM_NOT_FOUND from
 * ANCESTOR_NOT_VISIBLE — two answers the write route takes deliberate care to
 * keep apart, on the same status.
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch error envelopes', () => {
  it('carries the error code through on a 404', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, { error: { code: 'CLAIM_NOT_FOUND', message: 'Claim not found' } })
    )

    const result = await apiFetch('/api/claims/abc')

    expect(result).toEqual({
      ok: false,
      status: 404,
      code: 'CLAIM_NOT_FOUND',
      error: 'Claim not found',
    })
  })

  it('tells ANCESTOR_NOT_VISIBLE apart from CLAIM_NOT_FOUND on the same status', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, {
        error: { code: 'ANCESTOR_NOT_VISIBLE', message: 'An ancestor of this claim is not visible' },
      })
    )

    const result = await apiFetch('/api/claims/abc/children')

    expect(result).toMatchObject({ ok: false, status: 404, code: 'ANCESTOR_NOT_VISIBLE' })
  })

  it('keeps the flat string envelope working, reason and all', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { error: 'Connected account required', reason: 'tier' })
    )

    const result = await apiFetch('/api/claims/abc/rating')

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      error: 'Connected account required',
      reason: 'tier',
    })
  })

  it('reduces an object envelope on a 403 to a string error, not [object Object]', async () => {
    // routes/claimCuration.ts sends MAVEN_REQUIRED as a 403 in the OBJECT
    // envelope, which the string-only reading passed through whole.
    fetchMock.mockResolvedValue(
      jsonResponse(403, {
        error: { code: 'MAVEN_REQUIRED', message: 'Curating the argument tree is a maven action' },
      })
    )

    const result = await apiFetch('/api/claims/abc/hide')

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      code: 'MAVEN_REQUIRED',
      error: 'Curating the argument tree is a maven action',
    })
  })

  it('carries the merge target on a 409', async () => {
    // CLAIM_MERGED is the one refusal with somewhere to go: the route sends
    // the id of the claim that now carries the argument so a client can offer
    // it rather than losing what the contributor wrote.
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        error: {
          code: 'CLAIM_MERGED',
          message: 'This point has been merged into another claim',
          mergedInto: '00000000-0000-4000-8000-000000000004',
        },
      })
    )

    const result = await apiFetch('/api/claims/abc/children')

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'CLAIM_MERGED',
      mergedInto: '00000000-0000-4000-8000-000000000004',
    })
  })

  it('ignores a merge target that is not a string', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { error: { code: 'CLAIM_MERGED', mergedInto: { id: 'nope' } } })
    )

    const result = await apiFetch('/api/claims/abc/children')

    expect(result).not.toHaveProperty('mergedInto')
  })

  it('carries reason on a status other than 403', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { reason: 'rate_limited' }))

    const result = await apiFetch('/api/claims')

    expect(result).toMatchObject({ ok: false, status: 429, reason: 'rate_limited' })
  })

  it('falls back to the status line when a body carries no error field', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { reason: 'rate_limited' }))

    const result = await apiFetch('/api/claims')

    expect(result).toMatchObject({ error: 'Request failed (429)' })
    expect(result).not.toHaveProperty('code')
  })

  it('does not throw on a non-JSON body', async () => {
    // A proxy answering with an HTML error page is not a reason to reject.
    fetchMock.mockResolvedValue(
      new Response('<html><body>502 Bad Gateway</body></html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      })
    )

    const result = await apiFetch('/api/claims')

    expect(result).toEqual({ ok: false, error: 'Request failed (502)', status: 502 })
  })

  it('ignores an error field that is neither a string nor a coded object', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: ['nope'] }))

    const result = await apiFetch('/api/claims')

    expect(result).toMatchObject({ ok: false, status: 400, error: 'Request failed (400)' })
  })

  it('leaves a successful response alone', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'abc' }))

    const result = await apiFetch<{ id: string }>('/api/claims/abc')

    expect(result).toEqual({ ok: true, data: { id: 'abc' } })
  })
})
