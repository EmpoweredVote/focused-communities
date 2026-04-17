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
| Artificial Intelligence Oversight | `ai-oversight` | https://fc.empowered.vote/communities/ai-oversight | `666bf03d-81fc-4138-ab15-69ae734c9023` |
| Criminalization of Homelessness | `criminalization-of-homelessness` | https://fc.empowered.vote/communities/criminalization-of-homelessness | `4938766b-b45a-46e3-93bd-b8b30651271a` |
| Immigration & Treatment of Immigrants | `immigration-and-treatment` | https://fc.empowered.vote/communities/immigration-and-treatment | `4e2c69ce-591e-4197-9cd5-7aceff79d390` |
| School Vouchers & Public Education Funding | `school-vouchers-education` | https://fc.empowered.vote/communities/school-vouchers-education | `00b95a6a-75db-4521-b523-3326bba938de` |
| Taxation & Government Spending | `taxation-and-spending` | https://fc.empowered.vote/communities/taxation-and-spending | `45ca4740-a861-4c8c-b3b5-0a49cf953501` |

The `topic_id` column links directly to the `inform.compass_stances` rows that drive the spoke content.

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
  "666bf03d-81fc-4138-ab15-69ae734c9023": "ai-oversight",
  "4938766b-b45a-46e3-93bd-b8b30651271a": "criminalization-of-homelessness",
  "4e2c69ce-591e-4197-9cd5-7aceff79d390": "immigration-and-treatment",
  "00b95a6a-75db-4521-b523-3326bba938de": "school-vouchers-education",
  "45ca4740-a861-4c8c-b3b5-0a49cf953501": "taxation-and-spending",
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
