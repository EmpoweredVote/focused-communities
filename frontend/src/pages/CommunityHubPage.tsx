import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { useStances } from '../hooks/useStances'
import type { DisplayStance } from '../hooks/useStances'
import { useThreads } from '../hooks/useThreads'
import { StanceCard } from '../components/StanceCard'
import { StanceCardSkeleton, ThreadListItemSkeleton } from '../components/SkeletonCard'
import { BackNav } from '../components/BackNav'
import { ThreadListItem } from '../components/ThreadListItem'
import { ThreadCreateForm } from '../components/ThreadCreateForm'
import { Header } from '../components/Header'

export default function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [sort, setSort] = useState<'active' | 'newest'>('active')
  const [isInverted, setIsInverted] = useState(false)

  const { data: community, isLoading: communityLoading, isError: communityError } = useCommunityBySlug(slug)

  // If the slug was renamed, the API returns the canonical slug. Silently
  // correct the URL so bookmarks and shared links self-heal going forward.
  useEffect(() => {
    if (community && slug && community.slug !== slug) {
      navigate(`/communities/${community.slug}`, { replace: true })
    }
  }, [community, slug, navigate])

  const { data: stances, isLoading: stancesLoading, isError: stancesError, refetch: refetchStances } =
    useStances(community?.id)

  const displayedStances: DisplayStance[] = stances
    ? (isInverted ? [...stances].reverse() : stances)
    : []

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
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-4 bg-surface-hover rounded w-24 mb-6 animate-pulse" />
          <div className="h-8 bg-surface-hover rounded w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-surface-hover rounded w-full mb-8 animate-pulse" />
          <div className="flex flex-col gap-3 max-w-2xl">
            {Array.from({ length: 5 }).map((_, i) => <StanceCardSkeleton key={i} />)}
          </div>
        </div>
      </>
    )
  }

  if (communityError || !community) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <BackNav to="/communities" label="Communities" />
          <p className="text-text-secondary">Community not found.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackNav to="/communities" label="Communities" />

        {/* Topic header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-body mb-2">{community.name}</h1>
          <p className="text-text-secondary leading-relaxed">{community.description}</p>
        </div>

        {/* Perspectives section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Perspectives</h2>
            {displayedStances.length > 0 && (
              <button
                onClick={() => setIsInverted(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  isInverted
                    ? 'bg-ev-teal text-white border-ev-teal'
                    : 'text-text-secondary border-border-light hover:bg-surface-hover'
                }`}
                title={isInverted ? 'Show regular order' : 'Invert order'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.24 6.8a.75.75 0 0 0 1.06-.04l1.95-2.1v8.59a.75.75 0 0 0 1.5 0V4.66l1.95 2.1a.75.75 0 1 0 1.1-1.02L6.35 3.18a.75.75 0 0 0-1.1 0L2.28 5.74a.75.75 0 0 0-.04 1.06Zm10.5 6.4a.75.75 0 0 0-1.06.04l-1.95 2.1V6.75a.75.75 0 0 0-1.5 0v8.59l-1.95-2.1a.75.75 0 1 0-1.1 1.02l2.96 3.18a.75.75 0 0 0 1.1 0l2.96-3.18a.75.75 0 0 0 .04-1.06Z" clipRule="evenodd" />
                </svg>
                Invert
              </button>
            )}
          </div>

          {stancesLoading && (
            <div className="flex flex-col gap-3 max-w-2xl">
              {Array.from({ length: 5 }).map((_, i) => <StanceCardSkeleton key={i} />)}
            </div>
          )}

          {stancesError && (
            <div className="text-center py-6">
              <p className="text-text-secondary mb-3">Failed to load perspectives</p>
              <button
                onClick={() => refetchStances()}
                className="px-4 py-2 text-sm bg-ev-coral text-white rounded-lg hover:bg-ev-coral-hover transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {displayedStances.length > 0 && (
            <div className="flex flex-col gap-3 max-w-2xl">
              {displayedStances.map((stance, i) => (
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

        <div className="border-t border-border-light pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-body">Discussion</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSort('active')}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  sort === 'active'
                    ? 'bg-ev-teal text-white'
                    : 'text-text-secondary hover:text-text-body'
                }`}
              >
                Most Active
              </button>
              <button
                onClick={() => setSort('newest')}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  sort === 'newest'
                    ? 'bg-ev-teal text-white'
                    : 'text-text-secondary hover:text-text-body'
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
              <p className="text-text-secondary mb-3">Failed to load threads</p>
              <button
                onClick={() => refetchThreads()}
                className="px-4 py-2 text-sm bg-ev-coral text-white rounded-lg hover:bg-ev-coral-hover transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!threadsLoading && !threadsError && threads.length === 0 && (
            <div className="py-4">
              <p className="text-text-muted text-sm mb-2">No threads yet. Be the first to start a discussion.</p>
            </div>
          )}

          {threads.length > 0 && (
            <div className="border border-border-light rounded-lg overflow-hidden divide-y divide-border-light shadow-sm">
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
                className="px-6 py-2 text-sm border border-border-medium rounded-lg hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more threads'}
              </button>
            </div>
          )}

          {/* Thread create form — auth gate handles unauthenticated state */}
          <div className="mt-8 pt-8 border-t border-border-light">
            <h3 className="text-base font-semibold text-text-body mb-4">Start a New Thread</h3>
            <ThreadCreateForm communityId={community.id} communitySlug={slug!} />
          </div>
        </div>
      </div>
    </>
  )
}
