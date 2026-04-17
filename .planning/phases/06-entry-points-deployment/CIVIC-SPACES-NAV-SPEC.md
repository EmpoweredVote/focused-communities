# Civic Spaces Nav Link Spec

**Version:** 1.0
**Date:** 2026-04-17
**Owner:** Focused Communities team
**Status:** Ready for Civic Spaces team implementation

---

## 1. Overview

Focused Communities (FC) is added to the Civic Spaces navigation bar as a first-class EV product link. The goal is product discoverability: users browsing Civic Spaces can navigate directly to FC to engage in structured, compass-driven debate on the same civic topics.

This spec covers the v1 nav addition only — a single static link to the FC directory. Contextual per-topic links (e.g., a Civic Spaces topic page linking directly to its corresponding FC community hub) are explicitly deferred and covered in section 4.

---

## 2. Nav Link Specification

| Property | Value |
|----------|-------|
| **URL** | `https://fc.empowered.vote` |
| **Link text** | `Focused Communities` |
| **Short label (mobile/narrow)** | `FC` |
| **Link destination** | FC directory (lists all community hubs) |
| **Opens in** | Same tab (standard nav behavior) |
| **Auth required** | No — FC directory is public |

### Link Markup (reference)

```html
<a href="https://fc.empowered.vote">Focused Communities</a>
```

On narrow viewports where abbreviated labels are used, `FC` is the accepted short form.

---

## 3. Placement

- **Location:** Main navigation bar alongside other EV product links (e.g., Compass, Accounts)
- **Visual treatment:** Same style as other product nav links — no special styling, no badge, no "new" indicator
- **Ordering:** At the Civic Spaces team's discretion; no required position relative to other links
- **Responsive behavior:** Follow existing Civic Spaces nav responsive patterns (collapse to hamburger menu, drawer, etc.)

---

## 4. Future: Contextual Per-Topic Links (Deferred)

When the Civic Spaces team is ready to add contextual links — for example, a "Discuss this in Focused Communities" button on individual topic pages — the Compass integration spec contains the full topic-to-slug mapping needed to construct the correct FC hub URL:

```
https://fc.empowered.vote/communities/{slug}
```

The mapping document is maintained by the FC team and will be updated as new communities are added.

This contextual linking is a future enhancement and is not part of the v1 nav spec. The single directory link (section 2) is the complete v1 deliverable.

---

## 5. Auth Coordination

None required.

FC handles authentication independently. Users who are not logged into FC will see read-only content; FC presents its own auth prompt when write actions are attempted. Civic Spaces does not need to pass any auth tokens or session information to FC.

There is no SSO requirement for this nav link. It behaves like any external link to another EV product.

---

## 6. Contact

For questions or to coordinate the contextual link rollout (when ready), contact the Focused Communities team.
