import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { HOW_IT_WORKS_STEPS } from '../lib/howItWorks'
import type { Chair, Community } from '../types'

/**
 * The landing page's illustration: four short scenes, one per step of using
 * Focused Communities, played in a loop.
 *
 * What is real and what is not:
 *  - Scenes 1 and 2 show LIVE data passed in by the page: real communities,
 *    and the real question and perspectives of one of them. While that data
 *    is loading, or if the request failed, the same slots render as neutral
 *    bars rather than as made-up names.
 *  - Scenes 3 and 4 show the app's own interface wording (the column headings,
 *    the rating question, the composer and edit-history labels). Production
 *    has no arguments or threads yet, so their contents stay as bars: a
 *    landing page that invented a debate would be invented data.
 *
 * Motion: each scene remounts on entry, so its CSS animations replay. The
 * loop pauses while the pointer or keyboard focus is on the illustration, and
 * under prefers-reduced-motion it does not auto-advance at all and the
 * `.fc-anim` rule in index.css switches every animation off, so each scene
 * simply shows its finished state.
 */

export interface HowItWorksData {
  /** A few communities for the directory scene, the featured one first. */
  communities: Community[]
  /** The community the later scenes follow. */
  featured: Community | null
  questionText: string | null
  chairs: Chair[]
}

// How long each scene stays up, and how fast the motion inside it plays.
// Every delay and duration below is written at a 1x pace and run through t(),
// so the whole illustration speeds up or slows down from this one number.
const STEP_MS = 2500
const PACE = 0.45
const t = (ms: number) => Math.round(ms * PACE)

function rise(delay: number): CSSProperties {
  return { animation: `fc-rise ${t(500)}ms cubic-bezier(0, 0, 0.2, 1) ${t(delay)}ms both` }
}
function fill(delay: number, ms = 700): CSSProperties {
  return { animation: `fc-fill ${t(ms)}ms cubic-bezier(0, 0, 0.2, 1) ${t(delay)}ms both`, transformOrigin: 'left' }
}
function pick(riseDelay: number, pickDelay: number): CSSProperties {
  return {
    animation: `fc-rise ${t(500)}ms cubic-bezier(0,0,.2,1) ${t(riseDelay)}ms both, fc-pick ${t(500)}ms cubic-bezier(.34,1.56,.64,1) ${t(pickDelay)}ms both`,
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function HowItWorksAnimation({
  step,
  onStepChange,
  data,
}: {
  step: number
  onStepChange: (next: number) => void
  data: HowItWorksData
}) {
  const reduced = usePrefersReducedMotion()
  const [paused, setPaused] = useState(false)
  const autoplay = !reduced && !paused

  useEffect(() => {
    if (!autoplay) return
    const t = setTimeout(() => onStepChange((step + 1) % HOW_IT_WORKS_STEPS.length), STEP_MS)
    return () => clearTimeout(t)
  }, [autoplay, step, onStepChange])

  return (
    <div
      id="how-it-works-animation"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="mx-auto w-full max-w-[460px] scroll-mt-24 md:mr-0"
    >
      <div
        aria-hidden="true"
        className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-border-light bg-surface-card p-4 sm:p-5 shadow-sm"
      >
        <div key={step} className="h-full w-full">
          {step === 0 && <SceneTopics data={data} />}
          {step === 1 && <ScenePerspectives data={data} />}
          {step === 2 && <SceneArgument data={data} />}
          {step === 3 && <SceneDiscussion />}
        </div>
      </div>

      {/* Step picker: the scenes' names, and a progress rule on the one playing. */}
      <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="How it works, step by step">
        {HOW_IT_WORKS_STEPS.map((s, i) => {
          const active = i === step
          return (
            <button
              key={s.title}
              type="button"
              onClick={() => onStepChange(i)}
              aria-pressed={active}
              className={`flex flex-col justify-start text-left rounded-lg px-2 py-2 text-xs sm:text-sm transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring ${
                active ? 'text-text-body font-semibold' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="block h-1 w-full overflow-hidden rounded-full bg-border-light mb-2">
                {active && (
                  <span
                    key={`${step}-${autoplay}`}
                    className="fc-anim block h-full w-full rounded-full bg-ev-teal dark:bg-ev-teal-light"
                    style={
                      autoplay
                        ? { animation: `fc-fill ${STEP_MS}ms linear both`, transformOrigin: 'left' }
                        : undefined
                    }
                  />
                )}
              </span>
              <span className="flex min-h-[2.75em] items-center leading-snug">
                <span>
                  {i + 1}. {s.title}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* What the scene on screen is showing, in words. */}
      <p className="mt-3 min-h-[3rem] px-2 text-sm text-text-secondary leading-relaxed">
        {HOW_IT_WORKS_STEPS[step].body}
      </p>
    </div>
  )
}

/* ---- Pieces --------------------------------------------------------------- */

function Bar({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span className={`block h-2 rounded-full bg-border-medium ${className}`} style={style} />
}

/** A small uppercase label, the way the app labels its bands. */
function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted ${className}`}>
      {children}
    </span>
  )
}

/** A pointer that drifts onto whatever it sits beside. */
function Pointer({ delay, className = '' }: { delay: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`fc-anim pointer-events-none absolute h-6 w-6 drop-shadow ${className}`}
      style={{ animation: `fc-point ${t(700)}ms cubic-bezier(0,0,.2,1) ${t(delay)}ms both` }}
    >
      <path
        d="M5 3l14 8-6 1.5L10 19z"
        className="fill-text-body stroke-surface-card"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---- Scenes --------------------------------------------------------------- */

/** 1. The directory: the search box, real communities, one gets chosen. */
function SceneTopics({ data }: { data: HowItWorksData }) {
  const rows = data.communities.slice(0, 3)
  return (
    <div className="flex h-full flex-col gap-3">
      <Label>Communities</Label>
      <div
        className="fc-anim flex items-center gap-2 rounded-lg border border-border-medium px-3 py-2 text-sm text-text-muted"
        style={rise(0)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search communities...
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {(rows.length ? rows : [null, null, null]).map((c, i) => (
          <div
            key={c?.id ?? i}
            className={`fc-anim relative rounded-lg border p-3 ${
              i === 0 ? 'border-ev-teal dark:border-ev-teal-light bg-surface-card' : 'border-border-light'
            }`}
            style={i === 0 ? pick(150, 1700) : rise(150 + i * 150)}
          >
            {c ? (
              <>
                <span className="block text-sm font-semibold text-text-body">{c.name}</span>
                <span
                  className={`mt-1 text-xs text-text-secondary leading-snug ${
                    i === 0 ? 'line-clamp-2' : 'line-clamp-1'
                  }`}
                >
                  {c.description}
                </span>
              </>
            ) : (
              <span className="flex flex-col gap-2">
                <Bar className="w-1/2 !bg-text-muted" />
                <Bar className="w-full" />
              </span>
            )}
            {i === 0 && <Pointer delay={1300} className="right-4 bottom-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 2. That community's question this season, and its perspectives. */
function ScenePerspectives({ data }: { data: HowItWorksData }) {
  const chairs = data.chairs.slice(0, 5)
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="fc-anim" style={rise(0)}>
        <Label className="!text-text-primary">{data.featured?.name ?? 'This season'}</Label>
        {data.questionText ? (
          <p className="mt-1.5 text-sm sm:text-base font-semibold text-text-body leading-snug line-clamp-2">
            {data.questionText}
          </p>
        ) : (
          <Bar className="mt-2 w-5/6 !h-3 !bg-text-body" />
        )}
      </div>
      <Label className="mt-1">Perspectives</Label>
      <div className="flex flex-1 flex-col gap-2">
        {(chairs.length ? chairs : [null, null, null, null, null]).map((chair, i) => (
          <div
            key={i}
            className="fc-anim flex items-center gap-3 rounded-lg border border-border-light px-3 py-2"
            style={rise(300 + i * 160)}
          >
            <span className="h-4 w-1 flex-shrink-0 rounded-full bg-ev-yellow" />
            {chair ? (
              <span className="text-xs sm:text-sm text-text-body leading-snug line-clamp-1">{chair.text}</span>
            ) : (
              <Bar className="w-3/4 !bg-text-muted" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** 3. The argument tree: the issue at the root, both sides, and a rating. */
function SceneArgument({ data }: { data: HowItWorksData }) {
  const side = (which: 'supports' | 'opposes', delay: number) => (
    <div className="flex flex-col gap-2">
      <span className="fc-anim text-xs font-semibold text-text-secondary" style={rise(delay)}>
        {which === 'supports' ? 'Supports' : 'Opposes'}
      </span>
      <span
        className={`fc-anim block h-0.5 rounded-full ${which === 'supports' ? 'bg-claim-supports' : 'bg-claim-opposes'}`}
        style={fill(delay)}
      />
      <div className="fc-anim flex gap-2.5 rounded-lg border border-border-light p-2.5" style={rise(delay + 250)}>
        <span
          className={`w-1 flex-shrink-0 self-stretch rounded-full ${
            which === 'supports' ? 'bg-claim-supports' : 'bg-claim-opposes'
          }`}
        />
        <span className="flex flex-1 flex-col gap-1.5">
          <Bar className="w-full" />
          <Bar className="w-2/3" />
          <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full border border-impact-track">
            <span
              className={`fc-anim block h-full ${which === 'supports' ? 'w-4/5 bg-claim-supports' : 'w-1/2 bg-claim-opposes'}`}
              style={fill(delay + 700)}
            />
          </span>
        </span>
      </div>
    </div>
  )
  return (
    <div className="relative flex h-full flex-col gap-3">
      <div className="fc-anim mx-auto w-full max-w-xs rounded-lg border-2 border-border-medium px-3 py-2 text-center" style={rise(0)}>
        <Label>The issue</Label>
        {data.featured ? (
          <span className="mt-0.5 text-sm font-semibold text-text-body line-clamp-1">{data.featured.name}</span>
        ) : (
          <Bar className="mx-auto mt-1.5 w-2/3 !bg-text-body" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {side('supports', 350)}
        {side('opposes', 600)}
      </div>

      {/* Rating, worded and anchored exactly as ImpactControl is. */}
      <div className="fc-anim relative rounded-lg bg-surface-hover p-3" style={rise(1500)}>
        <span className="block text-xs font-medium text-text-secondary">
          How much weight does this argument deserve?
        </span>
        <span className="mt-2 flex gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`fc-anim h-4 flex-1 rounded-sm border ${i === 6 ? 'fc-selected ' : ''}${
                i === 6 ? 'border-claim-supports' : 'border-border-medium'
              }`}
              style={i === 6 ? { animation: `fc-select ${t(300)}ms ease-out ${t(2600)}ms both` } : undefined}
            />
          ))}
        </span>
        <span className="mt-1 flex justify-between text-[10px] text-text-muted">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
        </span>
        <Pointer delay={2200} className="right-[22%] -bottom-1" />
      </div>

      <div
        className="fc-anim flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border-medium py-2 text-xs font-medium text-text-secondary"
        style={rise(3000)}
      >
        <span aria-hidden="true">+</span> Add a supporting argument
      </div>
    </div>
  )
}

/** 4. The forum: a thread, a reply being posted, and an edit kept on record. */
function SceneDiscussion() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="fc-anim flex items-center justify-between" style={rise(0)}>
        <span className="text-sm font-semibold text-text-body">Discussion</span>
        <span className="flex gap-1.5 text-[11px]">
          <span className="rounded-full bg-ev-teal px-2.5 py-0.5 text-white">Most Active</span>
          <span className="px-2 py-0.5 text-text-secondary">Newest</span>
        </span>
      </div>

      <div className="fc-anim flex flex-col gap-2 rounded-lg border border-border-light p-3" style={rise(200)}>
        <Bar className="w-1/2 !h-2.5 !bg-text-body" />
        <Bar className="w-full" />
        <Bar className="w-4/5" />
      </div>

      {/* A reply, typed and posted. */}
      <div className="fc-anim rounded-lg border border-border-medium p-3" style={rise(600)}>
        <span className="flex flex-col gap-1.5">
          <Bar className="fc-anim w-11/12" style={fill(900, 600)} />
          <Bar className="fc-anim w-3/5" style={fill(1400, 500)} />
        </span>
        <span className="mt-2.5 flex justify-end">
          <span
            className="fc-anim rounded-md bg-ev-coral px-3 py-1 text-[11px] font-semibold text-white"
            style={{ animation: `fc-press ${t(300)}ms ease-in-out ${t(2000)}ms both` }}
          >
            Reply
          </span>
        </span>
      </div>

      <div className="fc-anim flex items-start gap-2.5" style={rise(2400)}>
        <span className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-ev-yellow" />
        <div className="flex flex-1 flex-col gap-1.5 rounded-lg bg-surface-hover p-3">
          <Bar className="w-11/12" />
          <Bar className="w-3/5" />
          <span className="fc-anim mt-1 flex items-center gap-2 text-[11px]" style={rise(3300)}>
            <span className="italic text-text-muted">(edited)</span>
            <span className="text-text-primary underline underline-offset-2">View edit history</span>
          </span>
        </div>
      </div>
    </div>
  )
}
