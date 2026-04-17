import type { Post } from '../types'
import { formatRelativeTime } from '../lib/formatTime'

interface ReplyItemProps {
  post: Post
  isAuthor: boolean
  isFirst: boolean
}

export function ReplyItem({ post, isAuthor: _isAuthor, isFirst }: ReplyItemProps) {
  return (
    <div className={`py-4 px-2 ${!isFirst ? 'border-t border-gray-200' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm text-gray-900">{post.authorPseudonym}</span>
        <span className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</span>
        {post.isEdited && (
          <span className="text-xs text-gray-400 italic">(edited)</span>
        )}
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.body}</div>
    </div>
  )
}
