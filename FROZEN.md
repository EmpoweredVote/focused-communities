# The backend in `src/` is frozen

The Focused Communities API now lives in the accounts engine:
**`EmpoweredVote/ev-accounts` → `backend/src/focused_communities/`**, served by
`ev-accounts-api` at `https://accounts-api.empowered.vote/fc/api/...` (same paths as before,
with `/fc` in front). That copy is canonical. Change API code there, not here.

Why: this backend was a $7/month always-on Render server for a request/reply API with no
timers, no live connections and no files. Folding it into the engine removes that server, the
second copy of the login check, and the broad service-role key it used (the engine module uses a
role limited to the five tables it needs — migration CA_0323 in ev-accounts).

`src/` stays in this repo, unchanged, as the rollback path until the old Render service is
deleted. **The frontend in `frontend/` is still active** and stays here.

## Cutover (founder steps, in order)

Do the ev-accounts steps first (its `backend/src/focused_communities/README.md`): apply
CA_0323, set the role password, set `FOCUSED_COMMUNITIES_DATABASE_URL` and add
`https://fc.empowered.vote` to `CORS_ORIGIN` on `ev-accounts-api`, deploy, and check
`https://accounts-api.empowered.vote/fc/api/communities` returns the communities.

Then, in Render:

1. **New → Static Site** from this repo, branch `master`:
   - Build command: `cd frontend && npm ci && npm run build`
   - Publish directory: `frontend/dist`
   - Environment: `VITE_API_BASE_URL=https://accounts-api.empowered.vote/fc`
   - Redirects/Rewrites: **Rewrite** `/*` → `/index.html` (the app's own routes, such as
     `/communities/<slug>`, must load the app rather than 404)
   - Build filter (optional): `frontend/**`
2. Open the new site's `onrender.com` URL and check a community page and its stances load.
   (Writes need the custom domain, because the engine's CORS list names `fc.empowered.vote`.)
3. Move the custom domain `fc.empowered.vote` from the old web service to the static site.
   Route 53 already points at Render, so normally no DNS change is needed; Render shows the
   record if it wants one.
4. Check `https://fc.empowered.vote` signed out (communities, stances) and signed in (post a
   reply, edit it, see the edit history).
5. **Suspend** the old `focused-communities` web service. Saves $7/month.

Rollback: move `fc.empowered.vote` back to the old web service and resume it. Nothing in the
database changes during the cutover, so rolling back loses nothing.
