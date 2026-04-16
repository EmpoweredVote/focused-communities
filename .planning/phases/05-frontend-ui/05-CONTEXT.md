# Phase 5: Frontend UI - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The complete v1 user-facing experience — community directory, community hub (with stance cards and thread list), thread page (flat replies), write forms, and session management. All built as Framer-compatible React components using absolute `/api/*` URLs. No direct Supabase queries from the frontend.

</domain>

<decisions>
## Implementation Decisions

### Build Pipeline
- Workflow: Figma design → Claude builds React components (using ui-ux-pro-max skill) → deployed in Framer
- All pages are built by Claude based on Figma models — design precedes build
- Components use absolute `/api/*` URLs (self-contained, no direct Supabase client)
- No Supabase Realtime in v1; use React Query `refetchInterval` polling instead

### Stance Card Design
- Responsive grid layout: 1-column mobile → 2-column tablet → 5-column wide desktop
- Full stance text always visible — no truncation, no "read more" link
- All 5 cards are identical in visual style — no color differentiation, no spectrum tinting, no numbering
- Stances are NEVER labeled with numbers (1-5) in any user-facing context; order is randomized per display
- Card content: stance text (headline) + expandable deeper description + example perspectives
- Expandable inline: click expands the card in place, pushing layout below it down; other cards stay collapsed
- Authenticated user's own calibrated stance: soft visual highlight (background tint or border) only — no label like "Your stance"
- Clicking a card only expands it — no thread filtering side effect

### Stance Content Dependency
- Each stance card requires three content layers: (1) short stance text (exists in `inform.compass_stances.text`), (2) deeper description, (3) example perspectives
- Content layers 2 and 3 do NOT yet exist in the schema — **Phase 4.5 must be inserted before Phase 5** to extend `inform.compass_stances` with these fields and author content for each stance on each topic
- Phase 5 builds against the richer schema delivered by Phase 4.5

### Directory Layout
- Community listings: card list (full-width rows, not a grid)
- Each community card shows: community name, topic description, and (for authenticated users) a subtle indicator of their calibrated stance alignment for that topic
- No member count or thread count on directory cards
- Keyword filter at top of directory

### Community Hub Layout
- Page order: topic header → stance cards → thread list
- Header includes: topic name + short description, community-specific context/intro paragraph, breadcrumb back to directory
- No "Start thread" CTA in the header area (CTA appears within the thread list section)
- Stances-first reinforces "Inform before Engage" — users understand the perspectives before entering discussion

### Thread List
- Thread list items show: title + excerpt, author pseudonym, relative timestamp, reply count
- Default sort: most recent activity; user can switch to newest-first via a sort control
- Empty state: simple message + Start Thread CTA (auth-gated)

### Thread Page (Reply Display)
- Flat chronological list; no nesting
- Visual separation: divider lines between replies (not card-per-reply, not alternating backgrounds)
- Reply form placement: sticky shortcut button at bottom of viewport + full form below the reply list (both present)

### Auth Gate
- Unauthenticated write form: visible but disabled (greyed out), tooltip appears on hover explaining Connected Account requirement
- Sign-in trigger: opens in new tab, preserving the current hub/thread page
- Matches existing `apiFetch` 401 behavior (`window.open(..., '_blank')`)

### Write UX
- Post submission: optimistic update — new post appears immediately at bottom of thread, rolled back with error message if API fails
- `connected_no_compass` users pass through auth gate — calibration is NOT a write gate

### Edit History
- Edited posts show a visible "edited" indicator (exact design: Claude's discretion)
- Full version history is publicly expandable on the post (exact diff UI: Claude's discretion)
- Edit form replaces the post body inline — not a separate page

### Session Management
- Expiry detection: apiFetch 401 response opens sign-in in new tab (existing pattern)
- Draft preservation: localStorage saves draft content before redirect/expiry
- URL-based scroll position tracking (Claude's discretion on implementation approach)

### Claude's Discretion
- Exact color palette, typography, and spacing (will follow Figma designs from Phase 4.5 / design phase)
- Loading skeleton design for all async content
- Exact "edited" indicator styling (badge, asterisk, or label)
- Edit history diff presentation (side-by-side vs before/after stacked)
- Session expiry UX beyond the core new-tab redirect
- Tooltip copy for auth gate

</decisions>

<specifics>
## Specific Ideas

- "Inform before Engage" is the guiding principle — stances always appear before the thread list on the hub page
- Stance stances describe **objective policy outcomes**, not subjective appeal — this must not be undermined by the visual design
- The stance model from EV-CompassV2 is the reference: stances are bespoke text statements, randomly ordered per display, with internal `value` (1–5) that is never user-visible
- Build pipeline mirrors existing EV pages: Figma first, then Claude builds with ui-ux-pro-max skill

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
