# Implementation Plan: Chord Sheet MVP

**Branch**: n/a (not a git repository) | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-chord-sheet-mvp/spec.md`

## Summary

Replace the static `formatador-cifra.html` with a local, login-free application that stores a
reusable chord catalog, songs with multiple versions, and per-version formatting settings, and
that prints chord sheets whose paper output matches the on-screen preview exactly.

Technical approach: one Node.js process holding a SQLite file and serving a small JSON API on
`127.0.0.1`, with a React UI that renders the sheet. The preview and the printout are the same
DOM — `@media print` hides the application chrome and the browser's own print engine produces
the PDF. The parsing and diagram-geometry logic is ported from the baseline file into pure,
tested TypeScript modules.

## Technical Context

**Language/Version**: TypeScript 5.x with `strict: true`, on Node.js 22 LTS

**Primary Dependencies**: React, Vite, `react-router-dom`, Express, `better-sqlite3`; Vitest
and `tsx` for development. Each is justified in [research.md](./research.md) (R1, R3, R6, R7).

**Storage**: SQLite, a single file at `data/chord-me.db`, accessed with hand-written SQL
through `better-sqlite3`. Numbered `.sql` migrations applied at startup and tracked in
`schema_migrations`. No ORM.

**Testing**: Vitest, concentrated on sheet parsing, diagram geometry, fret validation,
migration application, and version round-trip. Print fidelity is verified by hand against
print preview.

**Target Platform**: The owner's local machine — a Node process plus a browser tab. Never
hosted, never network-reachable.

**Project Type**: Local single-user web application (browser UI + local API + local database)

**Performance Goals**: Preview re-renders imperceptibly on each keystroke and each formatting
change for a typical sheet of a few hundred lines (SC-006). API calls are local and
synchronous against SQLite, so sub-millisecond.

**Constraints**: Two commands from clone to running (`npm install`, `npm run dev`). Offline
after the first install. Listener bound explicitly to `127.0.0.1`. A4 only. Print output must
match the preview exactly (SC-003).

**Scale/Scope**: Hundreds of songs, low thousands of chords, five screens, roughly a dozen
endpoints. One user, no concurrency.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates derived from `.specify/memory/constitution.md` v1.0.0.

| # | Principle | Gate | Initial | Post-design |
|---|-----------|------|---------|-------------|
| I | Local-First, Single-User | No auth, accounts, sessions, or tenancy anywhere in the design; listener bound to `127.0.0.1`; data is one local file the owner can copy | PASS | PASS |
| I | Local-First, Single-User | No hosted-software machinery: no rate limiting, RBAC, telemetry, feature flags, CDN, or scaling concerns | PASS | PASS |
| II | Print Output Is the Contract | Preview and printout share one DOM; no second render path and no server-side PDF | PASS | PASS |
| II | Print Output Is the Contract | Baseline behaviour preserved — chord/lyric pairing, section detection, capo bar, barre detection, diagram geometry, A4 `@page` sizing | PASS | PASS |
| II | Print Output Is the Contract | Every layout change verified against print preview or PDF, not screen alone | PASS | PASS |
| III | Radical Simplicity / YAGNI | No abstraction introduced for a single implementation; no repository/service/factory indirection | PASS | PASS |
| III | Radical Simplicity / YAGNI | Every dependency has a stated reason it beats the standard library or a small local helper | PASS | PASS |
| III | Radical Simplicity / YAGNI | No microservices, queues, caching layer, or state-management library adopted speculatively | PASS | PASS |
| IV | Typed Data, Owned Schema | Domain types defined once in shared code and used by server and client; no duplicated shapes | PASS | PASS |
| IV | Typed Data, Owned Schema | Schema changes ship as ordered, checked-in migration files | PASS | PASS |
| IV | Typed Data, Owned Schema | Chords selected from the catalog rather than retyped per song; formatting stored per version so sheets reprint identically | PASS | PASS |
| V | Pragmatic Testing | Tests mandated for parsing/line classification, diagram geometry, migrations, and version round-trip | PASS | PASS |
| V | Pragmatic Testing | CRUD wiring and presentation verified manually; no TDD ceremony imposed | PASS | PASS |

**Result**: All gates pass. Complexity Tracking is empty — no violations to justify.

Notes on the two decisions closest to a Principle III line, recorded so a later reviewer can
re-litigate them with the reasoning intact:

- **`react-router-dom`** is an abstraction over something the platform provides. It earns its
  place because there are five routes, two parameterised, and hand-rolled history and URL
  parameter handling is a known source of bugs for no benefit. See research R6.
- **Express** likewise wraps `node:http`. It supplies routing, path parameters, JSON body
  parsing, static serving, and error middleware — around a hundred lines of code avoided. See
  research R7.

Both are single, boring, widely known dependencies with one clear caller each, which is what
Principle III asks for. Neither introduces indirection inside the application's own code.

## Project Structure

### Documentation (this feature)

```text
specs/001-chord-sheet-mvp/
├── plan.md                     # This file
├── spec.md                     # Feature specification
├── research.md                 # Phase 0 output — technical decisions R1–R10
├── data-model.md               # Phase 1 output — schema and shared types
├── quickstart.md               # Phase 1 output — run and validation guide
├── contracts/
│   ├── api.md                  # Local HTTP API contract
│   └── print-contract.md       # Print output contract (Principle II)
├── checklists/
│   └── requirements.md         # Spec quality checklist
└── tasks.md                    # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
formatador-cifra.html           # Baseline reference; retained until the app matches its output

migrations/
├── 001_initial_schema.sql      # chords, songs, song_versions, song_version_chords
└── 002_seed_chord_catalog.sql  # Starter shapes ported from the baseline

src/
├── shared/                     # Imported by BOTH server and client — single source of truth
│   ├── types.ts                # Chord, Song, SongVersion, FormattingSettings, DEFAULT_FORMATTING
│   ├── frets.ts                # Fret token parsing, normalisation, validation
│   ├── validation.ts           # Field validators returning per-field messages
│   ├── parseSheet.ts           # Text → Block[] (pure)
│   └── diagram.ts              # Chord + capo → diagram geometry (pure)
│
├── server/
│   ├── index.ts                # Express app, 127.0.0.1 binding, static serving
│   ├── db.ts                   # better-sqlite3 connection, foreign_keys pragma
│   ├── migrate.ts              # Applies migrations/ in order, records in schema_migrations
│   ├── seed.ts                 # Seeds the catalog only when chords is empty
│   └── routes/
│       ├── chords.ts
│       ├── songs.ts
│       └── versions.ts
│
└── client/
    ├── main.tsx                # Entry, router setup
    ├── api.ts                  # Typed fetch wrapper over the API contract
    ├── pages/
    │   ├── LibraryPage.tsx     # Song list, search, create, delete
    │   ├── SongPage.tsx        # A song's versions
    │   ├── VersionPage.tsx     # Editor + live preview + formatting controls + print
    │   └── ChordsPage.tsx      # Chord catalog CRUD
    ├── components/
    │   ├── Sheet.tsx           # THE printable sheet — preview and printout are this component
    │   ├── ChordDiagram.tsx    # SVG rendering over diagram.ts geometry
    │   ├── ChordPicker.tsx     # Select and order chords from the catalog
    │   └── FormattingControls.tsx
    └── styles/
        ├── app.css             # Application chrome — hidden by @media print
        └── sheet.css           # Sheet typography, columns, break rules, @page A4

tests/
├── parseSheet.test.ts          # Line classification, pairing, section detection (SC-007)
├── diagram.test.ts             # Base fret, barre detection, markers, capo offset
├── frets.test.ts               # Normalisation, compact-form input, validation messages
└── persistence.test.ts         # Migrations apply cleanly; version round-trips with formatting

data/                           # Gitignored — chord-me.db lives here
```

**Structure Decision**: A single project with `src/shared`, `src/server`, and `src/client`,
rather than a monorepo with separate packages. There is one `package.json` and one dependency
tree; the server and client differ only by tsconfig `lib` settings. `src/shared` is the
mechanism that satisfies Principle IV's "types defined once" rule — the parser, the diagram
geometry, and the validators all live there and run in both environments unchanged, which also
means the browser can validate for instant feedback while the server validates for real.

The `Sheet.tsx` component is deliberately the only place the printable output is constructed.
Principle II's guarantee reduces to a structural fact: there is exactly one sheet renderer, so
preview and print cannot diverge.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All thirteen gates pass in both the initial and post-design evaluations.
