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

export interface Stance {
  /** INTERNAL — never render to users. Display order is randomized. */
  position: number
  text: string
  supportingPoints: string[]
  description: string
  examplePerspectives: string[]
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
