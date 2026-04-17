# Compass Integration Spec

**Version:** 1.1
**Date:** 2026-04-17
**Owner:** Focused Communities team
**Status:** Updated following Compass team review — two critical items resolved

---

## 1. Overview

Focused Communities (FC) provides a deliberation hub for each Compass topic. This spec defines how the Compass client surfaces a link to the corresponding FC hub for topics that have one.

**Key design decisions from spec review:**

- FC links surface inside the **LibraryDrawer** (not on spoke tap) to avoid conflicting with existing spoke-tap behaviors (calibration overlay for unanswered spokes, LibraryDrawer open for answered spokes)
- The UUID-to-slug bridge lives on the **Compass backend** (`fc_community_slug` added to the topic response) — the client never handles raw UUIDs
- Topics with no FC community: FC link is simply **absent** — no fallback needed on the client
- FC links open in a **new tab** — Compass is a stateful SPA and navigation away would lose calibration/comparison state

---

## 2. Hub URL Pattern

Every FC community hub is accessible at:

```
https://fc.empowered.vote/communities/{slug}
```

**Slug properties:**

- Stable — slugs are assigned at community creation and never change
- URL-safe, lowercase, hyphenated (e.g., `immigration-and-treatment`)
- No query parameters needed — the slug alone is sufficient

---

## 3. Topic-to-Slug Mapping (Server-Side)

FC communities currently map to 5 Compass topics. This mapping is maintained by the FC team and communicated via this spec when new communities are added.

**The mapping lives on the Compass backend** — stored at seed/deploy time, not fetched at runtime from FC. The Compass API enriches its `GET /api/compass/topics` response with a `fc_community_slug` field (see Section 4).

| Community Name | FC Slug | FC Hub URL | FC Topic UUID |
|----------------|---------|-----------|---------------|
| Artificial Intelligence Oversight | `ai-oversight` | https://fc.empowered.vote/communities/ai-oversight | `666bf03d-81fc-4138-ab15-69ae734c9023` |
| Criminalization of Homelessness | `criminalization-of-homelessness` | https://fc.empowered.vote/communities/criminalization-of-homelessness | `4938766b-b45a-46e3-93bd-b8b30651271a` |
| Immigration & Treatment of Immigrants | `immigration-and-treatment` | https://fc.empowered.vote/communities/immigration-and-treatment | `4e2c69ce-591e-4197-9cd5-7aceff79d390` |
| School Vouchers & Public Education Funding | `school-vouchers-education` | https://fc.empowered.vote/communities/school-vouchers-education | `00b95a6a-75db-4521-b523-3326bba938de` |
| Taxation & Government Spending | `taxation-and-spending` | https://fc.empowered.vote/communities/taxation-and-spending | `45ca4740-a861-4c8c-b3b5-0a49cf953501` |

**Topics not in this table have no FC community.** The FC link is absent for those topics — see Section 5.

**Mapping updates:** FC will notify the Compass team when new communities are added. Slugs of existing communities will not change.

---

## 4. Integration Instructions

### 4.1 Compass backend change (required)

Add `fc_community_slug` to the `GET /api/compass/topics` response:

```json
{
  "id": 42,
  "name": "Immigration & Treatment of Immigrants",
  "fc_community_slug": "immigration-and-treatment"
}
```

For topics with no FC community, return `null`:

```json
{
  "id": 99,
  "name": "Some Other Topic",
  "fc_community_slug": null
}
```

The Compass backend should store the `topic_id → slug` mapping from Section 3 at seed/deploy time. The client reads `topic.fc_community_slug` and never handles UUIDs.

### 4.2 Where the FC link surfaces

**Recommended placement: inside the LibraryDrawer**

Adding the FC link to spoke tap directly conflicts with existing spoke-tap behavior:
- Unanswered spoke → opens calibration overlay
- Answered spoke → opens LibraryDrawer

The least disruptive and most logical placement is a **"Discuss on Focused Communities →"** button or link inside the LibraryDrawer, shown when `topic.fc_community_slug` is non-null.

Suggested UI:

```
┌─────────────────────────────────┐
│  LibraryDrawer                  │
│  ─────────────────────────────  │
│  [stance content]               │
│                                 │
│  Discuss on Focused Communities →│  ← shown only when fc_community_slug is set
└─────────────────────────────────┘
```

Alternative placements (Compass UX team's call):
- A dedicated icon/badge on the spoke itself
- A button on the topic detail view

### 4.3 Navigation behavior

**Open FC in a new tab.** Compass is a stateful SPA — navigating away in the same tab would lose calibration and comparison state.

```javascript
// Compass client pseudocode
function renderFCLink(topic) {
  if (!topic.fc_community_slug) return null;

  return (
    <a
      href={`https://fc.empowered.vote/communities/${topic.fc_community_slug}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Discuss on Focused Communities →
    </a>
  );
}
```

No query parameters needed. FC handles auth independently — unauthenticated users can read all content; auth is only required for posting.

---

## 5. Behavior for Unmapped Topics

When `topic.fc_community_slug` is `null`, **do not render an FC link**. There is nothing to link to.

No fallback URL, no disabled state, no placeholder — simply omit the element. This is the expected state for the majority of Compass topics in v1.

---

## 6. Fallback for Stale Slugs

If a slug is ever invalid (e.g., a mapping was recorded incorrectly), FC returns a client-side 404 page with a link back to the FC directory. This should not occur in practice — slugs are stable and the Compass backend controls when they're written.

---

## 7. Contact

For mapping updates or questions, contact the Focused Communities team. FC will proactively notify the Compass team when new communities are added so the backend mapping can be updated.
