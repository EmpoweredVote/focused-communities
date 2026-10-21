// Stands in for: GET /api/communities/:id/threads, /api/threads/:id,
// /api/threads/:id/posts, /api/threads/:id/edits, /api/posts/:id/edits —
// production has no threads yet, so there is nothing real to design against.
//
// Opt-in, dev only: `VITE_DEMO_THREADS=1 npm run dev`. Communities and stances
// stay live. Everything here is synthetic and says so: every author is a
// "Demo" pseudonym. Never add real people, quotes or account data.
import type { Post, PostEdit, Thread, ThreadEdit, ThreadSummary } from '../types'

const daysAgo = (d: number, h = 0) =>
  new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString()

const threads: Thread[] = [
  {
    id: 'demo-thread-1',
    title: 'What would change your mind on this?',
    body: 'I keep landing in the middle on this topic. For those who picked a clear stance: what evidence or experience moved you there, and what would move you back?',
    authorPseudonym: 'Demo Heron',
    replyCount: 3,
    createdAt: daysAgo(4),
    lastActivityAt: daysAgo(0, 5),
    updatedAt: daysAgo(3),
    isEdited: true,
  },
  {
    id: 'demo-thread-2',
    title: 'Local examples worth looking at',
    body: 'Has anyone seen a city or county handle this well? Links to meeting minutes or budget documents welcome.',
    authorPseudonym: 'Demo Juniper',
    replyCount: 1,
    createdAt: daysAgo(9),
    lastActivityAt: daysAgo(2),
    updatedAt: daysAgo(9),
    isEdited: false,
  },
  {
    id: 'demo-thread-3',
    title: 'A very long thread title, to check how the list wraps when someone writes a full sentence as the title of their post',
    body: 'Short body.',
    authorPseudonym: 'Demo Otter With A Long Pseudonym',
    replyCount: 0,
    createdAt: daysAgo(21),
    lastActivityAt: daysAgo(21),
    updatedAt: daysAgo(21),
    isEdited: false,
  },
]

const posts: Record<string, Post[]> = {
  'demo-thread-1': [
    { id: 'demo-post-1', authorPseudonym: 'Demo Kestrel', body: 'Seeing the actual numbers for my own town. The national debate felt abstract until then.', createdAt: daysAgo(3, 20), updatedAt: daysAgo(3, 20), isEdited: false },
    { id: 'demo-post-2', authorPseudonym: 'Demo Heron', body: 'That is a good point. Where did you find the local numbers?', createdAt: daysAgo(3, 2), updatedAt: daysAgo(2), isEdited: true },
    { id: 'demo-post-3', authorPseudonym: 'Demo Maple', body: 'I would want to see a few years of outcomes, not one. A single year can mislead in either direction.', createdAt: daysAgo(0, 5), updatedAt: daysAgo(0, 5), isEdited: false },
  ],
  'demo-thread-2': [
    { id: 'demo-post-4', authorPseudonym: 'Demo Wren', body: 'Our county posts its minutes online. The discussion starts about an hour in.', createdAt: daysAgo(2), updatedAt: daysAgo(2), isEdited: false },
  ],
  'demo-thread-3': [],
}

const threadEdits: Record<string, ThreadEdit[]> = {
  'demo-thread-1': [
    { id: 'demo-tedit-1', oldTitle: 'What would change your mind?', oldBody: null, editedAt: daysAgo(3) },
  ],
}

const postEdits: Record<string, PostEdit[]> = {
  'demo-post-2': [{ id: 'demo-pedit-1', oldBody: 'Good point. Source?', editedAt: daysAgo(2) }],
}

const summary = (t: Thread): ThreadSummary => ({
  id: t.id,
  title: t.title,
  excerpt: t.body.slice(0, 140),
  authorPseudonym: t.authorPseudonym,
  replyCount: t.replyCount,
  createdAt: t.createdAt,
  lastActivityAt: t.lastActivityAt,
})

/** The demo response for a GET path, or undefined when the path is not a thread route. */
export function demoThreadResponse(path: string): unknown {
  const p = path.split('?')[0]
  let m: RegExpMatchArray | null
  if (/^\/api\/communities\/[^/]+\/threads$/.test(p)) {
    return { data: threads.map(summary), meta: { cursor: null, hasMore: false } }
  }
  if ((m = p.match(/^\/api\/threads\/([^/]+)$/))) {
    const t = threads.find((x) => x.id === m![1])
    return t ? { data: t } : null
  }
  if ((m = p.match(/^\/api\/threads\/([^/]+)\/posts$/))) return { data: posts[m[1]] ?? [] }
  if ((m = p.match(/^\/api\/threads\/([^/]+)\/edits$/))) return { data: threadEdits[m[1]] ?? [] }
  if ((m = p.match(/^\/api\/posts\/([^/]+)\/edits$/))) return { data: postEdits[m[1]] ?? [] }
  return undefined
}
