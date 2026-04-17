import { useParams } from 'react-router'
import { useThread } from '../hooks/useThread'
import { usePosts } from '../hooks/usePosts'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { ReplyItem } from '../components/ReplyItem'
import { BackNav } from '../components/BackNav'
import { useAuth } from '../context/AuthContext'
import { formatRelativeTime } from '../lib/formatTime'

export default function ThreadPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const { auth } = useAuth()

  const { data: community } = useCommunityBySlug(slug)
  const { data: thread, isLoading: threadLoading, isError: threadError, refetch: _refetchThread } = useThread(id)
  const { data: posts, isLoading: postsLoading, isError: postsError, refetch: refetchPosts } = usePosts(id)

  const authorName =
    auth.state === 'connected' || auth.state === 'connected_no_compass'
      ? auth.user.display_name
      : null

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackNav to={`/communities/${slug}`} label={community?.name ?? slug ?? 'Back'} />

      {/* Thread header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{thread.title}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span>{thread.authorPseudonym}</span>
          <span>·</span>
          <span>{formatRelativeTime(thread.createdAt)}</span>
          {thread.isEdited && <span className="italic">(edited)</span>}
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.body}</div>
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
            />
          ))}
        </div>
      )}

      {/* Reply form placeholder — replaced in Plan 05-04 */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-400">Reply form — coming in Plan 05-04</p>
      </div>
    </div>
  )
}
