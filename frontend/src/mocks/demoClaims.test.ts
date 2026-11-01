import { describe, it, expect } from 'vitest'
import { demoClaimResponse, isDemoClaimPath } from './demoClaims'
import type { ClaimNode, ShapeNode } from '../types'

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
