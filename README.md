# chord-me

Local, login-free chord sheet manager. Replaces the static `formatador-cifra.html`
with a small app that stores a reusable chord catalog, songs with multiple versions,
and per-version print formatting — while keeping the same printed output.

Personal, single-user, never hosted. See `.specify/memory/constitution.md` for the
governing principles (local-first, print-output-is-the-contract, YAGNI, owned schema,
pragmatic testing).

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

## Project docs

Full spec, plan, data model, and API contracts: `specs/001-chord-sheet-mvp/`.
