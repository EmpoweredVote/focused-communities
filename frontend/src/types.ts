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
