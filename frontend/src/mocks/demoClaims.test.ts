import { describe, it, expect } from 'vitest'
import { demoClaimResponse, isDemoClaimPath } from './demoClaims'
import type { ClaimNode, ClaimNodeMeta, ShapeNode } from '../types'

// The uuid shape `useFocusedClaim` validates `?claim=` against, and the one the
// API's own route guards use. Copied rather than imported so this test keeps
// checking the real contract even if the hook's constant is renamed or moved.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ROOT = 'dddddddd-dddd-4ddd-8ddd-000000000000'

function node(path: string): ClaimNode {
  const body = demoClaimResponse(path) as { data: ClaimNode } | null | undefined
  if (!body || !('data' in body)) throw new Error(`no demo response for ${path}`)
  return body.data
}

describe('the demo tree is navigable through the real code path', () => {
  // Regression. Every id here used to read "demo-claim-s1", which is clear to a
  // human and rejected by the uuid validator on `?claim=`. So in demo mode every
  // zoom-in click landed on "the claim you asked for is not available" and
  // bounced to the root: the one escape hatch for the undeployed API could not
  // be navigated at all. The hook's tests could not catch it, because they build
  // their own uuid-shaped ids rather than using this fixture.
  it('gives every claim an id that survives the ?claim= validator', () => {
    const root = node(`/api/claims/${ROOT}`)
    const seen = new Set<string>()

    const check = (id: string, where: string) => {
      expect(id, `${where} is not uuid-shaped, so ?claim=${id} would be rejected`).toMatch(UUID)
      seen.add(id)
    }

    check(root.claim.id, 'the root claim')
    for (const c of [...root.supports, ...root.opposes]) {
      check(c.id, `a child of the root (${c.body.slice(0, 24)}…)`)
      if (c.mergedInto !== null) check(c.mergedInto, 'a merge target')
    }
    for (const step of root.breadcrumb) check(step.id, 'a breadcrumb step')

    expect(seen.size).toBeGreaterThan(1)
  })

  it('gives every node of the shape an id and parentId that survive it too', () => {
    const body = demoClaimResponse(`/api/communities/${ROOT}/claims/shape`) as {
      data: ShapeNode[]
    }
    expect(body.data.length).toBeGreaterThan(1)
    for (const n of body.data) {
      expect(n.id).toMatch(UUID)
      if (n.parentId !== null) expect(n.parentId).toMatch(UUID)
      if (n.mergedInto !== null) expect(n.mergedInto).toMatch(UUID)
    }
  })

  it('serves a child claim by its own id, which is what a zoom-in does', () => {
    const child = node(`/api/claims/${ROOT}`).supports[0]
    expect(isDemoClaimPath(`/api/claims/${child.id}`)).toBe(true)
    expect(node(`/api/claims/${child.id}`).claim.id).toBe(child.id)
  })
})

describe('the demo tree pages a column the way the route does', () => {
  function meta(path: string) {
    const body = demoClaimResponse(path) as { meta: ClaimNodeMeta }
    return body.meta
  }

  // Without this the feature is unreachable before the API is deployed: the
  // live route pages at 20, and the whole demo tree is smaller than that.
  it('leaves the lowest-rated supporting arguments behind a cursor', () => {
    const first = node(`/api/claims/${ROOT}`)
    const page = meta(`/api/claims/${ROOT}`)
    expect(page.supports.hasMore).toBe(true)
    expect(page.supports.cursor).not.toBeNull()
    // Impact leads the sort, so page one is the top of the column and the rest
    // is what a client ignoring the cursor would drop.
    const impacts = first.supports.map((c) => c.impact)
    expect([...impacts].sort((a, b) => b - a)).toEqual(impacts)
    expect(first.supports.length).toBeLessThan(first.claim.childSupports)
  })

  it('advances only the side whose cursor was sent', () => {
    const cursor = meta(`/api/claims/${ROOT}`).supports.cursor!
    const first = node(`/api/claims/${ROOT}`)
    const second = node(`/api/claims/${ROOT}?supportsCursor=${encodeURIComponent(cursor)}`)

    const firstIds = first.supports.map((c) => c.id)
    const secondIds = second.supports.map((c) => c.id)
    expect(secondIds.length).toBeGreaterThan(0)
    expect(secondIds.filter((id) => firstIds.includes(id))).toEqual([])
    expect(meta(`/api/claims/${ROOT}?supportsCursor=${encodeURIComponent(cursor)}`).supports.hasMore).toBe(
      false,
    )

    // The opposing column of that same response is page one over again, which
    // is exactly why the client keeps only the side it asked to advance.
    expect(second.opposes.map((c) => c.id)).toEqual(first.opposes.map((c) => c.id))
  })

  it('together, the pages are the whole side and nothing twice', () => {
    const root = node(`/api/claims/${ROOT}`)
    const cursor = meta(`/api/claims/${ROOT}`).supports.cursor!
    const rest = node(`/api/claims/${ROOT}?supportsCursor=${encodeURIComponent(cursor)}`)
    const ids = [...root.supports, ...rest.supports].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(root.claim.childSupports)
  })
})
