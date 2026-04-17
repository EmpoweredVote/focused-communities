import { useParams } from 'react-router'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { useStances } from '../hooks/useStances'
import { StanceCard } from '../components/StanceCard'
import { StanceCardSkeleton } from '../components/SkeletonCard'
import { BackNav } from '../components/BackNav'

export default function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: community, isLoading: communityLoading, isError: communityError } = useCommunityBySlug(slug)
  const { data: stances, isLoading: stancesLoading, isError: stancesError, refetch: refetchStances } =
    useStances(community?.id)

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

      {/* Thread list placeholder — replaced in Plan 05-03 */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Discussion</h2>
        <p className="text-gray-500 text-sm">Thread list — coming in Plan 05-03</p>
      </div>
    </div>
  )
}
