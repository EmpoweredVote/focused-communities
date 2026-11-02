// Stands in for: GET /api/claims/:id — not yet served by the API
// Also stands in for: GET /api/communities/:id/claims/root,
// GET /api/communities/:id/claims/shape, GET /api/claims/:id/edits.
// The claims API is built but unpushed, so every one of those paths 404s
// against the live public API today.
//
// Opt-in, dev only: `VITE_DEMO_CLAIMS=1 npm run dev`. Communities, stances and
// seasons stay live; writes to claim routes are off. Everything here is
// synthetic and says so: every author is a "Demo" pseudonym and every id starts
// with the all-d prefix below. Never add real people, quotes, figures or
// account data.
//
// 🔴 EVERY ID MUST BE UUID-SHAPED. These ids travel through `?claim=`, and
// useFocusedClaim validates that parameter against the same uuid shape the API
// does — so a readable id like "demo-claim-s1" is REJECTED, and every zoom-in
// click in demo mode lands on the "not available" notice and bounces to the
// root. That made the one escape hatch for the undeployed API unnavigable, and
// the hook's own tests could not see it because they use uuid-shaped ids.
// `dddddddd-dddd-4ddd-8ddd-…` keeps them unmistakably synthetic while passing
// the validator; the trailing digits carry the old readable labels.
import type {
  BreadcrumbItem,
  Claim,
  ClaimEdit,
  ClaimNode,
  ClaimNodeMeta,
  ColumnPage,
  ShapeNode,
} from '../types'

const daysAgo = (d: number, h = 0) =>
  new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString()

interface DemoClaim extends Claim {
  parentId: string | null
}

// myRating is null on every claim here and must stay null. It is the one
// per-caller field, and this module answers every caller identically — a
// non-null value would show one of these as "your rating" to whoever opens the
// demo, which is the single shape of bug the rest of this branch is most
// careful about.
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
    id: 'dddddddd-dddd-4ddd-8ddd-000000000000',
    parentId: null,
    side: null,
    body: 'This community should adopt the proposal now under discussion.',
    authorPseudonym: null,
    impact: 5,
    ratingCount: 0,
    childSupports: 4,
    childOpposes: 2,
  },
  {
    ...base,
    id: 'dddddddd-dddd-4ddd-8ddd-000000000011',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000000',
    side: 'supports',
    body: 'The proposal addresses the problem the community said mattered most to it.',
    authorPseudonym: 'Demo Heron',
    impact: 7.2,
    ratingCount: 9,
    childSupports: 1,
    childOpposes: 1,
  },
  {
    ...base,
    id: 'dddddddd-dddd-4ddd-8ddd-000000000012',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000000',
    side: 'supports',
    body: 'Nearby communities that tried something similar did not see the harms predicted for it.',
    authorPseudonym: 'Demo Juniper',
    impact: 6.1,
    ratingCount: 4,
    childSupports: 0,
    childOpposes: 1,
    updatedAt: daysAgo(6),
  },
  // The two lowest-rated supporting children. Impact leads the column sort, so
  // these are the ones that fall onto page two — and the ones a client that
  // ignores the cursor drops without saying so.
  {
    ...base,
    id: 'dddddddd-dddd-4ddd-8ddd-000000000013',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000000',
    side: 'supports',
    body: 'Waiting another season costs more than getting part of this wrong would.',
    authorPseudonym: 'Demo Linnet',
    impact: 4.8,
    ratingCount: 6,
    childSupports: 0,
    childOpposes: 0,
  },
  {
    ...base,
    id: 'dddddddd-dddd-4ddd-8ddd-000000000014',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000000',
    side: 'supports',
    body: 'The proposal can be undone next season if it turns out not to work.',
    authorPseudonym: 'Demo Bramble',
    impact: 3.9,
    ratingCount: 8,
    childSupports: 0,
    childOpposes: 0,
  },
  {
    ...base,
    id: 'dddddddd-dddd-4ddd-8ddd-000000000021',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000000',
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
    id: 'dddddddd-dddd-4ddd-8ddd-000000000022',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000000',
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
    id: 'dddddddd-dddd-4ddd-8ddd-00000000011a',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000011',
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
    id: 'dddddddd-dddd-4ddd-8ddd-00000000011b',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000011',
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
    mergedInto: 'dddddddd-dddd-4ddd-8ddd-0000000000ee',
  },
  {
    ...base,
    id: 'dddddddd-dddd-4ddd-8ddd-00000000012a',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000012',
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
    id: 'dddddddd-dddd-4ddd-8ddd-00000000021a',
    parentId: 'dddddddd-dddd-4ddd-8ddd-000000000021',
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
  'dddddddd-dddd-4ddd-8ddd-000000000012': [
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

// Small on purpose: the live route pages at 20, and a demo nobody can page is
// a demo of a feature nobody can see. Three of the root's four supporting
// children arrive first and the fourth — the lowest-rated one, which is
// exactly what silently disappears when a client ignores the cursor — is on
// page two.
const DEMO_PAGE_SIZE = 3

const sortedChildren = (id: string, side: 'supports' | 'opposes'): Claim[] =>
  claims
    .filter((c) => c.parentId === id && c.side === side)
    .sort((a, b) => b.impact - a.impact)
    .map(strip)

/**
 * One page of one side, after `cursor`.
 *
 * The cursor here is the previous page's last id, NOT the server's three-term
 * keyset token — this module stands in for the route's shape, not for its
 * encoding, and a client that reads a cursor as anything but an opaque string
 * it echoes back is already wrong.
 */
function pageOf(
  id: string,
  side: 'supports' | 'opposes',
  cursor: string | null,
): { claims: Claim[]; page: ColumnPage } {
  const all = sortedChildren(id, side)
  const from = cursor ? all.findIndex((c) => c.id === cursor) + 1 : 0
  const slice = all.slice(from, from + DEMO_PAGE_SIZE)
  const hasMore = from + DEMO_PAGE_SIZE < all.length
  const last = slice[slice.length - 1]
  return {
    claims: slice,
    page: { cursor: hasMore && last ? last.id : null, hasMore },
  }
}

function breadcrumbOf(claim: DemoClaim): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = []
  let parent = claim.parentId ? byId(claim.parentId) : undefined
  while (parent) {
    trail.unshift({ id: parent.id, body: parent.body, side: parent.side })
    parent = parent.parentId ? byId(parent.parentId) : undefined
  }
  return trail
}

function nodeFor(
  claim: DemoClaim,
  cursors: { supports: string | null; opposes: string | null } = { supports: null, opposes: null },
): { data: ClaimNode; meta: ClaimNodeMeta } {
  // Each side is paged independently, exactly as the route does it: a request
  // that names only supportsCursor gets page two of supports and page one of
  // opposes back, and the client is expected to keep only the side it asked to
  // advance.
  const supports = pageOf(claim.id, 'supports', cursors.supports)
  const opposes = pageOf(claim.id, 'opposes', cursors.opposes)
  return {
    data: {
      claim: strip(claim),
      breadcrumb: breadcrumbOf(claim),
      supports: supports.claims,
      opposes: opposes.claims,
    },
    meta: { supports: supports.page, opposes: opposes.page },
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
  const [p, search] = path.split('?')
  const query = new URLSearchParams(search ?? '')
  const cursors = {
    supports: query.get('supportsCursor'),
    opposes: query.get('opposesCursor'),
  }
  let m: RegExpMatchArray | null
  if (ROOT_PATH.test(p)) return nodeFor(claims[0], cursors)
  if (SHAPE_PATH.test(p)) {
    // completeThroughDepth is the deepest level described completely; this demo
    // tree is whole, so nothing is cut.
    return { data: shape(), meta: { truncated: false, completeThroughDepth: 2 } }
  }
  if ((m = p.match(EDITS_PATH))) return { data: edits[m[1]] ?? [] }
  if ((m = p.match(NODE_PATH))) {
    const claim = byId(m[1])
    return claim ? nodeFor(claim, cursors) : null
  }
  return undefined
}
