import { useState } from 'react'
import { useParams } from 'react-router'
import { useThread } from '../hooks/useThread'
import { usePosts } from '../hooks/usePosts'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { useEditThread } from '../hooks/useEditThread'
import { useThreadEdits } from '../hooks/useEdits'
import { ReplyItem } from '../components/ReplyItem'
import { BackNav } from '../components/BackNav'
import { EditHistory } from '../components/EditHistory'
import { CharCounter } from '../components/CharCounter'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime } from '../lib/formatTime'
import { ReplyForm } from '../components/ReplyForm'

export default function ThreadPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const { auth } = useAuth()

  const { data: community } = useCommunityBySlug(slug)
  const { data: thread, isLoading: threadLoading, isError: threadError, refetch: _refetchThread } = useThread(id)
  const { data: posts, isLoading: postsLoading, isError: postsError, refetch: refetchPosts } = usePosts(id)

  const [isThreadEditing, setIsThreadEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [showThreadHistory, setShowThreadHistory] = useState(false)

  const editThread = useEditThread(id!)
  const { data: threadEdits = [], isLoading: threadEditsLoading } = useThreadEdits(
    showThreadHistory ? id! : null
  )

  const authorName =
    auth.state === 'connected' || auth.state === 'connected_no_compass'
      ? auth.user.display_name
      : null

  function startThreadEdit() {
    if (!thread) return
    setEditTitle(thread.title)
    setEditBody(thread.body)
    setIsThreadEditing(true)
  }

  function handleThreadSave() {
    editThread.mutate(
      { title: editTitle.trim(), body: editBody.trim() },
      { onSuccess: () => setIsThreadEditing(false) }
    )
  }

  if (threadLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-4 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-4 border-t border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3 animate-pulse" />
              <div className="h-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (threadError || !thread) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackNav to={`/communities/${slug}`} label={community?.name ?? slug ?? 'Back'} />
        <p className="text-gray-600">Thread not found.</p>
      </div>
    )
  }

  const isThreadAuthor = authorName === thread.authorPseudonym

  const canSaveThreadEdit =
    editTitle.trim().length > 0 &&
    editBody.trim().length > 0 &&
    (editTitle.trim() !== thread.title.trim() || editBody.trim() !== thread.body.trim()) &&
    !editThread.isPending

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackNav to={`/communities/${slug}`} label={community?.name ?? slug ?? 'Back'} />

      {/* Thread header */}
      <div className="mb-8">
        {isThreadEditing ? (
          <div>
            <div className="mb-3">
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                maxLength={150}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xl"
                autoFocus
              />
              <CharCounter value={editTitle} max={150} />
            </div>
            <div className="mb-3">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                maxLength={5000}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <CharCounter value={editBody} max={5000} />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsThreadEditing(false)}
                disabled={editThread.isPending}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleThreadSave}
                disabled={!canSaveThreadEdit}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {editThread.isPending ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
              {isThreadAuthor && (
                <button
                  type="button"
                  onClick={startThreadEdit}
                  className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>{thread.authorPseudonym}</span>
              <span>·</span>
              <span>{formatRelativeTime(thread.createdAt)}</span>
              {thread.isEdited && <span className="italic">(edited)</span>}
            </div>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.body}</div>
            {thread.isEdited && (
              <EditHistory
                edits={threadEdits}
                isLoading={threadEditsLoading}
                isOpen={showThreadHistory}
                onToggle={() => setShowThreadHistory(prev => !prev)}
              />
            )}
          </>
        )}
      </div>

      {/* Reply count */}
      <div className="border-t border-gray-200 pt-6 mb-2">
        <span className="text-sm font-medium text-gray-500">
          {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
        </span>
      </div>

      {/* Posts error */}
      {postsError && (
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-2">Failed to load replies</p>
          <button onClick={() => refetchPosts()} className="text-sm text-blue-600 hover:underline">
            Try Again
          </button>
        </div>
      )}

      {/* Posts loading */}
      {postsLoading && (
        <div className="py-4 text-sm text-gray-400">Loading replies...</div>
      )}

      {/* Empty replies */}
      {posts && posts.length === 0 && !postsLoading && (
        <p className="text-gray-500 text-sm py-4">No replies yet.</p>
      )}

      {/* Reply list */}
      {posts && posts.length > 0 && (
        <div>
          {posts.map((post, i) => (
            <ReplyItem
              key={post.id}
              post={post}
              isAuthor={authorName === post.authorPseudonym}
              isFirst={i === 0}
              threadId={id!}
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      <div id="reply-form" className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Leave a Reply</h3>
        <ReplyForm threadId={id!} />
      </div>

      {/* Sticky reply shortcut button */}
      <button
        type="button"
        onClick={() => document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-4 right-4 z-10 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        Reply ↓
      </button>
    </div>
  )
}
