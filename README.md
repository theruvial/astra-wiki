# Aboard the Astra — Mechanics Wiki (frontend)

The Wiki-style static website for *Aboard the Astra*, listing the actual
game mechanics — star map / FTL travel, the Forger chase, ship combat,
ground combat, damage control, ship systems, crew, economy, dialogue/Ink,
boons & burdens, spoils, and a Work in progress / placeholders page — with
their numbers where the repo states them, and a status on each one:
**Implemented** (code/tests present), **Designed** (doc-only), **Locked**
(story locks), **In transition** (being removed/renamed),
**Conflict** (two repo sources disagree), or **WIP** (merged / written
but unfinished, or standing in with placeholder numbers, icons or art).

**Repo: `theruvial/astra-wiki`**
Live site (once deployed): **https://theruvial.github.io/astra-wiki/**

**This repo holds NO game files and NO backend code.** It is the frontend
only. The game itself lives in `egamI-rorriM/Aboard-the-Astra---Remake`
(do not copy game files in here), and the numbers are served live by the
separate wiki backend (see below).

## How the numbers get here

- The hand-written wiki pages (`index.html`) cite their sources by file
  path. They were snapshotted from the game repo's `main` @ `e8824e89`
  (2026-11-05); the WIP page covers main up to `58f90483`.
- The numbers in the **Generated numbers** section are **not** in this
  repo as a live source. `app.js` fetches them from the backend:
  `GET <API base>/api/mechanics`.
- If the backend is unreachable, the page falls back to the bundled
  snapshot in `data/mechanics.snapshot.json` (2026-11-05) and shows a
  visible **"Snapshot data — backend unreachable"** note at the top of
  the article and in the Generated numbers section, so readers are never
  misled into thinking stale data is live.

## Pointing it at a backend

Edit **`config.js`** — one line:

```js
window.ASTRA_WIKI_API = "https://api.theruvial.com"; // deployed backend
// window.ASTRA_WIKI_API = "http://localhost:13382"; // local dev
```

That is the only place the backend URL lives. The backend's CORS
(`FRONTEND_ORIGIN`) must allow this site's origin:
`https://theruvial.github.io`.

## Deploy to GitHub Pages

1. Create the repo **`theruvial/astra-wiki`** (public — GitHub Pages on a
   free account needs a public repo for a public site) and push this
   directory's contents to its default branch.
2. Repo → **Settings → Pages**.
3. **Build and deployment → Source: Deploy from a branch.**
4. **Branch: `main` (or your default branch), folder: `/ (root)`** —
   `index.html` is at the repo root, so the site is served from
   `https://theruvial.github.io/astra-wiki/`.
   (If GitHub ever serves a Jekyll build error, the empty `.nojekyll`
   file in this repo already disables Jekyll.)
5. Set `config.js` to the deployed backend URL (above) and push — Pages
   rebuilds automatically.

Alternatively, serve this folder from any static host — it is plain
HTML/CSS/JS, no build step, no dependencies. Search is client-side.

## Style

Styled after classic game wikis (Wikipedia / Bulbapedia): light theme
available, **dark mode is the default**, with a toggle directly next to
the search bar in the top bar on every page; the choice persists in
`localStorage`. Left sidebar, top tabs, right infobox, Contents box,
blue section headings.

## Files

- `index.html` — the wiki (all pages are sections of this one article).
- `style.css` — Wikipedia/Bulbapedia styling + dark mode.
- `app.js` — search, theme toggle, and the backend/snapshot numbers loader.
- `config.js` — **the backend URL (edit this one line to deploy).**
- `data/mechanics.snapshot.json` — bundled fallback numbers (2026-11-05).
- `generated.md` — human-readable generated summary from that snapshot.
- `.nojekyll` — disables Jekyll on GitHub Pages.
