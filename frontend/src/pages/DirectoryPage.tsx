import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCommunities } from '../hooks/useCommunities'
import { useCompassCategories } from '../hooks/useCompassCategories'
import { Header } from '../components/Header'
import { CategoryIcon } from '../components/CategoryIcon'
import type { Community } from '../types'

/**
 * The directory of communities.
 *
 * Every community is one Compass topic, so the Compass's own categories and
 * questions (GET /api/compass/categories, joined on `community.topicId`) are
 * what organise this page: a reader can scan by category, see the question
 * each community is asking before opening it, and search across names,
 * questions and descriptions at once.
 *
 * All communities arrive in one request (61 today), so search and the
 * category filter run on the client and answer as you type. If the Compass
 * request fails, the page still lists every community, ungrouped and with its
 * description where the question would be; it never invents a category or a
 * question.
 */

const OTHER = 'Other topics'

interface Entry {
  community: Community
  question: string | null
  categories: string[]
}

export default function DirectoryPage() {
  const [search, setSearch] = useState('')
  // The chosen category lives in ?category=, so "See all" is a real page the
  // browser's back button returns from, and a filtered view can be shared.
  const [params, setParams] = useSearchParams()
  const category = params.get('category')
  function setCategory(next: string | null) {
    setParams(next ? { category: next } : {})
    window.scrollTo({ top: 0 })
  }
  const searchRef = useRef<HTMLInputElement>(null)

  const { communities, isLoading, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCommunities(undefined, 'newest', 100)
  const compass = useCompassCategories()

  // Search and filtering are client-side, so every page must be loaded.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // "/" jumps to the search box, as it does on most directories.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Join each community to its Compass topic: its question and categories.
  const { entries, categoryOrder } = useMemo(() => {
    const byTopic = new Map<string, { question: string | null; categories: string[] }>()
    const order: string[] = []
    for (const cat of compass.data ?? []) {
      order.push(cat.title)
      for (const topic of cat.topics) {
        const hit = byTopic.get(topic.id) ?? { question: topic.question_text, categories: [] }
        hit.categories.push(cat.title)
        byTopic.set(topic.id, hit)
      }
    }
    const list: Entry[] = communities.map((c) => {
      const hit = byTopic.get(c.topicId)
      return { community: c, question: hit?.question ?? null, categories: hit?.categories ?? [] }
    })
    list.sort((a, b) => a.community.name.localeCompare(b.community.name))
    return { entries: list, categoryOrder: order }
  }, [communities, compass.data])

  const grouped = compass.isSuccess
  const query = search.trim().toLowerCase()

  const visible = entries.filter((e) => {
    if (category === OTHER ? e.categories.length > 0 : category && !e.categories.includes(category)) {
      return false
    }
    if (!query) return true
    return [e.community.name, e.community.description, e.question ?? '', ...e.categories]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  // Count per category, for the chips.
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (e.categories.length === 0) counts.set(OTHER, (counts.get(OTHER) ?? 0) + 1)
    for (const c of e.categories) counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const chips = [...categoryOrder.filter((c) => counts.get(c)), ...(counts.get(OTHER) ? [OTHER] : [])]

  // Sections: one per category, each community under its first category so
  // nothing repeats in the overview. A chosen category, or a search, shows a
  // single flat grid instead.
  const sections: { title: string | null; items: Entry[] }[] = []
  if (!grouped || category || query) {
    sections.push({ title: null, items: visible })
  } else {
    for (const title of chips) {
      const items = visible.filter((e) => (e.categories[0] ?? OTHER) === title)
      if (items.length) sections.push({ title, items })
    }
  }

  return (
    <>
      <Header />

      {/* Page header and search, centred */}
      <div className="border-b border-border-light bg-surface-primary">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-body">Find your issue</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Each community is one issue from the Empowered Compass, with its question, the range of views, and the argument so far.
          </p>

          {/* One bar: search on the left, the category menu built into its right end. */}
          <div className="mt-6 flex h-12 w-full items-stretch rounded-xl border border-border-medium bg-surface-card text-left shadow-sm transition-colors focus-within:border-ev-teal focus-within:ring-4 focus-within:ring-ev-teal/15 dark:focus-within:border-ev-teal-light dark:focus-within:ring-ev-teal-light/20">
            <label className="relative flex min-w-0 flex-1 items-center">
              <span className="sr-only">Search communities</span>
              {/* Magnifying glass: a ring and a handle. */}
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 h-5 w-5 text-text-secondary"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues, questions or keywords"
                className="h-full w-full rounded-l-xl bg-transparent pl-12 pr-10 text-base text-text-body placeholder:text-text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    searchRef.current?.focus()
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text-body"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </label>

            {grouped && chips.length > 0 && (
              <CategoryMenu
                value={category}
                onChange={setCategory}
                options={chips.map((c) => ({ label: c, count: counts.get(c) ?? 0 }))}
                total={entries.length}
              />
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl border border-border-light bg-surface-card" />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-3">Failed to load communities</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm bg-ev-coral text-white rounded-lg hover:bg-ev-coral-hover transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {category && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:text-link-hover focus:outline-none focus-visible:underline"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                  </svg>
                  Back to all topics
                </button>
                <h2 className="mt-3 flex items-center gap-2.5 text-xl font-bold text-text-body">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hover text-text-primary">
                    <CategoryIcon title={category} className="h-5 w-5" />
                  </span>
                  {category}
                </h2>
              </div>
            )}

            {(query || category) && (
              <p className="mb-4 text-sm text-text-muted" aria-live="polite">
                {visible.length === 0
                  ? 'No communities match'
                  : `${visible.length} ${visible.length === 1 ? 'community' : 'communities'}`}
                {query ? ` for “${search.trim()}”` : ''}
              </p>
            )}

            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-medium py-12 text-center">
                <p className="text-text-secondary">Nothing here yet. Try a different word or category.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCategory(null)
                  }}
                  className="mt-3 text-sm font-medium text-link hover:text-link-hover underline underline-offset-2"
                >
                  Clear search and filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {sections.map((section) => (
                  <section key={section.title ?? 'all'} aria-label={section.title ?? 'Communities'}>
                    {section.title && (
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <h2 className="flex items-center gap-2.5 text-lg font-bold text-text-body">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover text-text-primary">
                            <CategoryIcon title={section.title} className="h-[18px] w-[18px]" />
                          </span>
                          {section.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setCategory(section.title)}
                          className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-medium text-link hover:text-link-hover"
                        >
                          See all {section.items.length}
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.97-3.97a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {section.title ? (
                      // Overview row. Phones: swipe sideways through the whole
                      // category. Wider screens: one row (2 or 3 cards), and
                      // "See all" opens the rest, so the page stays short.
                      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                        {section.items.map((e, i) => (
                          <div
                            key={e.community.id}
                            className={`w-[85%] flex-shrink-0 snap-start sm:w-auto ${
                              i >= 3 ? 'sm:hidden' : i === 2 ? 'sm:max-lg:hidden' : ''
                            }`}
                          >
                            <CommunityCard entry={e} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {section.items.map((e) => (
                          <CommunityCard key={e.community.id} entry={e} />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

/**
 * The category filter, as a menu built into the search bar: no row of chips
 * pushing the list down. Closes on a pick, an outside click, or Escape, and
 * moves focus back to its button when it closes from the keyboard.
 */
function CategoryMenu({
  value,
  onChange,
  options,
  total,
}: {
  value: string | null
  onChange: (next: string | null) => void
  options: { label: string; count: number }[]
  total: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function choose(next: string | null) {
    onChange(next)
    setOpen(false)
  }

  const item = (label: string | null, count: number) => {
    const selected = value === label
    return (
      <button
        key={label ?? 'all'}
        type="button"
        role="menuitemradio"
        aria-checked={selected}
        onClick={() => choose(label)}
        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover ${
          selected ? 'font-semibold text-text-body' : 'text-text-secondary'
        }`}
      >
        <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${selected ? 'bg-ev-teal text-white dark:bg-ev-teal-light dark:text-surface-primary' : 'bg-surface-hover text-text-primary'}`}>
          {label ? (
            <CategoryIcon title={label} className="h-4 w-4" />
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M3 3.75A.75.75 0 0 1 3.75 3h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 3 8.25v-4.5Zm8 0a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Zm-8 8a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Zm8 0a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5Z" />
            </svg>
          )}
        </span>
        <span className="flex-1">{label ?? 'All categories'}</span>
        <span className="text-xs text-text-muted">{count}</span>
      </button>
    )
  }

  return (
    <div ref={ref} className="relative flex border-l border-border-light">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={value ? `Category: ${value}` : 'Filter by category'}
        className="flex h-full items-center gap-2 rounded-r-xl px-3 sm:px-4 text-sm font-medium text-text-body transition-colors hover:bg-surface-hover focus:outline-none focus-visible:bg-surface-hover"
      >
        {value ? (
          <CategoryIcon title={value} className="h-4 w-4 text-text-primary" />
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-text-secondary" aria-hidden="true">
            <path d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm3 5A.75.75 0 0 1 5.75 9h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 5 9.75Zm3 5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
          </svg>
        )}
        <span className="hidden max-w-[14rem] truncate sm:inline">{value ?? 'All categories'}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Categories"
          className="absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border-light bg-surface-card py-1.5 shadow-lg"
        >
          {item(null, total)}
          <div className="my-1 border-t border-border-light" />
          {options.map((o) => item(o.label, o.count))}
        </div>
      )}
    </div>
  )
}

function CommunityCard({ entry }: { entry: Entry }) {
  const { community, question } = entry
  return (
    <Link
      to={`/communities/${community.slug}`}
      className="group flex h-full flex-col rounded-xl border border-border-light bg-surface-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ev-teal hover:shadow-md focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring dark:hover:border-ev-teal-light"
    >
      <span className="font-semibold leading-snug text-text-body">{community.name}</span>
      {question ? (
        <span className="mt-2 flex gap-2.5">
          <span className="mt-0.5 w-1 flex-shrink-0 self-stretch rounded-full bg-ev-yellow" aria-hidden="true" />
          <span className="text-[15px] leading-snug text-text-body">{question}</span>
        </span>
      ) : (
        <span className="mt-2 text-sm leading-relaxed text-text-secondary line-clamp-3">{community.description}</span>
      )}
      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-text-primary">
        Open community
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.97-3.97a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </span>
    </Link>
  )
}
