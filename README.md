# chord-me

Local, login-free chord sheet manager. A small app that stores a reusable chord catalog, 
songs with multiple versions, and per-version print formatting — while keeping the same printed output.

Personal, single-user, never hosted.

## Stack

React 18 + Vite client, Express + better-sqlite3 server, TypeScript throughout, Vitest
for tests.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (`http://127.0.0.1:5173`). The API runs on
`http://127.0.0.1:3001`; the dev server proxies `/api` to it. Migrations apply and the
chord catalog seeds itself automatically on first run — no setup step beyond `npm install`.

```bash
npm test      # Vitest: parsing, diagram geometry, fret validation, migrations
npm run build # Type-check + build the client
npm start     # Serve the built client and the API from one process
```

## Data

Everything lives in `data/chord-me.db`, a single SQLite file (gitignored). Back up the
library by copying that file. Delete it and restart for a fresh, empty library with the
starter chord catalog reseeded.

## Print

The on-screen preview on a version's page **is** the printed page — same DOM, no
separate render path. Use the "Imprimir / PDF" button or `Cmd/Ctrl+P`. See
`specs/001-chord-sheet-mvp/contracts/print-contract.md` for the exact contract, and
`formatador-cifra.html` (kept at the repo root) as the visual reference baseline.

## Screenshots

**Version editor** — lyrics and chords on the left, a live print preview on the right
(the same page that comes out when you hit `Imprimir / PDF`), with controls for
columns, body size, line height, margin, capo, and the chords used in the version.

![Version editor](docs/screenshots/version-editor.png)

**Chord catalog** — a library of reusable diagrams (56 shapes in the example), with a
search by name and a side form to create new chords from frets and fingers.

![Chord catalog](docs/screenshots/chords.png)

## Structure

Client pages (`src/client/pages/`):

- `LibraryPage` — song list, entry point.
- `SongPage` — a song's versions.
- `VersionPage` — the editor + printable sheet for one version.
- `ChordsPage` — the reusable chord catalog.

Server routes (`src/server/routes/`): `songs.ts`, `versions.ts`, `chords.ts` — REST API
backing the pages above, over the SQLite file in `data/`.

## Project docs

Full spec, plan, data model, and API contracts: `specs/001-chord-sheet-mvp/` (MVP) and
`specs/002-ui-redesign/` (later UI redesign — side rail nav, chord picker popover,
stacked sheet head).
