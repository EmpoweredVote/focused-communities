import { Link } from 'react-router'
import type { ThreadSummary } from '../types'
import { formatRelativeTime } from '../lib/formatTime'

interface ThreadListItemProps {
  thread: ThreadSummary
  communitySlug: string
}

export function ThreadListItem({ thread, communitySlug }: ThreadListItemProps) {
  return (
    <Link
      to={`/communities/${communitySlug}/threads/${thread.id}`}
      className="block p-4 border-b border-border-light hover:bg-surface-hover transition-colors"
    >
      <div className="font-semibold text-text-body truncate mb-1">{thread.title}</div>
      <div className="text-sm text-text-secondary line-clamp-2 mb-2 leading-relaxed">{thread.excerpt}</div>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>{thread.authorPseudonym}</span>
        <span>·</span>
        <span>{formatRelativeTime(thread.lastActivityAt)}</span>
        <span>·</span>
        <span>{thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}</span>
      </div>
    </Link>
  )
}
