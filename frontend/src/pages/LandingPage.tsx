import { useState } from 'react'
import { Link } from 'react-router'
import { Header } from '../components/Header'
import { HowItWorksAnimation } from '../components/HowItWorksAnimation'
import { useCommunities } from '../hooks/useCommunities'
import { useSeasonList, useSeasonView } from '../hooks/useSeasons'

/**
 * The front door: what Focused Communities is for, how to use it, and a way
 * into the directory at /communities.
 *
 * Copy rule for this page: describe only what the product does today. The
 * Issues in Focus design doc this draws on also describes badges, veracity
 * ratings, symposiums and politician monitoring; none of those are built, so
 * none of them are promised here. Its principles are used where the product
 * already lives by them (Connected Accounts to post, visible edit history,
 * seasons that say why they changed, an argument tree rooted in the problem).
 */

const PRINCIPLES = [
  {
    title: 'One person, one voice',
    body: 'Reading is open to everyone. Posting takes a Connected Account, so every contribution comes from someone who will be back tomorrow.',
    accent: 'bg-ev-teal dark:bg-ev-teal-light',
  },
  {
    title: 'Start from what is shared',
    body: 'The argument is rooted in the problem, not in a side. Find the common ground first, then see exactly where values part ways.',
    accent: 'bg-ev-yellow',
  },
  {
    title: 'Memory over moderation',
    body: 'Edits are kept in a visible history. Mistakes get corrected in the open rather than quietly erased.',
    accent: 'bg-ev-coral',
  },
  {
    title: 'Provisional by design',
    body: 'Questions and positions are revised season by season, and every revision says what changed and why.',
    accent: 'bg-ev-teal dark:bg-ev-teal-light',
  },
]

export default function LandingPage() {
  const [step, setStep] = useState(0)

  // Live data for the illustration: the newest communities, and the question
  // and perspectives of the first one. If any of it fails, the illustration
  // draws neutral bars in its place; it never invents a stand-in.
  const { communities } = useCommunities()
  const featured = communities[0] ?? null
  const seasonList = useSeasonList(featured?.id)
  const season = useSeasonView(featured?.id, seasonList.data?.defaultSeason ?? undefined)

  return (
    <>
      <Header />
      <main>
        {/* Hero: the pitch on the left, the illustration on the right */}
        <section className="max-w-6xl mx-auto px-4 md:px-8 pt-12 pb-16 md:pt-20 md:pb-24 grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-body leading-tight">
              Understand an issue before you argue about it
            </h1>
            <p className="mt-5 text-lg text-text-secondary leading-relaxed max-w-xl">
              Each Focused Community gives one issue from the Empowered Compass a home: the question
              being asked, the real range of positions people hold, a shared map of the arguments, and
              a place to talk it through with people you will see again.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/communities"
                className="inline-flex items-center gap-2 rounded-lg bg-ev-yellow px-5 py-3 text-sm font-semibold text-ev-black hover:bg-ev-yellow-hover transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
              >
                Explore communities
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.97-3.97a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Free to read. Posting needs a Connected Empowered Vote account.
            </p>
          </div>

          <HowItWorksAnimation
            step={step}
            onStepChange={setStep}
            data={{
              communities: communities.slice(0, 3),
              featured,
              questionText: season.data?.questionText ?? null,
              chairs: season.data?.chairs ?? [],
            }}
          />
        </section>

        {/* Principles, from the Issues in Focus design, as the product lives them today */}
        <section className="border-t border-border-light bg-surface-primary">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-bold text-text-body">Built for better conversations</h2>
            <p className="mt-2 text-text-secondary max-w-2xl">
              The goal is understanding, not winning. A few rules make that possible.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="flex gap-4">
                  <span className={`mt-1.5 h-10 w-1 flex-shrink-0 rounded-full ${p.accent}`} aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-text-body">{p.title}</h3>
                    <p className="mt-1 text-text-secondary leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
