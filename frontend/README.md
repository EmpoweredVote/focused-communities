# Focused Communities — frontend

Vite + React + TypeScript. The API lives in the `ev-accounts` engine, not in this repo.

## Read this first

**[`../CLAUDE.md`](../CLAUDE.md) is the one that matters**, and it is short. It carries the rule
this project is strictest about: build on live public data, never on invented data. Typing a
plausible-looking name, number, date, quote or ID into a component is the thing most likely to
get a PR sent back.

## Run it

```sh
npm install
npm run dev
```

With no `.env` that reads the **live public API** through the dev proxy in `vite.config.ts`
(`/api` and `/compass-api` both target the accounts engine). No keys, no local backend.

You are **signed out** locally. A failed or 401 `/api/auth/session` in the console is expected,
and account data is off-limits for design work.

## When production has nothing to show

Two opt-in flags, dev only, writes off. Both are documented in `../CLAUDE.md`; the short version:

| flag | why |
| --- | --- |
| `VITE_DEMO_THREADS=1 npm run dev` | production has no threads yet |
| `VITE_DEMO_CLAIMS=1 npm run dev` | the claims API *is* live, but every community has a bare root claim and no children — this is the only way to see a tree with depth, and the merged and removed states |

Communities, stances and seasons stay live under both. Extend the modules in `src/mocks/` rather
than hardcoding data into a component.

## Checks

```sh
npm test        # vitest
npm run lint    # eslint
npm run build   # tsc -b && vite build
```

All three run in CI on every PR, and the lint baseline is **zero errors** — anything eslint
reports is yours. (It used to report 3 long-standing ones, which is why it was not gated; they
are fixed.)

Two guards are easy to trip and worth knowing about:

- `src/index.contrast.test.ts` measures the colour tokens in `index.css`, including against the
  minimap's composited lane. Move a token and it tells you what it broke.
- `eslint.config.js` rejects an unprefixed `text-ev-teal-light`, which is 2.49:1 on white. Use
  `text-link`, or scope it with `dark:`.

## Branching

```sh
git fetch origin && git switch -c <branch> origin/master
```

The default branch is `master`. There is no `main`.

Use [`@empoweredvote/ev-ui`](https://github.com/EmpoweredVote/ev-ui) components rather than
copying or restyling them. The `ev-designer` skill there indexes the public routes with sample
responses.
