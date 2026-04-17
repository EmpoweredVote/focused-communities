# Compass Integration Spec

**Version:** 1.0
**Date:** 2026-04-17
**Owner:** Focused Communities team
**Status:** Ready for Compass team implementation

---

## 1. Overview

Each spoke in the Empowered Compass UI maps to a Focused Communities community hub. When a user taps a Compass spoke, they navigate directly to the corresponding FC hub where they can read all five stances and engage in structured debate.

FC community hubs are the deliberation home for every Compass topic. The mapping is maintained by FC and is stable — slugs do not change after initial assignment.

---

## 2. Hub URL Pattern

Every FC community hub is accessible at:

```
https://fc.empowered.vote/communities/{slug}
```

**Slug properties:**

- Stable — slugs are assigned at community creation and never change
- URL-safe — no special characters, no encoding required
- Lowercase — all slugs are lowercase ASCII
- Hyphenated — multi-word slugs use hyphens (e.g., `minimum-wage`)
- Human-readable — the slug approximates the topic name

**Examples:**

```
https://fc.empowered.vote/communities/minimum-wage
https://fc.empowered.vote/communities/gun-control
https://fc.empowered.vote/communities/climate-change
```

---

## 3. Topic-to-Slug Mapping

The table below maps every seeded FC community to its Compass topic ID and hub URL.

> **Note:** Communities were seeded directly into the production database. The table below must be populated by running the following query against the production Supabase instance (project `kxsdzaojfaibhuzmclfq`):
>
> ```sql
> SELECT id, slug, name, topic_id
> FROM connect.communities
> ORDER BY name;
> ```

| Community Name | Slug | Hub URL | Topic ID (UUID) |
|----------------|------|---------|-----------------|
| [FILL FROM PRODUCTION DB] | [FILL FROM PRODUCTION DB] | https://fc.empowered.vote/communities/[slug] | [FILL FROM PRODUCTION DB] |

**To populate this table:** Run the SQL above against the production database and replace each placeholder row with real data. One row per community. The `topic_id` column links directly to the `inform.compass_stances` rows that drive the spoke content.

---

## 4. Integration Instructions

### On Spoke Tap

When a user taps a Compass spoke, navigate to the corresponding hub URL:

```
https://fc.empowered.vote/communities/{slug}
```

Where `{slug}` is looked up from the mapping table above using the spoke's `topic_id`.

### Navigation Behavior

- **Same tab or new tab:** At the Compass team's discretion based on UX context. Both work correctly — FC hub pages are fully self-contained and do not require referrer context.
- **No query parameters needed:** FC does not require any query params to display the hub. The slug alone is sufficient.
- **No authentication coordination:** FC handles auth independently. Unauthenticated users can read all content; auth is only required for posting.

### Lookup Implementation

The Compass client should maintain a local lookup table (topic_id → slug) built from the mapping table above. This avoids a round-trip to FC on every spoke render.

```javascript
// Example lookup (Compass client pseudocode)
const FC_SLUG_MAP = {
  "uuid-for-topic-1": "minimum-wage",
  "uuid-for-topic-2": "gun-control",
  // ... all topic_id → slug pairs from mapping table
};

function onSpokeTap(topicId) {
  const slug = FC_SLUG_MAP[topicId];
  if (slug) {
    navigate(`https://fc.empowered.vote/communities/${slug}`);
  }
}
```

---

## 5. Fallback Behavior

**Invalid slug:** If an unrecognized slug is navigated to (e.g., mapping table is stale), FC returns its standard `NotFoundPage` — a client-side 404 that does not return an HTTP error status from the server. The page displays a "not found" message and links back to the FC directory (`/communities`).

**No FC error reporting to Compass:** FC does not signal back to Compass that a slug was invalid. The Compass team should maintain a fresh copy of the mapping table and update it when FC adds new communities.

**Mapping updates:** FC will notify the Compass team when new communities are added (and thus new spokes need wiring). Slugs of existing communities will not change.

---

## 6. Contact

For questions about the mapping or to request a mapping update, contact the Focused Communities team.
