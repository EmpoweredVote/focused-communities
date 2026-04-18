import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { useStances, shuffle } from '../hooks/useStances'
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
  const [displayedStances, setDisplayedStances] = useState<DisplayStance[]>([])

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

  useEffect(() => {
    if (stances) setDisplayedStances(stances)
  }, [stances])

  const {
    threads,
    isLoading: threadsLoading,
    isError: threadsError,
    refetch: refetchThreads,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useThreads(community?.id, sort)

  function handleShuffle() {
    setDisplayedStances(prev => shuffle(prev))
  }

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
                onClick={handleShuffle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary border border-border-light rounded-lg hover:bg-surface-hover transition-colors"
                title="Shuffle order"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.312.311a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm-11.073-3.96a.75.75 0 0 0 1.449.388A5.5 5.5 0 0 1 14.888 5.39l.311.31h-2.432a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V2.816a.75.75 0 0 0-1.5 0v2.033l-.312-.31A7 7 0 0 0 3.69 7.664a.75.75 0 0 0 .55-.2Z" clipRule="evenodd" />
                </svg>
                Shuffle
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
