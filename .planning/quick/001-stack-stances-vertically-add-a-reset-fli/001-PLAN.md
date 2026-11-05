---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/index.html
  - frontend/src/index.css
  - frontend/src/hooks/useStances.ts
  - frontend/src/components/StanceCard.tsx
  - frontend/src/components/SkeletonCard.tsx
  - frontend/src/pages/CommunityHubPage.tsx
  - frontend/src/pages/DirectoryPage.tsx
  - frontend/src/pages/ThreadPage.tsx
  - frontend/src/pages/NotFoundPage.tsx
  - frontend/src/components/Header.tsx
  - frontend/src/components/BackNav.tsx
  - frontend/src/components/AuthGate.tsx
  - frontend/src/components/ThreadListItem.tsx
  - frontend/src/components/ThreadCreateForm.tsx
  - frontend/src/components/ReplyForm.tsx
  - frontend/src/components/ReplyItem.tsx
  - frontend/src/components/EditForm.tsx
  - frontend/src/components/EditHistory.tsx
  - frontend/src/components/CharCounter.tsx
  - frontend/src/components/AppCrashFallback.tsx
  - frontend/src/App.tsx
autonomous: false

must_haves:
  truths:
    - "Stances display in a single vertical column, not a multi-column grid"
    - "A shuffle button above stances re-randomizes their order without page reload"
    - "Brand colors (evCoral, evMutedBlue, evLightBlue, evYellow) are used throughout instead of generic Tailwind blue/gray"
    - "Manrope font is loaded and applied globally"
    - "Dark mode can be toggled and all pages render correctly in both light and dark themes"
    - "No stance numbers (1-5) are ever shown to users"
  artifacts:
    - path: "frontend/src/index.css"
      provides: "CSS custom properties for brand colors, dark theme variables, Manrope import"
    - path: "frontend/src/pages/CommunityHubPage.tsx"
      provides: "Vertical stance layout with shuffle button"
    - path: "frontend/src/components/Header.tsx"
      provides: "Dark mode toggle, brand-styled header"
  key_links:
    - from: "frontend/src/index.css"
      to: "all components"
      via: "CSS custom properties consumed by Tailwind classes"
      pattern: "var\\(--ev-"
    - from: "frontend/src/components/Header.tsx"
      to: "document.documentElement"
      via: "dark class toggle"
      pattern: "classList.*(dark|toggle)"
---

<objective>
Apply EV brand identity, vertical stance layout with shuffle control, and light/dark mode to the Focused Communities frontend.

Purpose: Transform the generic-looking prototype into a polished, brand-aligned experience that feels like part of the Empowered Vote product family.
Output: Fully themed FC frontend with vertical stances, shuffle button, dark mode toggle, and brand visual polish.
</objective>

<execution_context>
@C:\Users\Chris\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Chris\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/index.css
@frontend/src/types.ts
@frontend/src/App.tsx
@frontend/src/main.tsx
@frontend/index.html
@frontend/src/hooks/useStances.ts
@frontend/src/components/StanceCard.tsx
@frontend/src/components/SkeletonCard.tsx
@frontend/src/pages/CommunityHubPage.tsx
@frontend/src/pages/DirectoryPage.tsx
@frontend/src/pages/ThreadPage.tsx
@frontend/src/components/Header.tsx
@frontend/src/components/BackNav.tsx
@frontend/src/components/AuthGate.tsx
@frontend/src/components/ThreadListItem.tsx
@frontend/src/components/ThreadCreateForm.tsx
@frontend/src/components/ReplyForm.tsx
@frontend/src/components/ReplyItem.tsx
@frontend/src/components/EditForm.tsx
@frontend/src/components/EditHistory.tsx
@frontend/src/components/CharCounter.tsx
@frontend/src/components/AppCrashFallback.tsx
@frontend/src/pages/NotFoundPage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Brand theme foundation -- CSS custom properties, Manrope font, dark mode infrastructure</name>
  <files>
    frontend/index.html
    frontend/src/index.css
  </files>
  <action>
**index.html:** Add Google Fonts preconnect and Manrope import in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

**index.css:** After the `@import "tailwindcss";` line, add a comprehensive theme block. Use Tailwind v4's `@theme` directive to define brand design tokens as CSS custom properties that Tailwind can consume directly:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand colors */
  --color-ev-coral: #FF5740;
  --color-ev-coral-hover: #E61B00;
  --color-ev-teal: #00657C;
  --color-ev-teal-dark: #003E4D;
  --color-ev-teal-light: #59B0C4;
  --color-ev-yellow: #FED12E;
  --color-ev-yellow-light: #FEF3C7;

  /* Semantic surface colors (light defaults) */
  --color-surface-primary: #FFFFFF;
  --color-surface-secondary: #F0F8FA;
  --color-surface-hover: #E4F3F6;
  --color-surface-card: #FFFFFF;

  /* Semantic text colors */
  --color-text-primary: #00657C;
  --color-text-body: #1C1C1C;
  --color-text-secondary: #4A5568;
  --color-text-muted: #718096;

  /* Semantic border colors */
  --color-border-light: #E2EBEF;
  --color-border-medium: #C9CFD1;

  /* Focus ring */
  --color-focus-ring: #00657C;

  /* Font family */
  --font-sans: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Border radius matching EV tokens */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
}
```

Also add base styles after the @theme block:

```css
html {
  font-family: var(--font-sans);
  background-color: var(--color-surface-secondary);
  color: var(--color-text-body);
}

/* Dark mode overrides via CSS custom properties */
html.dark {
  --color-surface-primary: #0F1A1E;
  --color-surface-secondary: #05262E;
  --color-surface-hover: #03303A;
  --color-surface-card: #0F1A1E;
  --color-text-primary: #59B0C4;
  --color-text-body: #E4F3F6;
  --color-text-secondary: #A7CFD8;
  --color-text-muted: #7DD4E8;
  --color-border-light: #2B616E;
  --color-border-medium: #327E8F;
}

/* Smooth dark mode transition */
html {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

IMPORTANT: The `@custom-variant dark` line enables `dark:` prefix in Tailwind v4 to work off the `.dark` class on `<html>` rather than `prefers-color-scheme`. This is critical for the manual toggle to work.
  </action>
  <verify>
Run `cd frontend && npx tsc --noEmit && npx vite build` to confirm no build errors. Check that the CSS output includes all custom properties.
  </verify>
  <done>
Manrope font loads from Google Fonts. All brand colors are available as Tailwind utilities (e.g., `bg-ev-coral`, `text-ev-teal`). Semantic surface/text/border colors defined. Dark mode custom properties override light values when `.dark` class is on `<html>`. Build succeeds.
  </done>
</task>

<task type="auto">
  <name>Task 2: Vertical stances with shuffle button, and brand-themed components</name>
  <files>
    frontend/src/hooks/useStances.ts
    frontend/src/components/StanceCard.tsx
    frontend/src/components/SkeletonCard.tsx
    frontend/src/pages/CommunityHubPage.tsx
    frontend/src/components/Header.tsx
  </files>
  <action>
**useStances.ts:** Export the shuffle function so CommunityHubPage can call it for re-randomization. The cleanest approach: add a `shuffleKey` state approach. Modify the hook to accept an optional `shuffleSeed` parameter and include it in the queryKey's select transform rather than in the queryFn. Actually, simplest approach: the hook already strips position and shuffles in queryFn. To reshuffle without refetching, the page component should keep its own `stances` state and reshuffle locally. Export the `shuffle` function from the hook file:

```ts
// Make shuffle available for re-randomization
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

The function is already defined; just add `export` to it.

**CommunityHubPage.tsx -- Stance layout and shuffle button:**

1. Change the stance grid from `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4` to a single-column vertical stack: `flex flex-col gap-3 max-w-2xl`. This applies to BOTH the skeleton loading state AND the actual stance list.

2. Add a shuffle button above the stances list. Place it in the perspectives section header row, between the "Perspectives" heading and the stance cards:

```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-text-primary">Perspectives</h2>
  {stances && stances.length > 0 && (
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
```

3. Add local state for displayed stances and a shuffle handler. Import `shuffle` from `../hooks/useStances`:

```tsx
import { useStances, shuffle } from '../hooks/useStances'

// Inside component:
const [displayedStances, setDisplayedStances] = useState<DisplayStance[]>([])

useEffect(() => {
  if (stances) setDisplayedStances(stances)
}, [stances])

function handleShuffle() {
  setDisplayedStances(prev => shuffle(prev))
}
```

Then render `displayedStances` instead of `stances` in the map. Also import `DisplayStance` type.

4. Apply brand colors throughout CommunityHubPage:
   - Replace `text-gray-900` headings with `text-text-primary`
   - Replace `text-gray-600` body text with `text-text-secondary`
   - Replace `bg-blue-600` buttons with `bg-ev-coral hover:bg-ev-coral-hover`
   - Replace `border-gray-200` with `border-border-light`
   - Replace `bg-white` with `bg-surface-primary`
   - Replace `hover:bg-gray-50` with `hover:bg-surface-hover`
   - Replace `text-gray-400` and `text-gray-500` with `text-text-muted`
   - Replace sort pill active state `bg-gray-900 text-white` with `bg-ev-teal text-white`
   - Add dark mode variants where backgrounds change: add `dark:bg-surface-primary`, `dark:border-border-light`, `dark:text-text-body` etc. Since we use semantic custom properties that change in dark mode, many classes will "just work" when using the semantic names. But elements with hardcoded Tailwind colors (e.g., `bg-white`) need explicit dark overrides.

**StanceCard.tsx:**
- Replace `bg-blue-50 border-blue-200` highlight with `bg-ev-yellow-light border-ev-yellow`
- Replace `bg-white border-gray-200` with `bg-surface-card border-border-light`
- Replace `hover:border-gray-300` with `hover:border-border-medium`
- Replace `text-gray-900` with `text-text-body`
- Replace `text-gray-600` with `text-text-secondary`
- Replace `text-gray-400` with `text-text-muted`
- Replace `text-gray-500` with `text-text-muted`
- Add subtle left border accent: when not highlighted, add `border-l-4 border-l-transparent`; consider a subtle `hover:border-l-ev-teal-light` effect for visual interest.

**SkeletonCard.tsx:**
- Replace `border-gray-200` and `border-gray-100` with `border-border-light`
- Replace `bg-gray-200` skeletons -- since react-loading-skeleton has its own colors, add dark mode support: in index.css add:
```css
.dark .react-loading-skeleton {
  --base-color: #03303A;
  --highlight-color: #2B616E;
}
```

**Header.tsx:**
- Add dark mode toggle button (sun/moon icon) next to auth controls
- Style header: `bg-surface-primary border-b border-border-light`
- Brand name link: `text-ev-teal font-bold`
- "Your activity" link: `text-ev-teal-light hover:text-ev-teal`
- Sign in/out: `text-text-muted hover:text-text-primary`

Dark mode toggle implementation:
```tsx
const [darkMode, setDarkMode] = useState(() => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('fc-theme') === 'dark' ||
    (!localStorage.getItem('fc-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
})

useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode)
  localStorage.setItem('fc-theme', darkMode ? 'dark' : 'light')
}, [darkMode])
```

Sun/moon toggle button (place before auth controls):
```tsx
<button
  type="button"
  onClick={() => setDarkMode(d => !d)}
  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {darkMode ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.061-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061Z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
    </svg>
  )}
</button>
```

Also initialize dark class on page load to avoid flash. Add to index.html `<head>`, before the font links:
```html
<script>
  (function(){var t=localStorage.getItem('fc-theme');if(t==='dark'||(t===null&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})();
</script>
```

CRITICAL: Never show stance numbers 1-5 to users. The shuffle button must NOT use numbered labels, position indicators, or any numeric ordering. It simply randomizes the visual order. The button label is "Shuffle" with a refresh/swap icon.
  </action>
  <verify>
Run `cd frontend && npx tsc --noEmit && npx vite build` to confirm no type errors and successful build. Visually inspect that:
1. Stances are stacked vertically (single column)
2. Shuffle button exists and re-orders stances on click
3. No numbers appear anywhere on stances
4. Dark mode toggle works in header
5. Brand colors are visible (teal header brand name, coral buttons)
  </verify>
  <done>
Stances display vertically in a single column. Shuffle button above stances re-randomizes order without reload. Dark mode toggle in header persists preference to localStorage. Brand name shows in evTeal. No stance numbers visible.
  </done>
</task>

<task type="auto">
  <name>Task 3: Brand-theme all remaining pages and components</name>
  <files>
    frontend/src/pages/DirectoryPage.tsx
    frontend/src/pages/ThreadPage.tsx
    frontend/src/pages/NotFoundPage.tsx
    frontend/src/components/BackNav.tsx
    frontend/src/components/AuthGate.tsx
    frontend/src/components/ThreadListItem.tsx
    frontend/src/components/ThreadCreateForm.tsx
    frontend/src/components/ReplyForm.tsx
    frontend/src/components/ReplyItem.tsx
    frontend/src/components/EditForm.tsx
    frontend/src/components/EditHistory.tsx
    frontend/src/components/CharCounter.tsx
    frontend/src/components/AppCrashFallback.tsx
    frontend/src/App.tsx
  </files>
  <action>
Apply the same brand color replacements across ALL remaining components. The systematic mapping is:

**Backgrounds:**
- `bg-white` -> `bg-surface-primary`
- `bg-gray-50` -> `bg-surface-hover`
- `bg-gray-100` -> `bg-surface-hover` (or `bg-surface-secondary` for larger areas)
- `bg-blue-600` -> `bg-ev-coral`
- `hover:bg-blue-700` -> `hover:bg-ev-coral-hover`
- `hover:bg-gray-50` -> `hover:bg-surface-hover`

**Text:**
- `text-gray-900` -> `text-text-body`
- `text-gray-800` -> `text-text-body`
- `text-gray-700` -> `text-text-body`
- `text-gray-600` -> `text-text-secondary`
- `text-gray-500` -> `text-text-muted`
- `text-gray-400` -> `text-text-muted`
- `text-blue-600` / `text-blue-800` -> `text-ev-teal-light` / `text-ev-teal`
- `text-[#03b9d2]` (in Header) -> `text-ev-teal-light`

**Borders:**
- `border-gray-200` -> `border-border-light`
- `border-gray-300` -> `border-border-medium`
- `border-gray-100` -> `border-border-light`
- `border-[#e4e2dc]` (in Header) -> `border-border-light`

**Focus rings:**
- `focus:ring-blue-500` -> `focus:ring-ev-teal`

**Interactive states:**
- `bg-gray-900 text-white` (active pill) -> `bg-ev-teal text-white`

**Specific component notes:**

**DirectoryPage.tsx:**
- Main container background comes from `html` base style (surface-secondary), so the page content area works automatically
- Search input: border-border-medium, focus:ring-ev-teal
- Community list container: bg-surface-primary border-border-light
- "Try Again" button: bg-ev-coral

**ThreadPage.tsx:**
- All content area: uses semantic colors
- Reply sticky button (bottom-right): `bg-ev-coral hover:bg-ev-coral-hover` instead of bg-blue-600
- Edit input focus: focus:ring-ev-teal
- Thread metadata text: text-text-muted

**NotFoundPage.tsx:**
- Read file first to see current content, apply same bg/text pattern

**BackNav.tsx:**
- `text-gray-600 hover:text-gray-900` -> `text-text-muted hover:text-text-primary`

**AuthGate.tsx:**
- Disabled textarea: `bg-surface-hover text-text-muted border-border-light`
- Sign in link: `text-ev-teal-light hover:text-ev-teal`
- Disabled button: `bg-surface-hover text-text-muted`
- Container border: `border-border-light`

**ThreadListItem.tsx:**
- `border-gray-100` -> `border-border-light`
- `text-gray-900` -> `text-text-body`
- `text-gray-600` -> `text-text-secondary`
- `text-gray-400` -> `text-text-muted`
- `hover:bg-gray-50` -> `hover:bg-surface-hover`

**ThreadCreateForm.tsx:**
- All `bg-blue-600` buttons -> `bg-ev-coral hover:bg-ev-coral-hover`
- Input borders -> `border-border-medium`
- Focus rings -> `focus:ring-ev-teal`
- Labels -> `text-text-secondary`
- Error text stays `text-red-500` (semantic state color, consistent with EV error token)

**ReplyForm.tsx:**
- Same button/input mapping as ThreadCreateForm
- Submit button: `bg-ev-coral hover:bg-ev-coral-hover`

**ReplyItem.tsx:**
- `border-gray-200` -> `border-border-light`
- Author name `text-gray-900` -> `text-text-body`
- Timestamp `text-gray-400` -> `text-text-muted`
- Body `text-gray-700` -> `text-text-body`
- Edit button `text-gray-400 hover:text-gray-600` -> `text-text-muted hover:text-text-primary`

**EditForm.tsx:**
- Input/textarea borders -> `border-border-medium`
- Focus rings -> `focus:ring-ev-teal`
- Cancel button border -> `border-border-medium`
- Save button -> `bg-ev-coral hover:bg-ev-coral-hover`

**EditHistory.tsx:**
- Toggle link `text-gray-400 hover:text-gray-600` -> `text-text-muted hover:text-text-primary`
- History item bg `bg-gray-50` -> `bg-surface-hover`
- History text `text-gray-600` -> `text-text-secondary`
- Timestamp `text-gray-400` -> `text-text-muted`

**CharCounter.tsx:**
- `text-gray-400` -> `text-text-muted`
- `text-red-500` stays (error semantic)

**AppCrashFallback.tsx:**
- `bg-white` -> `bg-surface-primary`
- `text-gray-800` -> `text-text-body`
- `text-gray-600` -> `text-text-secondary`
- `text-gray-700` -> `text-text-body`
- `bg-gray-100 hover:bg-gray-200` -> `bg-surface-hover hover:bg-surface-secondary`

**App.tsx:**
- No changes needed (just routes + Toaster)

After all replacements, also add a subtle visual polish pass:
- Increase content max-width from `max-w-2xl` to `max-w-3xl` on DirectoryPage, ThreadPage (gives a bit more breathing room)
- Add a subtle `shadow-sm` to the community list container and thread list container for depth
- Stance cards: add `shadow-sm hover:shadow-md transition-shadow` for polish
- Thread list container on CommunityHubPage: add `shadow-sm`
  </action>
  <verify>
Run `cd frontend && npx tsc --noEmit && npx vite build` to confirm everything compiles. Grep the entire frontend/src directory for remaining instances of `bg-blue-600`, `text-gray-900`, `border-gray-200`, `focus:ring-blue-500` to confirm they have been replaced. A few may remain intentionally (e.g., inside Toaster which is a library component).
  </verify>
  <done>
All pages and components use EV brand colors via semantic CSS custom properties. No raw blue-600 or gray-900 hardcoded colors remain in FC code. Dark mode works across every page (Directory, Community Hub, Thread, Not Found). Visual polish (shadows, spacing) applied consistently.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Full brand theme applied across the Focused Communities frontend:
    1. Vertical stance layout with shuffle button
    2. Dark mode toggle in header (persists to localStorage)
    3. EV brand colors (teal, coral, yellow) throughout
    4. Manrope font loaded and applied
    5. Visual polish (shadows, spacing, transitions)
  </what-built>
  <how-to-verify>
    1. Start dev server: `cd frontend && npm run dev`
    2. Navigate to a community page (e.g., /communities/some-slug)
    3. Verify stances are stacked VERTICALLY in a single column (not a grid)
    4. Click the "Shuffle" button -- stances should reorder randomly
    5. Confirm NO numbers (1-5) appear anywhere on or near stance cards
    6. Check header: brand name should be teal, there should be a sun/moon dark mode toggle
    7. Click the dark mode toggle -- entire page should switch to dark theme with dark teal backgrounds
    8. Toggle back to light mode -- should return to light theme
    9. Reload page -- dark mode preference should persist
    10. Check the Directory page (/communities) -- brand colors applied, search input has teal focus ring
    11. Check a thread page -- coral Reply button, teal focus rings, proper dark mode
    12. Check overall feel: Manrope font visible (geometric, rounded letterforms), shadows on cards, smooth transitions
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues with colors, layout, dark mode, or visual polish</resume-signal>
</task>

</tasks>

<verification>
- `cd frontend && npx tsc --noEmit` passes with no errors
- `cd frontend && npx vite build` produces successful production build
- No instances of `bg-blue-600` remain in `frontend/src/**/*.tsx` (replaced by ev-coral)
- No stance numbers (1-5) visible in any rendered output
- Dark mode toggle adds/removes `.dark` class on `<html>`
- localStorage key `fc-theme` persists user preference
- Shuffle button re-randomizes stance order without network request
</verification>

<success_criteria>
- Stances render in a vertical single-column layout
- Shuffle button randomizes stance order on click, no numbers shown
- EV brand colors (coral, teal, yellow) used throughout instead of generic blue/gray
- Manrope font loaded and applied to all text
- Dark mode toggle in header works, persists preference, all pages render correctly in both modes
- Production build succeeds with no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/001-stack-stances-vertically-add-a-reset-fli/001-SUMMARY.md`
</output>
