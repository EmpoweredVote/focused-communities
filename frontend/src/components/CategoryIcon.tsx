import type { ReactNode } from 'react'

/**
 * An icon for a Compass category. Category titles come from the API
 * (/api/compass/categories), so they are matched by keyword rather than by
 * exact string: a renamed category keeps its icon as long as its subject
 * word survives, and one this file does not know gets the generic tag.
 *
 * Simple 24×24 stroke icons drawn for this file, in the same weight as the
 * header's, so they inherit `currentColor` and follow the theme.
 */

type IconKey =
  | 'rights'
  | 'economy'
  | 'education'
  | 'environment'
  | 'foreign'
  | 'governance'
  | 'health'
  | 'judicial'
  | 'safety'
  | 'technology'
  | 'other'

const MATCHERS: [IconKey, RegExp][] = [
  ['rights', /civil rights|social policy/i],
  ['economy', /econom|labor|labour/i],
  ['education', /educat|school/i],
  ['environment', /environment|climate/i],
  ['foreign', /foreign|national security/i],
  ['governance', /governance|democracy|institution/i],
  ['health', /health|safety net/i],
  ['judicial', /judicial|legal|court/i],
  ['safety', /public safety|law enforcement|police/i],
  ['technology', /technolog|data|innovation/i],
]

function categoryIconKey(title: string | null | undefined): IconKey {
  if (!title) return 'other'
  return MATCHERS.find(([, re]) => re.test(title))?.[0] ?? 'other'
}

const PATHS: Record<IconKey, ReactNode> = {
  // Two people
  rights: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.2c2.6.2 4.5 2.1 4.5 4.8" />
    </>
  ),
  // Bar chart rising
  economy: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-4M12 16V8M17 16V5" />
    </>
  ),
  // Graduation cap
  education: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4c0 1.4 2.5 2.75 5.5 2.75s5.5-1.35 5.5-2.75v-4" />
      <path d="M21.5 9.5V15" />
    </>
  ),
  // Leaf
  environment: (
    <>
      <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" />
      <path d="M5 19c3-4 6-7 10-9" />
    </>
  ),
  // Globe
  foreign: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5z" />
    </>
  ),
  // Columned building
  governance: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
      <path d="M3 20h18" />
    </>
  ),
  // Heart with a pulse
  health: (
    <>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />
      <path d="M7 12h2.5l1.5-2.5 2 5 1.5-2.5H17" />
    </>
  ),
  // Scales of justice
  judicial: (
    <>
      <path d="M12 4v16M8 20h8M5 7h14" />
      <path d="M5 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />
      <path d="M19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />
    </>
  ),
  // Shield
  safety: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // Chip
  technology: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
    </>
  ),
  // Tag
  other: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z" />
      <circle cx="8" cy="8" r="1.25" />
    </>
  ),
}

export function CategoryIcon({ title, className = 'h-5 w-5' }: { title: string | null | undefined; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[categoryIconKey(title)]}
    </svg>
  )
}
