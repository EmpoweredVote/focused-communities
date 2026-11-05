# Focused Communities — project notes for Claude

## Real data, current code (read before building UI)

Volunteers and designers: build on live public data, never on invented data. Invented data in a
component becomes rework for whoever merges the PR.

- **`npm run dev` in `frontend/` with no `.env` reads the live public API** through the dev server's `/api` proxy (`frontend/vite.config.ts`, target the accounts engine's `/fc/api`). No keys and no local backend. **The backend in `src/` is frozen** — it now lives in `ev-accounts/backend/src/focused_communities/` (see `FROZEN.md`); change API code there, not here.
- **Fetch through `frontend/src/lib/apiFetch.ts` (the hooks in `frontend/src/hooks/`).** Never type real-looking names, numbers, dates, quotes or IDs into a
  component, not even as placeholders. Interface copy is fine.
- **If a request fails, say so and stop.** Report the URL and status. Do not swap in invented data.
- **Data the API does not serve yet** goes in one module under `frontend/src/mocks/`, shaped like the
  response, starting with `// Stands in for: GET /api/<route> — not yet served by the API`. List it
  in the PR under "Data this needs from the API".
- **Locally you are signed out, and silently** (corrected 2026-11-05). This note used to promise a
  failed or 401 `/api/auth/session` call in the console. Nothing calls that route. The auth call is
  `GET /api/account/me` against the accounts engine, and `detectUserState()` returns early when
  there is no `ev_token` in localStorage — so signed out, no auth request is made and there is no
  console error to look for.
  Account and user data is off-limits for design work; mock signed-in states under `frontend/src/mocks/`.
- **Production has no threads yet.** `VITE_DEMO_THREADS=1 npm run dev` serves the synthetic threads in
  `frontend/src/mocks/demoThreads.ts` (every author is a "Demo" pseudonym; writes are off). Communities
  and stances stay live. Extend that file rather than hardcoding posts in components.
- **The argument-tree API is live; production's trees are empty** (checked 2026-11-04).
  `GET /api/communities/:id/claims/root` and `/claims/shape` both answer 200 against the live API —
  the earlier note here said they 404, which stopped being true when `feat/fc-claims-api` shipped.
  What production has is a bare root claim per community and no children: `shape` returns one node
  with `completeThroughDepth: null`, so the argument band and its map render but hold nothing.
  `VITE_DEMO_CLAIMS=1 npm run dev` serves the synthetic tree in `frontend/src/mocks/demoClaims.ts`
  (dev only; writes are off on claim routes only, so threads keep working). Reach for it to see a
  tree with depth, and with the merged and removed states production cannot show you yet — not
  because the API is missing. Extend that file rather than hardcoding claims in components.
- **Start from current `master`:** `git fetch origin && git switch -c <branch> origin/master`.
  The default branch is `master`; there is no `main`, so `origin/main` fails.

`@empoweredvote/ev-ui` is the shared component library and is published to npm, but **this repo
does not depend on it yet** — nothing in `frontend/` imports it, so the import does not resolve
today (corrected 2026-11-05; this note used to read as though it did). Prefer adding the package
to hand-restyling something it already provides.

The `ev-designer` skill in EmpoweredVote/ev-ui (`plugins/ev-designer/`) has the index of public
routes with sample responses, and is useful either way.
