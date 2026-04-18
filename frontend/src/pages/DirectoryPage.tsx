import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useCommunities } from '../hooks/useCommunities'
import { CommunityCardSkeleton } from '../components/SkeletonCard'
import { Header } from '../components/Header'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function DirectoryPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { communities, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCommunities(debouncedSearch || undefined)

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-body mb-6">Communities</h1>

        {/* Keyword filter */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="w-full px-4 py-2 border border-border-medium rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ev-teal focus:border-transparent"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <CommunityCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-3">Failed to load communities</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm bg-ev-coral text-white rounded-lg hover:bg-ev-coral-hover transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Community list */}
        {!isLoading && !isError && (
          <>
            {communities.length === 0 ? (
              <p className="text-text-muted text-center py-8">No communities match your search</p>
            ) : (
              <div className="border border-border-light rounded-lg divide-y divide-border-light overflow-hidden shadow-sm">
                {communities.map(community => (
                  <Link
                    key={community.id}
                    to={`/communities/${community.slug}`}
                    className="block p-4 hover:bg-surface-hover transition-colors"
                  >
                    <div className="font-semibold text-text-body mb-1">{community.name}</div>
                    <div className="text-sm text-text-secondary leading-relaxed">{community.description}</div>
                    {/* TODO: calibrated stance indicator — requires compass data API */}
                  </Link>
                ))}
              </div>
            )}

            {/* Load more */}
            {hasNextPage && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className="px-6 py-2 text-sm border border-border-medium rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
