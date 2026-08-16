---

description: "Task list for Chord Sheet MVP implementation"
---

# Tasks: Chord Sheet MVP

**Input**: Design documents from `/specs/001-chord-sheet-mvp/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md),
[contracts/print-contract.md](./contracts/print-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Test tasks below are **scoped, not blanket**. Constitution Principle V mandates
automated tests for exactly four areas — sheet parsing, diagram geometry, fret validation, and
persistence round-trip — because those fail silently. It explicitly does **not** mandate TDD, and
CRUD wiring and presentation are verified by hand. Only tasks covering the four mandated areas
carry tests; the manual validation tasks (V1–V5 from quickstart.md) cover the rest.

**Organization**: Grouped by user story so each is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US4)
- Exact file paths are included in every task

## Path Conventions

Single project at repository root, per plan.md's Structure Decision: `src/shared/`,
`src/server/`, `src/client/`, `migrations/`, `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization. Ends with `npm install` working and an empty app booting.

- [X] T001 Create the directory skeleton at repository root — `src/shared/`, `src/server/routes/`, `src/client/pages/`, `src/client/components/`, `src/client/styles/`, `migrations/`, `tests/`, `data/` — matching plan.md's Source Code layout
- [X] T002 Create `package.json` with dependencies `react`, `react-dom`, `react-router-dom`, `express`, `better-sqlite3`, and dev dependencies `typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `tsx`, `concurrently`, plus `@types/*` for express, react, react-dom, and node; add scripts `dev`, `build`, `start`, `test` per quickstart.md
- [X] T003 [P] Configure TypeScript in `tsconfig.json` with `strict: true`, plus `tsconfig.server.json` (Node libs) and `tsconfig.client.json` (DOM libs), both including `src/shared/` so shared modules compile for each target
- [X] T004 [P] Create `vite.config.ts` with the React plugin, root pointed at `src/client/`, dev server on `127.0.0.1:5173`, and a proxy sending `/api` to `127.0.0.1:3001`
- [X] T005 [P] Create `vitest.config.ts` covering `tests/**/*.test.ts` with the Node environment
- [X] T006 [P] Create `.gitignore` excluding `node_modules/`, `dist/`, and `data/` — the database file is never committed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, database, migrations, HTTP shell, and client shell. Everything below
is imported by two or more user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Define shared domain types in `src/shared/types.ts` — `FretToken`, `Frets`, `Chord`, `FormattingSettings`, `SongVersion`, `Song`, and the `DEFAULT_FORMATTING` constant (3 columns, 8.5 pt, 1.3 line height, 18 mm margin, 12 mm top extra) exactly as specified in data-model.md
- [X] T008 Implement fret token handling in `src/shared/frets.ts` — parse canonical space-separated tokens, accept the compact six-character form as input shorthand, normalise to canonical, and validate (exactly six tokens, each `x` or an integer 0–24) returning a message that names the specific fault
- [X] T009 [P] Write fret tests in `tests/frets.test.ts` covering canonical parsing, compact-form input, frets above 9 round-tripping correctly, and each distinct rejection message (wrong token count, unsupported character, fret out of range) — Constitution Principle V
- [X] T010 Implement field validators in `src/shared/validation.ts` — non-empty chord name, non-empty song title, non-empty version label, capo 1–12 when present, and each formatting value within its range — returning per-field messages for the API error envelope (depends on T007, T008)
- [X] T011 [P] Write `migrations/001_initial_schema.sql` creating `chords`, `songs`, `song_versions`, `song_version_chords`, and `schema_migrations` with every constraint from data-model.md — including CHECK ranges on capo and the five formatting columns, `ON DELETE CASCADE` from songs to versions and from versions to chord links, and **`ON DELETE RESTRICT` from chord links to chords** (this constraint is the enforcement point for FR-005)
- [X] T012 Implement the database connection in `src/server/db.ts` — open `data/chord-me.db`, creating the directory if absent, and set `PRAGMA foreign_keys = ON` on the connection (without it SQLite silently ignores the RESTRICT constraint from T011)
- [X] T013 Implement migration running in `src/server/migrate.ts` — apply `migrations/*.sql` in filename order inside a transaction, skipping versions already recorded in `schema_migrations`, invoked automatically at startup so the owner never runs a migration command (depends on T011, T012)
- [X] T014 Write migration tests in `tests/persistence.test.ts` — migrations apply cleanly to a fresh temporary database file, are idempotent on a second run, and leave foreign key enforcement active — Constitution Principle V
- [X] T015 Create the Express application in `src/server/index.ts` — JSON body parsing, an `/api` router mount point, error middleware emitting the `{ error: { code, message, fields? } }` envelope from contracts/api.md, and a listener bound with an **explicit `127.0.0.1` host** on port 3001 (Constitution Principle I — never bind `0.0.0.0`)
- [X] T016 [P] Implement the typed API client in `src/client/api.ts` — a `fetch` wrapper typed against `src/shared/types.ts` that unwraps the error envelope into a thrown error carrying `code` and `fields`
- [X] T017 [P] Create application chrome styles in `src/client/styles/app.css` — navigation and layout, plus a `@media print` block that hides every application affordance so only the sheet prints (FR-019, print-contract.md)
- [X] T018 Create the client entry in `src/client/main.tsx` — React root, `react-router-dom` routes for `/` (library), `/songs/:songId`, `/versions/:versionId`, and `/chords`, with placeholder page components to be filled in by later phases

**Checkpoint**: `npm run dev` boots, the database file is created and migrated, and an empty
shell renders in the browser.

---

## Phase 3: User Story 1 — Register a song version and print it (Priority: P1) 🎯 MVP

**Goal**: Create a song, paste chord-sheet text into a version, see it laid out as it will
print, and produce a PDF. Data survives a restart.

**Independent Test**: Quickstart scenario V1 — from an empty library, create a song, paste sheet
text with chord lines above lyric lines and a section marker, confirm the preview distinguishes
them, print to PDF with no application chrome visible, restart, and confirm the text is intact.

### Tests for User Story 1 (Constitution Principle V — parsing fails silently)

- [X] T019 [P] [US1] Write parser tests in `tests/parseSheet.test.ts` covering: a chord line directly above a lyric line pairs into one block; a chord line with no lyric beneath stands alone; section markers in bracket form and in Portuguese word form are classified as headings; a lyrics-only sheet yields no chord-classified lines; blank lines become separators; and slash chords, extensions, and degree-sign notation are all recognised on a chord line

### Implementation for User Story 1

- [X] T020 [US1] Implement `parseSheet(text) → Block[]` in `src/shared/parseSheet.ts` as a pure function with no DOM access, porting the baseline's chord-name regex and section regex from `formatador-cifra.html` unchanged, and emitting the `Block` union from data-model.md (depends on T019)
- [X] T021 [P] [US1] Implement song routes in `src/server/routes/songs.ts` — `GET /api/songs` (summaries with `versionCount`), `POST /api/songs`, `GET /api/songs/:id` (including versions), `PUT /api/songs/:id` — per contracts/api.md
- [X] T022 [P] [US1] Implement version routes in `src/server/routes/versions.ts` — `POST /api/songs/:songId/versions` applying `DEFAULT_FORMATTING` to omitted fields, `GET /api/versions/:id`, `PUT /api/versions/:id` — storing `sheetText` verbatim with only carriage returns stripped, since whitespace carries the chord alignment
- [X] T023 [US1] Mount the song and version routers under `/api` in `src/server/index.ts` (depends on T021, T022)
- [X] T024 [US1] Create sheet styles in `src/client/styles/sheet.css` — monospace body so chord alignment holds, serif header, accent-coloured bold chord lines, muted letter-spaced section headings, the header rule, multi-column body with a column rule, `break-inside: avoid` plus `page-break-inside: avoid` on every block, and `@page { size: A4; margin: 0 }` with margins expressed as print-only padding, all per contracts/print-contract.md
- [X] T025 [US1] Implement `src/client/components/Sheet.tsx` — the single printable sheet component rendering the header (title, artist, metadata line) and the parsed body from `parseSheet`, escaping text so markup characters appear literally (FR-020). **This component is the only place printable output is constructed**; preview and printout are these same nodes, never a second render path (Constitution Principle II)
- [X] T026 [P] [US1] Implement `src/client/pages/LibraryPage.tsx` — list songs and create a song with title and artist
- [X] T027 [P] [US1] Implement `src/client/pages/SongPage.tsx` — show a song's versions and add a version with a label
- [X] T028 [US1] Implement `src/client/pages/VersionPage.tsx` — a sheet-text textarea beside a live `Sheet` preview that re-renders as the owner types, with save wired to `PUT /api/versions/:id` (depends on T020, T025)
- [X] T029 [US1] Add a print action to `src/client/pages/VersionPage.tsx` calling `window.print()`, relying on the `@media print` rules from T017 and T024 rather than any separate print view
- [X] T030 [US1] Extend `tests/persistence.test.ts` with a version round-trip test — a version saved with sheet text, key, capo, and formatting settings reads back byte-identical, with whitespace in the sheet text preserved exactly — Constitution Principle V
- [X] T031 [US1] Run quickstart scenario **V1** by hand, including the print step: open the browser print preview, confirm only the sheet appears, export a PDF, and confirm chord lines stay bound to their lyric lines across every page break — **verified by the owner in real use**, who confirmed the print screen was correct and signed off on the MVP

**Checkpoint**: User Story 1 is fully functional. The app already beats the static file, because
the pasted sheet persists and reprints without re-pasting.

---

## Phase 4: User Story 2 — Chord catalog and diagram attachment (Priority: P2)

**Goal**: Maintain a catalog of chord shapes, pick them when editing a version, and have the
diagrams drawn on the printed sheet.

**Independent Test**: Quickstart scenario V2 — add a chord, verify the diagram, attach it to a
version, confirm it prints, and confirm deletion of an attached chord is refused with the
blocking versions named.

### Tests for User Story 2 (Constitution Principle V — geometry fails silently)

- [X] T032 [P] [US2] Write diagram geometry tests in `tests/diagram.test.ts` covering: an open-position shape draws a thick nut line; a shape above the fifth fret reports a base fret instead of empty frets; a barre is detected when the lowest fretted position repeats across three or more strings; a barre is detected across two strings with a higher fretted note between them; muted and open strings produce the right markers; a capo suppresses the thick nut line and reports a capo bar; and frets above 9 position correctly

### Implementation for User Story 2

- [X] T033 [US2] Implement `computeDiagram(chord, capo) → DiagramGeometry` in `src/shared/diagram.ts` as a pure function returning base fret, per-string dot positions, barre span, open and muted markers, and capo bar presence — porting the baseline's geometry from `formatador-cifra.html` and extending it for frets above 9 per research R4 (depends on T032)
- [X] T034 [P] [US2] Write `migrations/002_seed_chord_catalog.sql` inserting the roughly fifty chord shapes embedded in the `DB` object of `formatador-cifra.html`, converted to canonical fret tokens, guarded so it inserts only when `chords` is empty (FR-004)
- [X] T035 [US2] ~~Wire seeding in `src/server/seed.ts`~~ — **implemented differently than planned**: seeding lives entirely in migration `002_seed_chord_catalog.sql` (T034), applied exactly once because `schema_migrations` tracks it. No separate `seed.ts` module exists; the migration runner from T013 *is* the wiring. Verified by restarting the server twice — chord count stayed at 53 both times, confirming the seed never re-runs or fights edits (FR-004)
- [X] T036 [US2] Implement chord routes in `src/server/routes/chords.ts` — `GET /api/chords` with optional `?q=`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id` — running the T008 and T010 validators and returning `VALIDATION_FAILED` with per-field messages (FR-003)
- [X] T037 [US2] Add `GET /api/chords/:id/usages` and the `CHORD_IN_USE` 409 path to `src/server/routes/chords.ts` — query the blocking song versions so the response names them, while the T011 RESTRICT constraint guarantees the invariant regardless (FR-005)
- [X] T038 [US2] Mount the chord router under `/api` in `src/server/index.ts` (depends on T036, T037)
- [X] T039 [US2] Implement `src/client/components/ChordDiagram.tsx` — a thin SVG renderer over `computeDiagram` output: string and fret lines, dots with finger numbers, barre, base fret label, capo bar, and the below-grid muted, open, and fretted markers (depends on T033)
- [X] T040 [P] [US2] Implement `src/client/pages/ChordsPage.tsx` — browse, create, edit, and delete chords with a live diagram preview, surfacing per-field validation messages and the `CHORD_IN_USE` blocking list on a refused delete
- [X] T041 [US2] Implement `src/client/components/ChordPicker.tsx` — select chords from the catalog and reorder the selection, **displaying the fret pattern alongside the name** so shapes sharing a name stay distinguishable (data-model.md)
- [X] T042 [US2] Extend `src/server/routes/versions.ts` — accept `chordIds` on `PUT` and rewrite the join rows inside a single transaction, rejecting unknown ids with 400; return the resolved `chords` array ordered to match `chordIds` from `GET /api/versions/:id`
- [X] T043 [US2] Wire `ChordPicker` into `src/client/pages/VersionPage.tsx` and add the capo field, saving both through `PUT /api/versions/:id` (depends on T041, T042)
- [X] T044 [US2] Extend `src/client/components/Sheet.tsx` — render the diagram area top-right of the first page, wrapping within a bounded width so it never pushes the body off the page, **omitted entirely when the version has no chords** rather than reserved as empty space; add the capo note to the header metadata line and mark capo-relative chord names (FR-021)
- [X] T045 [US2] Run quickstart scenario **V2** by hand, checking every diagram case against the geometry rules in contracts/print-contract.md and confirming the diagrams print on the first page — **verified by the owner in real use**. The geometry itself is additionally covered by `tests/diagram.test.ts` (base fret, barre detection, open/muted markers, capo offset, frets above 9)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 — Formatting on the print-preview screen (Priority: P3)

**Goal**: Adjust column count, body size, line spacing, margins, and top spacing from the preview
screen, see the change immediately, and have it saved with the version.

**Independent Test**: Quickstart scenario V3 — change settings, confirm the preview reflows,
print and confirm paper matches, reopen and confirm the settings persisted.

### Implementation for User Story 3

- [X] T046 [US3] Implement `src/client/components/FormattingControls.tsx` — controls for columns (1–4), body size (6–16 pt), line height (1.0–2.0), margin (0–40 mm), and top extra (0–40 mm), each constrained to the ranges in data-model.md
- [X] T047 [US3] Apply formatting in `src/client/components/Sheet.tsx` as CSS custom properties on the sheet element — column count, font size, and line height — so a settings change reflows the existing preview without re-mounting or losing editor state (FR-016)
- [X] T048 [US3] **Implemented differently than planned, same contract satisfied**: instead of a dynamically generated `<style>` tag, `@page { size: A4; margin: 0 }` is static in `src/client/styles/sheet.css`, and `marginMm`/`topExtraMm` drive print-only padding via the same `--margin-mm`/`--top-extra-mm` CSS custom properties T047 sets inline on `.sheet` (`calc(var(--margin-mm) * 1mm)`). Simpler than injecting a `<style>` element and behaviourally identical — `@page` margin stays zero, per print-contract.md
- [X] T049 [US3] Persist formatting from `src/client/pages/VersionPage.tsx` through `PUT /api/versions/:id` and load it on open, so reopening restores the same layout (FR-017)
- [X] T050 [US3] Add a reset action in `src/client/components/FormattingControls.tsx` that sends `DEFAULT_FORMATTING` — there is no separate reset endpoint (contracts/api.md)
- [X] T051 [US3] Verify the break rules in `src/client/styles/sheet.css` at every column count from 1 to 4, confirming no chord line is ever separated from its lyric line at a column boundary (FR-015 — the most damaging possible print regression) — **verified by the owner in real use**. `break-inside: avoid` / `page-break-inside: avoid` sit on every `.sheet-blk`, unconditional on column count
- [X] T052 [US3] Confirm extreme settings (largest body size at four columns, zero margin, maximum margin) still render and can be dialled back, with no unresponsive state — **verified by the owner in real use**. Ranges are additionally constrained at three layers: the control options, the shared validators, and SQLite CHECK constraints
- [X] T053 [US3] Run quickstart scenario **V3** by hand, including the print comparison — column count, text size, spacing, and margins on paper must match the preview exactly (SC-003) — **verified by the owner in real use**

**Checkpoint**: All three primary stories work independently.

---

## Phase 6: User Story 4 — Library management (Priority: P4)

**Goal**: Find songs, keep several versions of one song side by side, and edit or remove entries
safely.

**Independent Test**: Quickstart scenario V4 — create several songs, search, add a second
version, edit one without affecting the other, and delete with confirmation.

### Implementation for User Story 4

- [X] T054 [US4] Add `?q=` search to `GET /api/songs` in `src/server/routes/songs.ts` — case-insensitive `LIKE` against title and artist (FR-012; FTS5 is deliberately out of scope per data-model.md)
- [X] T055 [US4] Add a search field to `src/client/pages/LibraryPage.tsx` filtering the list as the owner types
- [X] T056 [US4] Support version ordering in `src/server/routes/versions.ts` — assign `position` as the next free slot on create and accept `position` on `PUT`
- [X] T057 [US4] Extend `src/client/pages/SongPage.tsx` to list all versions in `position` order with their key labels, each opening independently
- [X] T058 [US4] Implement `DELETE /api/songs/:id` and `DELETE /api/versions/:id` in `src/server/routes/songs.ts` and `src/server/routes/versions.ts`, relying on the cascade rules from T011 — chords used by a deleted version survive in the catalog
- [X] T059 [US4] Add confirmation prompts before every destructive action across `src/client/pages/LibraryPage.tsx`, `src/client/pages/SongPage.tsx`, and `src/client/pages/ChordsPage.tsx` (FR-011)
- [X] T060 [US4] Confirm that deleting a song's last version leaves the song listed with `versionCount: 0` rather than auto-deleting it, so no record becomes unreachable (spec edge case) — verified both by a persistence test and by the T061 API run below
- [X] T061 [US4] Run quickstart scenario **V4** — verified end-to-end via direct API calls (search by title, search by artist, two versions with different keys, editing one leaves the other untouched, version delete cascades correctly, song survives at `versionCount: 0`, song delete removes it). The UI's `confirm()` dialogs themselves (T059) are code-reviewed but not click-tested — no browser available this session

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T062 [P] Write `README.md` documenting the two-command run, the `data/chord-me.db` location, backup by copying that file, and a pointer to `.specify/memory/constitution.md` — the constitution's Sync Impact Report flagged this as the one pending follow-up
- [X] T063 [P] Implement production serving in `src/server/index.ts` — `npm start` serves the built client from `dist/` alongside the API in one process, per quickstart.md — verified: `npm run build` then `npm start` serves `index.html`, `/api/chords`, and the SPA fallback all with HTTP 200
- [X] T064 [P] Run quickstart scenario **V5** — verified via `parseSheet` directly: a lyrics-only sheet classifies with no `chords`/`pair` blocks, slash/extension/degree-sign chords classify correctly, and a line containing `<script>`, `&`, and quotes round-trips as a single verbatim `lyrics` block. Literal rendering of `<`/`>`/`&` (FR-020) is structurally guaranteed — `grep` confirms no `dangerouslySetInnerHTML`/`innerHTML` anywhere in `src/client/`, so React's default JSX text-escaping is the only rendering path. The "flows across multiple pages without splitting a pair at a page break" half of this edge case is print-visual and needs the manual check in T031/T053
- [X] T065 Verify the listener binds only to `127.0.0.1` — confirmed with `lsof -iTCP -sTCP:LISTEN`: socket shows `localhost:3001`, never `*:3001` (Constitution Principle I)
- [X] T066 Verify a clean start — deleted `data/chord-me.db`, restarted twice: empty library (`[]`), 53 seeded chords present both times with no duplication, no error (FR-025, SC-004)
- [X] T067 Parser accuracy against real pasted chord sheets (SC-007) — **accepted on the owner's use of real material**, not on a counted sample. The regexes are ported unchanged from `formatador-cifra.html`, already tuned against real pasted text, and `tests/parseSheet.test.ts` covers pairing, standalone chord lines, both section-marker forms, lyrics-only input, blanks, and slash/extension/degree-sign chords. No formal 95% measurement was computed; if a misclassification ever shows up, add it there as a regression case
- [X] T068 Compare printed output against `formatador-cifra.html` — **verified by the owner**, who confirmed the printed sheet was correct. Two differences are deliberate and recorded in research.md: fret storage past fret 9 (R4) and darker below-grid string markers for contrast (R11). One genuine regression was found and fixed during this work: the sheet was inheriting the chrome's font and colour instead of declaring its own, which printed the artist and key/capo lines in the wrong face and made lyrics near-invisible on screen while printing correctly
- [X] T069 Full validation pass — **complete**. Automated: 36 Vitest tests pass, both `tsc --noEmit` projects clean, production build succeeds, CRUD/cascade/search verified by direct API calls, listener confirmed bound to `127.0.0.1` only, clean-start reseed confirmed non-duplicating. Manual: print fidelity and the four screens signed off by the owner, who accepted the MVP

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **User Stories (Phases 3–6)**: All depend on Foundational; then proceed in priority order
  P1 → P2 → P3 → P4
- **Polish (Phase 7)**: Depends on the desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. Independently shippable — this is the MVP.
- **US2 (P2)**: Depends only on Foundational. T044 extends `Sheet.tsx` from US1, so if US2 were
  built first, that task would create the diagram area rather than extend it.
- **US3 (P3)**: Depends on Foundational; T047 and T048 extend `Sheet.tsx` from US1. US1's sheet
  already prints correctly at the default settings, so US3 makes a static layout adjustable
  rather than making printing work.
- **US4 (P4)**: Depends only on Foundational. Touches list and delete paths, not the sheet.

### Within Each User Story

- Tests for the four Principle V areas come before the logic they cover (T019 → T020,
  T032 → T033)
- Shared pure modules before server routes; server routes before the pages that call them
- `Sheet.tsx` before the pages that embed it
- Manual print validation last in each phase — it verifies the finished increment

### Parallel Opportunities

- Setup: T003, T004, T005, T006 all touch different config files
- Foundational: T009 alongside T010; T011 alongside T012; T016 and T017 alongside each other
- US1: T019 with T021 and T022 (test file plus two route files); T026 with T027
- US2: T032 with T034; T040 runs alongside T041
- Polish: T062, T063, T064 are independent

### Sequential Bottlenecks (do not parallelise)

- T011 → T012 → T013 → T014: the migration chain is strictly ordered
- Anything touching `src/server/index.ts` (T015, T023, T038, T063) — one file, four phases
- Anything touching `src/client/components/Sheet.tsx` (T025, T044, T047, T048) — one file, and
  deliberately so, since Principle II's guarantee rests on there being exactly one sheet renderer

---

## Parallel Example: User Story 1

```bash
# After Foundational completes, launch these together:
Task: "Write parser tests in tests/parseSheet.test.ts"
Task: "Implement song routes in src/server/routes/songs.ts"
Task: "Implement version routes in src/server/routes/versions.ts"

# Then, once parseSheet.ts and Sheet.tsx exist:
Task: "Implement LibraryPage in src/client/pages/LibraryPage.tsx"
Task: "Implement SongPage in src/client/pages/SongPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 User Story 1
4. **STOP and VALIDATE**: run quickstart V1, including printing to PDF
5. At this point the tool is already usable daily — sheets persist and reprint

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate V1 → **MVP, usable**
3. US2 → validate V2 → chord catalog removes the retyping of diagrams
4. US3 → validate V3 → formatting adjustable and remembered per version
5. US4 → validate V4 → library scales past a handful of songs
6. Polish → README, clean-start check, baseline print comparison

Each story adds value without breaking the previous ones.

### Single-Maintainer Note

The parallel-team section of the generic template does not apply — this is a one-person personal
project. The `[P]` markers indicate tasks that are safe to interleave or batch in one sitting,
not work to distribute.

---

## Notes

- `[P]` means different files with no dependency on incomplete work
- Constitution Principle V governs which tasks carry tests: parsing (T019), geometry (T032),
  fret validation (T009), persistence round-trip (T014, T030). Everything else is checked by hand
- Print fidelity is verified by eye against print preview or an exported PDF — T031, T045, T053,
  and T068 are not optional, and no automated check in scope substitutes for them
- Commit after each task or logical group; stop at any checkpoint to validate a story
- Keep `formatador-cifra.html` in place until T068 passes
