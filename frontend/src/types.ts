export interface Community {
  id: string
  slug: string
  name: string
  description: string
  memberCount: number
  threadCount: number
  topicId: string
  sliceLabel: string | null
  createdAt: string
}

export interface ThreadSummary {
  id: string
  title: string
  excerpt: string
  authorPseudonym: string
  replyCount: number
  createdAt: string
  lastActivityAt: string
}

export interface Thread {
  id: string
  title: string
  body: string
  authorPseudonym: string
  replyCount: number
  createdAt: string
  lastActivityAt: string
  updatedAt: string
  isEdited: boolean
}

export interface Post {
  id: string
  authorPseudonym: string
  body: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
}

export interface ThreadEdit {
  id: string
  oldTitle: string | null
  oldBody: string | null
  editedAt: string
}

export interface PostEdit {
  id: string
  oldBody: string
  editedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { cursor: string | null; hasMore: boolean }
}

export type SeasonStatus = 'open' | 'closed' | 'draft'

export type ChangeClass = 'editorial' | 'clarifying' | 'substantive' | null

export interface SeasonSummary {
  number: number
  name: string
  status: SeasonStatus
  openedAt: string | null
  closedAt: string | null
}

// A chair in ladder order. Ladder position is carried by array order alone;
// the API never exposes a chair's 1-5 number, so there is no such field here.
export interface Chair {
  text: string
  description: string | null
  supportingPoints: string[]
  examplePerspectives: string[]
  changeSince: 'carried' | 'reworded' | null
}

export interface SeasonView {
  season: SeasonSummary
  questionText: string
  changeClass: ChangeClass
  seasonNote: string | null
  topicNote: string | null
  rationale: string | null
  isFallback: boolean
  chairs: Chair[]
}

export interface SeasonListResponse {
  data: SeasonSummary[]
  // defaultSeason is null when the topic has no seasons (200 with an empty list)
  meta: { defaultSeason: number | null }
}

export interface SeasonDetailResponse {
  data: SeasonView
}

// --- Argument tree -------------------------------------------------------
// Mirrors the claims API exactly. Do not "improve" these shapes here; the
// server is the source of truth and a client-side divergence shows up as a
// runtime surprise, not a type error.

export type ClaimSide = 'supports' | 'opposes'

export interface Claim {
  id: string
  // null only on a root claim
  side: ClaimSide | null
  // '' on a hidden claim — the tombstone. Render the tombstone, not an empty card.
  body: string
  // null on a root; roots have no author
  authorPseudonym: string | null
  // Never null. An unrated claim reads exactly 5, the neutral midpoint, which is
  // what makes the ordering mean anything: one rating of 1 scores 4.3333 and
  // sorts below an untouched claim. "Nobody has rated this" is ratingCount === 0,
  // a different question. Never write `impact ?? 5`, and never compute it on the
  // client: the formula is a Bayesian mean whose prior weight lives in one place,
  // a Postgres generated column. Take impact from the server's response.
  impact: number
  ratingCount: number
  childSupports: number
  childOpposes: number
  isHidden: boolean
  // May name a claim that is NOT in this payload. Nothing pins a merge target to
  // the same community or to a depth above the truncation cut. If the id is in
  // `data`, fold; if it is not, draw an ordinary node — the absence is not bad
  // data. Chains (A→B→C) are legal and nothing in the schema forbids a cycle, so
  // any walk along mergedInto must be bounded.
  mergedInto: string | null
  createdAt: string
  updatedAt: string
  // The one per-caller field in a claim body. Any cache key that can hold a Claim
  // must carry the viewer, or one reader's rating reaches the next reader on the
  // same device after a sign-out.
  myRating: number | null
}

export interface BreadcrumbItem {
  id: string
  body: string
  side: ClaimSide | null
}

export interface ColumnPage {
  cursor: string | null
  hasMore: boolean
}

export interface ClaimNode {
  claim: Claim
  breadcrumb: BreadcrumbItem[]
  supports: Claim[]
  opposes: Claim[]
}

export interface ClaimNodeMeta {
  supports: ColumnPage
  opposes: ColumnPage
}

export interface ShapeNode {
  id: string
  parentId: string | null
  side: ClaimSide | null
  depth: number
  impact: number
  isHidden: boolean
  // Same contract as Claim.mergedInto: the target may be outside this payload.
  mergedInto: string | null
}

export interface ShapeMeta {
  truncated: boolean
  // The deepest level this response describes completely. Truncation cuts INSIDE
  // a depth level, so the boundary level shows an arbitrary subset of siblings.
  // Nothing below completeThroughDepth may be rendered as a count, a balance or
  // an absence. null means not even depth 0 is complete.
  completeThroughDepth: number | null
}

// No actor id and no author name: deliberate, not an omission to fill in. And no
// "new body" — an entry's after-text is the oldBody of the entry above it in this
// newest-first list, and the claim's current body for the newest entry.
export interface ClaimEdit {
  id: string
  oldBody: string | null
  byAuthor: boolean
  editedAt: string
}

export interface ClaimNodeResponse {
  data: ClaimNode
  meta: ClaimNodeMeta
}

export interface ShapeResponse {
  data: ShapeNode[]
  meta: ShapeMeta
}
