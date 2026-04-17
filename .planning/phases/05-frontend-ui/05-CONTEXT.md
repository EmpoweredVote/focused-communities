# Phase 5: Frontend UI - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The complete v1 user-facing experience — community directory, community hub (with stance cards and thread list), thread page (flat replies), write forms, and session management. Built as a standalone React/Vite app with React Router, deployed independently. No direct Supabase queries from the frontend; all data via `/api/*` endpoints.

</domain>

<decisions>
## Implementation Decisions

### Build Pipeline
- **Standalone React/Vite app** — not Framer. Full React app with its own router, deployed independently on Render (or Vercel/Netlify static build).
- Claude builds all components directly (using ui-ux-pro-max skill for design execution)
- All pages use absolute `/api/*` URLs — no direct Supabase client in frontend code
- No Supabase Realtime in v1; use React Query `refetchInterval` polling instead

### URL Structure
- Directory: `/communities`
- Community hub: `/communities/:slug` (human-readable slug, e.g. `/communities/minimum-wage`)
- Thread page: `/communities/:slug/threads/:id`
- Community slug stored as a column in the `communities` table — schema migration required (not derived at runtime)

### Navigation
- Back navigation: back chevron with parent page name (`← Communities`, `← Minimum Wage`)
- No full breadcrumb trail — 3-level hierarchy is shallow enough for a simple chevron

### Stance Card Design
- Responsive grid layout: 1-column mobile → 2-column tablet → 5-column wide desktop
- Full stance text always visible — no truncation, no "read more" link
- All 5 cards are identical in visual style — no color differentiation, no spectrum tinting, no numbering
- Stances are NEVER labeled with numbers (1-5) in any user-facing context; order is randomized per display
- Card content: stance text (headline) + expandable deeper description + example perspectives
- Expandable inline: click expands the card in place, pushing layout below it down; other cards stay collapsed
- Auto-scroll to card top on expand — ensures expanded content is always in view after clicking
- Desktop (5-column): expanded card is capped at max height with internal scroll — keeps grid layout stable
- Mobile (1-column): card grows unbounded — full width, user is already scrolling
- Example perspectives shown as a bulleted list of short first-person quotes (2-3 items)
- Authenticated user's calibrated stance: soft visual highlight (background tint or border) — persists even when expanded; no "Your stance" label or extra copy inside the card
- Clicking a card only expands it — no thread filtering side effect

### Directory Layout
- Community listings: card list (full-width rows, not a grid)
- Each community card shows: community name, topic description, and (for authenticated users) a subtle indicator of their calibrated stance alignment for that topic
- No member count or thread count on directory cards
- Keyword filter at top of directory

### Community Hub Layout
- Page order: topic header → stance cards → thread list
- Header includes: topic name + short description, community-specific context/intro paragraph, breadcrumb back to directory
- No "Start Thread" CTA in the header area (CTA appears within the thread list section)
- Stances-first reinforces "Inform before Engage" — users understand the perspectives before entering discussion

### Thread List
- Thread list items show: title + excerpt, author pseudonym, relative timestamp, reply count
- Default sort: most recent activity; user can switch to newest-first via a sort control
- Empty state: simple message + Start Thread CTA (auth-gated)

### Thread Page (Reply Display)
- Flat chronological list; no nesting
- Visual separation: divider lines between replies (not card-per-reply, not alternating backgrounds)
- Reply form placement: sticky shortcut button at bottom of viewport + full form below the reply list (both present)

### Thread Creation Form
- Both title AND body are required (no body-optional threads)
- Character limits: title 150 chars, body 2000 chars
- Live character counter on both fields while typing, turns red when nearing limit (~90% full)
- No counter shown on empty fields — don't feel punishing before the user has typed anything
- After successful thread creation: redirect to the new thread page (not stay on hub)

### Auth Gate
- Unauthenticated write form: visible but disabled (greyed out), tooltip appears on hover explaining Connected Account requirement
- Sign-in trigger: opens in new tab, preserving the current hub/thread page
- Matches existing `apiFetch` 401 behavior (`window.open(..., '_blank')`)
- `connected_no_compass` users pass through auth gate — calibration is NOT a write gate

### Write UX
- Post submission: optimistic update — new reply appears immediately at bottom of thread, rolled back with toast notification if API fails
- Toast pattern for write failures: "Couldn't post. Try again." — brief, non-disruptive, consistent
- Thread creation redirects to new thread page on success (not optimistic insert into hub thread list)

### Edit History
- Edited posts show a visible "edited" indicator (exact design: Claude's discretion)
- Full version history is publicly expandable on the post (exact diff UI: Claude's discretion)
- Edit form replaces the post body inline — not a separate page

### Loading States
- Page-level content loads (directory, hub, thread list, thread page): skeleton screens
- Form submissions and small async actions (posting a reply, loading more): spinner
- Skeleton placeholder shapes match eventual content layout

### Error States
- API call failures (e.g. thread list fails to load): inline error message within the affected section + "Try Again" button
- The rest of the page stays usable — partial failure doesn't take down the whole page
- Optimistic write failures: toast notification with rollback (see Write UX above)
- Top-level app crash (unhandled): full-page "Something went wrong" with a reload button

### Session Management
- Expiry detection: `apiFetch` 401 response opens sign-in in new tab (existing pattern)
- Draft preservation: localStorage saves draft content before redirect/expiry
- URL-based scroll position tracking (Claude's discretion on implementation approach)

### Claude's Discretion
- Exact color palette, typography, and spacing
- Loading skeleton shape and timing details
- Exact "edited" indicator styling (badge, asterisk, or label)
- Edit history diff presentation (side-by-side vs before/after stacked)
- Session expiry UX beyond the core new-tab redirect
- Tooltip copy for auth gate
- Toast component design and positioning

</decisions>

<specifics>
## Specific Ideas

- "Inform before Engage" is the guiding principle — stances always appear before the thread list on the hub page
- Stance cards describe **objective policy outcomes**, not subjective appeal — visual design must not undermine this
- The stance model from EV-CompassV2 is the reference: stances are bespoke text statements, randomly ordered per display, with internal `value` (1–5) that is never user-visible
- Slugs for communities are stored (not runtime-derived) — researcher needs to flag schema gap for `slug` column in `communities` table

</specifics>

<deferred>
## Deferred Ideas

- **Stance → thread filtering**: Clicking a stance card to filter the thread list to stance-aligned threads — noted for a future enhancement phase
- **Member count / activity count on directory cards**: Excluded from v1 directory card to keep it simple; candidate for future iteration
- **Side-by-side hub layout** (stances left column, threads right): Considered for desktop; deferred in favor of vertical stack in v1

</deferred>

---

*Phase: 05-frontend-ui*
*Context gathered: 2026-04-16*
