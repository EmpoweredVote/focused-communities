import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router'
import { useCommunityBySlug } from '../hooks/useCommunityBySlug'
import { useSeasonList, useSeasonView } from '../hooks/useSeasons'
import { useLadderDirection } from '../hooks/useLadderDirection'
import type { Chair } from '../types'
import { useThreads } from '../hooks/useThreads'
import { StanceCard } from '../components/StanceCard'
import { SeasonSelector } from '../components/SeasonSelector'
import { SeasonNotes, SeasonFallbackNotice } from '../components/SeasonNotes'
import { StanceCardSkeleton, ThreadListItemSkeleton } from '../components/SkeletonCard'
import { BackNav } from '../components/BackNav'
import { ThreadListItem } from '../components/ThreadListItem'
import { ThreadCreateForm } from '../components/ThreadCreateForm'
import { Header } from '../components/Header'

export default function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [sort, setSort] = useState<'active' | 'newest'>('active')

  const { data: community, isLoading: communityLoading, isError: communityError } = useCommunityBySlug(slug)

  // If the slug was renamed, the API returns the canonical slug. Silently
  // correct the URL so bookmarks and shared links self-heal going forward.
  useEffect(() => {
    if (community && slug && community.slug !== slug) {
      // Keep the query string and hash: ?season= is what makes a shared link worth sharing.
      navigate(`/communities/${community.slug}${location.search}${location.hash}`, { replace: true })
    }
  }, [community, slug, navigate, location.search, location.hash])

  // Bands 1 and 2 are season-scoped. The chosen season lives in ?season= so a
  // link shows the same wording; an absent or unparseable value means "default".
  const [searchParams, setSearchParams] = useSearchParams()
  const seasonList = useSeasonList(community?.id)
  const defaultSeason = seasonList.data?.defaultSeason ?? null
  const rawSeason = searchParams.get('season')
  const requestedSeason =
    rawSeason !== null && /^\d+$/.test(rawSeason) && Number(rawSeason) >= 1
      ? Number(rawSeason)
      : null
  // A present-but-unusable value (abc, -1, 0, 1.5) gets the same notice as an unknown season the API
  // falls back from. A bare "?season=" is treated as absent.
  const seasonParamRejected = rawSeason !== null && rawSeason !== '' && requestedSeason === null
  const noSeasons = seasonList.isSuccess && defaultSeason === null
  const selectedSeason = noSeasons ? undefined : (requestedSeason ?? defaultSeason ?? undefined)

  const seasonView = useSeasonView(community?.id, selectedSeason)
  const view = seasonView.data
  // Which end of the ladder is on top is random per visit; the order itself is never shuffled.
  const { flipped: isInverted, changed: directionChanged, toggle: toggleDirection } = useLadderDirection(view?.chairs.length ?? 0)
  // With keepPreviousData, view is the previous season while the next loads.
  const seasonStale = seasonView.isPlaceholderData
  const seasonsLoading =
    seasonList.isPending || (selectedSeason !== undefined && seasonView.isPending)

  function changeSeason(n: number) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('season', String(n))
        return next
      },
      { replace: true },
    )
  }

  // Keys come from the chair, not its position, so an expanded card follows its
  // chair when Invert reorders the list. Repeated texts get an occurrence suffix.
  const seen = new Map<string, number>()
  function chairKey(text: string): string {
    const n = seen.get(text) ?? 0
    seen.set(text, n + 1)
    return `${view?.season.number}|${text}|${n}`
  }

  // Ladder order is array order; never derive or show a 1-5 number.
  const displayedChairs: Chair[] = view
    ? (isInverted ? [...view.chairs].reverse() : view.chairs)
    : []

  // Switching away from a season that had no chairs leaves nothing to dim, so the band shows
  // the skeleton rather than describing the season being left behind.
  const chairsLoading = seasonsLoading || (seasonStale && displayedChairs.length === 0)
  // Never show the error block above chairs that rendered (e.g. list failed but ?season=N detail
  // loaded), nor above the skeleton while the detail request is still in flight.
  const seasonsError =
    (seasonList.isError || (selectedSeason !== undefined && seasonView.isError)) &&
    !seasonsLoading &&
    displayedChairs.length === 0
  const emptySeason =
    !chairsLoading && !noSeasons && !seasonsError && view !== undefined && view.chairs.length === 0

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

          {/* Band 1: the season's question */}
          {seasonsLoading && (
            <div className="mt-6 h-6 bg-surface-hover rounded w-3/4 animate-pulse" />
          )}
          {noSeasons && (
            <p className="mt-6 text-text-muted text-sm">
              This topic has no published question yet.
            </p>
          )}
          {seasonList.data && (
            <div className="mt-6 max-w-2xl">
              <SeasonSelector
                seasons={seasonList.data.seasons}
                value={(view && !seasonStale ? view.season.number : selectedSeason) ?? -1}
                onChange={changeSeason}
              />
            </div>
          )}
          {view && (
            <div
              aria-busy={seasonStale}
              className={`transition-opacity ${seasonStale ? 'opacity-50' : ''}`}
            >
              <div className="mt-4 max-w-2xl">
                <SeasonFallbackNotice view={seasonParamRejected ? { ...view, isFallback: true } : view} />
              </div>
              <p className="mt-4 text-xl font-semibold text-text-body leading-snug">
                {view.questionText}
              </p>
              <div className="max-w-2xl">
                <SeasonNotes view={view} />
              </div>
            </div>
          )}
        </div>

        {/* Band 2: the season's chairs */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Perspectives</h2>
            {displayedChairs.length > 1 && (
              <button
                aria-pressed={directionChanged}
                onClick={toggleDirection}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  directionChanged
                    ? 'bg-ev-teal text-white border-ev-teal'
                    : 'text-text-secondary border-border-light hover:bg-surface-hover'
                }`}
                title={directionChanged ? 'Restore the order shown' : 'Flip the order'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.24 6.8a.75.75 0 0 0 1.06-.04l1.95-2.1v8.59a.75.75 0 0 0 1.5 0V4.66l1.95 2.1a.75.75 0 1 0 1.1-1.02L6.35 3.18a.75.75 0 0 0-1.1 0L2.28 5.74a.75.75 0 0 0-.04 1.06Zm10.5 6.4a.75.75 0 0 0-1.06.04l-1.95 2.1V6.75a.75.75 0 0 0-1.5 0v8.59l-1.95-2.1a.75.75 0 1 0-1.1 1.02l2.96 3.18a.75.75 0 0 0 1.1 0l2.96-3.18a.75.75 0 0 0 .04-1.06Z" clipRule="evenodd" />
                </svg>
                Invert
              </button>
            )}
          </div>

          {chairsLoading && (
            <div className="flex flex-col gap-3 max-w-2xl">
              {Array.from({ length: 5 }).map((_, i) => <StanceCardSkeleton key={i} />)}
            </div>
          )}

          {noSeasons && (
            <p className="text-text-muted text-sm">No perspectives have been published for this topic yet.</p>
          )}

          {emptySeason && (
            <p className="text-text-muted text-sm">No perspectives were recorded for this season.</p>
          )}

          {seasonsError && (
            <div className="text-center py-6">
              <p className="text-text-secondary mb-3">Failed to load perspectives</p>
              <button
                onClick={() => {
                  if (seasonList.isError) seasonList.refetch()
                  else seasonView.refetch()
                }}
                className="px-4 py-2 text-sm bg-ev-coral text-white rounded-lg hover:bg-ev-coral-hover transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {displayedChairs.length > 0 && (
            <div
              aria-busy={seasonStale}
              className={`flex flex-col gap-3 max-w-2xl transition-opacity ${seasonStale ? 'opacity-50' : ''}`}
            >
              {displayedChairs.map((stance) => (
                // TODO: calibrated stance highlight — requires compass data API
                <StanceCard
                  key={chairKey(stance.text)}
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
