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
      className="block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="font-semibold text-gray-900 truncate mb-1">{thread.title}</div>
      <div className="text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">{thread.excerpt}</div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{thread.authorPseudonym}</span>
        <span>·</span>
        <span>{formatRelativeTime(thread.lastActivityAt)}</span>
        <span>·</span>
        <span>{thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}</span>
      </div>
    </Link>
  )
}
