// Stands in for: GET /api/claims/:id — not yet served by the deployed API
// Also stands in for: GET /api/communities/:id/claims/root,
// GET /api/communities/:id/claims/shape, GET /api/claims/:id/edits.
// The claims API is built but unpushed, so every one of those paths 404s
// against the live public API today.
//
// Opt-in, dev only: `VITE_DEMO_CLAIMS=1 npm run dev`. Communities, stances and
// seasons stay live; writes to claim routes are off. Everything here is
// synthetic and says so: every author is a "Demo" pseudonym, every id starts
// with "demo-". Never add real people, quotes, figures or account data.
import type { BreadcrumbItem, Claim, ClaimEdit, ClaimNode, ClaimNodeMeta, ShapeNode } from '../types'

const daysAgo = (d: number, h = 0) =>
  new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString()

interface DemoClaim extends Claim {
  parentId: string | null
}

const base = {
  isHidden: false,
  mergedInto: null,
  createdAt: daysAgo(10),
  updatedAt: daysAgo(10),
  myRating: null,
}

const claims: DemoClaim[] = [
  {
    ...base,
    id: 'demo-claim-root',
    parentId: null,
    side: null,
    body: 'This community should adopt the proposal now under discussion.',
    authorPseudonym: null,
    impact: 5,
    ratingCount: 0,
    childSupports: 2,
    childOpposes: 2,
  },
  {
    ...base,
    id: 'demo-claim-s1',
    parentId: 'demo-claim-root',
    side: 'supports',
    body: 'The proposal addresses the problem the community said mattered most to it.',
    authorPseudonym: 'Demo Heron',
    impact: 7.2,
    ratingCount: 9,
    childSupports: 1,
    childOpposes: 1,
    myRating: 8,
  },
  {
    ...base,
    id: 'demo-claim-s2',
    parentId: 'demo-claim-root',
    side: 'supports',
    body: 'Nearby communities that tried something similar did not see the harms predicted for it.',
    authorPseudonym: 'Demo Juniper',
    impact: 6.1,
    ratingCount: 4,
    childSupports: 0,
    childOpposes: 1,
    updatedAt: daysAgo(6),
  },
  {
    ...base,
    id: 'demo-claim-o1',
    parentId: 'demo-claim-root',
    side: 'opposes',
    body: 'The proposal asks for a commitment before anyone has costed the work it creates.',
    authorPseudonym: 'Demo Kestrel',
    impact: 6.8,
    ratingCount: 7,
    childSupports: 1,
    childOpposes: 0,
  },
  {
    ...base,
    id: 'demo-claim-o2',
    parentId: 'demo-claim-root',
    side: 'opposes',
    // A tombstone: a hidden claim keeps its place in the tree and its children,
    // and its body comes back empty. Render the tombstone, not a blank card.
    body: '',
    authorPseudonym: 'Demo Marten',
    impact: 4.4,
    ratingCount: 3,
    childSupports: 0,
    childOpposes: 0,
    isHidden: true,
  },
  {
    ...base,
    id: 'demo-claim-s1a',
    parentId: 'demo-claim-s1',
    side: 'supports',
    body: 'The community named that problem first in its own list of priorities.',
    authorPseudonym: 'Demo Maple',
    impact: 6.5,
    ratingCount: 5,
    childSupports: 0,
    childOpposes: 0,
  },
  {
    ...base,
    id: 'demo-claim-s1b',
    parentId: 'demo-claim-s1',
    side: 'opposes',
    body: 'Naming a problem is not agreeing on this particular answer to it.',
    authorPseudonym: 'Demo Wren',
    impact: 5.9,
    ratingCount: 6,
    childSupports: 0,
    childOpposes: 0,
    // Deliberately points at a claim that is NOT in any payload here: a merge
    // target is not pinned to this community or above the truncation cut, and a
    // client that cannot find it must draw an ordinary node rather than treat
    // the absence as bad data.
    mergedInto: 'demo-claim-elsewhere',
  },
  {
    ...base,
    id: 'demo-claim-s2a',
    parentId: 'demo-claim-s2',
    side: 'opposes',
    body: 'Those communities differ from this one in ways that matter for the comparison.',
    authorPseudonym: 'Demo Otter',
    impact: 5.2,
    ratingCount: 2,
    childSupports: 0,
    childOpposes: 0,
  },
  {
    ...base,
    id: 'demo-claim-o1a',
    parentId: 'demo-claim-o1',
    side: 'supports',
    body: 'No one has yet said who would do the work the proposal creates.',
    authorPseudonym: 'Demo Alder',
    impact: 6.0,
    ratingCount: 3,
    childSupports: 0,
    childOpposes: 0,
  },
]

const edits: Record<string, ClaimEdit[]> = {
  'demo-claim-s2': [
    {
      id: 'demo-cedit-1',
      oldBody: 'Nearby communities that tried this did not see the predicted harms.',
      byAuthor: true,
      editedAt: daysAgo(6),
    },
  ],
}

const byId = (id: string) => claims.find((c) => c.id === id)

/** parentId is this module's own bookkeeping; the API never puts it in a Claim. */
function strip(demo: DemoClaim): Claim {
  const claim: Claim & { parentId?: string | null } = { ...demo }
  delete claim.parentId
  return claim
}

const childrenOf = (id: string, side: 'supports' | 'opposes'): Claim[] =>
  claims
    .filter((c) => c.parentId === id && c.side === side)
    .sort((a, b) => b.impact - a.impact)
    .map(strip)

function breadcrumbOf(claim: DemoClaim): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = []
  let parent = claim.parentId ? byId(claim.parentId) : undefined
  while (parent) {
    trail.unshift({ id: parent.id, body: parent.body, side: parent.side })
    parent = parent.parentId ? byId(parent.parentId) : undefined
  }
  return trail
}

function nodeFor(claim: DemoClaim): { data: ClaimNode; meta: ClaimNodeMeta } {
  return {
    data: {
      claim: strip(claim),
      breadcrumb: breadcrumbOf(claim),
      supports: childrenOf(claim.id, 'supports'),
      opposes: childrenOf(claim.id, 'opposes'),
    },
    meta: {
      supports: { cursor: null, hasMore: false },
      opposes: { cursor: null, hasMore: false },
    },
  }
}

function depthOf(claim: DemoClaim): number {
  let depth = 0
  let parent = claim.parentId ? byId(claim.parentId) : undefined
  while (parent) {
    depth += 1
    parent = parent.parentId ? byId(parent.parentId) : undefined
  }
  return depth
}

const shape = (): ShapeNode[] =>
  claims.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    side: c.side,
    depth: depthOf(c),
    impact: c.impact,
    isHidden: c.isHidden,
    mergedInto: c.mergedInto,
  }))

const ROOT_PATH = /^\/api\/communities\/[^/]+\/claims\/root$/
const SHAPE_PATH = /^\/api\/communities\/[^/]+\/claims\/shape$/
const EDITS_PATH = /^\/api\/claims\/([^/]+)\/edits$/
const NODE_PATH = /^\/api\/claims\/([^/]+)$/
const WRITE_PATH = /^\/api\/claims\/[^/]+\/(children|rating)$/

/** True for the claim routes this module stands in for, writes included. */
export function isDemoClaimPath(path: string): boolean {
  const p = path.split('?')[0]
  return (
    ROOT_PATH.test(p) ||
    SHAPE_PATH.test(p) ||
    EDITS_PATH.test(p) ||
    NODE_PATH.test(p) ||
    WRITE_PATH.test(p)
  )
}

/** The demo response for a GET path, or undefined when the path is not a claim route. */
export function demoClaimResponse(path: string): unknown {
  const p = path.split('?')[0]
  let m: RegExpMatchArray | null
  if (ROOT_PATH.test(p)) return nodeFor(claims[0])
  if (SHAPE_PATH.test(p)) {
    // completeThroughDepth is the deepest level described completely; this demo
    // tree is whole, so nothing is cut.
    return { data: shape(), meta: { truncated: false, completeThroughDepth: 2 } }
  }
  if ((m = p.match(EDITS_PATH))) return { data: edits[m[1]] ?? [] }
  if ((m = p.match(NODE_PATH))) {
    const claim = byId(m[1])
    return claim ? nodeFor(claim) : null
  }
  return undefined
}
