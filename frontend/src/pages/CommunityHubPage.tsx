import { useState } from 'react'
import { useParams } from 'react-router'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { useStances } from '../hooks/useStances'
import { useThreads } from '../hooks/useThreads'
import { StanceCard } from '../components/StanceCard'
import { StanceCardSkeleton, ThreadListItemSkeleton } from '../components/SkeletonCard'
import { BackNav } from '../components/BackNav'
import { ThreadListItem } from '../components/ThreadListItem'
import { ThreadCreateForm } from '../components/ThreadCreateForm'

export default function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>()
  const [sort, setSort] = useState<'active' | 'newest'>('active')
  const { data: community, isLoading: communityLoading, isError: communityError } = useCommunityBySlug(slug)
  const { data: stances, isLoading: stancesLoading, isError: stancesError, refetch: refetchStances } =
    useStances(community?.id)
  const {
    threads,
    isLoading: threadsLoading,
    isError: threadsError,
    refetch: refetchThreads,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useThreads(community?.id, sort)

  if (communityLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-4 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <StanceCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (communityError || !community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackNav to="/communities" label="Communities" />
        <p className="text-gray-600">Community not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackNav to="/communities" label="Communities" />

      {/* Topic header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{community.name}</h1>
        <p className="text-gray-600 leading-relaxed">{community.description}</p>
      </div>

      {/* Perspectives section */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Perspectives</h2>

        {stancesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <StanceCardSkeleton key={i} />)}
          </div>
        )}

        {stancesError && (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-3">Failed to load perspectives</p>
            <button
              onClick={() => refetchStances()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {stances && stances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {stances.map((stance, i) => (
              // TODO: calibrated stance highlight — requires compass data API
              <StanceCard
                key={i}
                stance={stance}
                isHighlighted={false}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSort('active')}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                sort === 'active'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Most Active
            </button>
            <button
              onClick={() => setSort('newest')}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                sort === 'newest'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Newest
            </button>
          </div>
        </div>

        {threadsLoading && (
          <div>
            {Array.from({ length: 4 }).map((_, i) => <ThreadListItemSkeleton key={i} />)}
          </div>
        )}

        {threadsError && (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-3">Failed to load threads</p>
            <button
              onClick={() => refetchThreads()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!threadsLoading && !threadsError && threads.length === 0 && (
          <div className="py-4">
            <p className="text-gray-500 text-sm mb-2">No threads yet. Be the first to start a discussion.</p>
          </div>
        )}

        {threads.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {threads.map(thread => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                communitySlug={slug!}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
              className="px-6 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more threads'}
            </button>
          </div>
        )}

        {/* Thread create form — auth gate handles unauthenticated state */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Start a New Thread</h3>
          <ThreadCreateForm communityId={community.id} communitySlug={slug!} />
        </div>
      </div>
    </div>
  )
}
