import { useState } from 'react'
import type { Post } from '../types'
import { formatRelativeTime } from '../lib/formatTime'
import { useEditPost } from '../hooks/useEditPost'
import { usePostEdits } from '../hooks/useEdits'
import { EditForm } from './EditForm'
import { EditHistory } from './EditHistory'

interface ReplyItemProps {
  post: Post
  isAuthor: boolean
  isFirst: boolean
  threadId: string
}

export function ReplyItem({ post, isAuthor, isFirst, threadId }: ReplyItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const editPost = useEditPost(post.id, threadId)
  const { data: edits = [], isLoading: editsLoading } = usePostEdits(showHistory ? post.id : null)

  function handleSave(newBody: string) {
    editPost.mutate(newBody, {
      onSuccess: () => setIsEditing(false),
    })
  }

  return (
    <div className={`py-4 px-2 ${!isFirst ? 'border-t border-border-light' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm text-text-body">{post.authorPseudonym}</span>
        <span className="text-xs text-text-muted">{formatRelativeTime(post.createdAt)}</span>
        {post.isEdited && (
          <span className="text-xs text-text-muted italic">(edited)</span>
        )}
        {isAuthor && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="ml-auto text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      {isEditing ? (
        <EditForm
          initialValue={post.body}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isPending={editPost.isPending}
        />
      ) : (
        <div className="text-sm text-text-body whitespace-pre-wrap leading-relaxed">{post.body}</div>
      )}
      {post.isEdited && !isEditing && (
        <EditHistory
          edits={edits}
          isLoading={editsLoading}
          isOpen={showHistory}
          onToggle={() => setShowHistory(prev => !prev)}
        />
      )}
    </div>
  )
}
