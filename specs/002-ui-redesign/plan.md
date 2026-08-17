# Implementation Plan: UI Redesign (Stitch)

**Branch**: `main` (no feature branch; the git extension is not installed) | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ui-redesign/spec.md`

## Summary

Close the gap between the design that already ships and the Stitch mockups.

The spec was written before the current stylesheet was audited, and it overstates the work.
`PRODUCT.md` claims the React app lost the dark monospaced panel and that no focus styling
exists; both claims are stale. The MVP commit already shipped dark chrome tokens with
measured contrast, a global focus treatment, monospaced type throughout, dense rows that
explicitly "replace the card grids", chord tiles already rendered on `--paper`,
reduced-motion handling, and hardened print isolation. Roughly two thirds of the spec's 43
functional requirements are already satisfied (research R0).

What is genuinely open is small and specific:

1. **Palette** — move the chrome accent to the mockups' `#FF8C00`, inverting solid-fill
   labels to near-black because white on that orange measures 2.33:1 (research R1), while
   leaving every print token frozen (research R2).
2. **Chord panel** — move creation and editing beside the grid instead of below it, so the
   grid stays visible while a chord is described (research R3).
3. **Library key/capo** — widen `VersionRef` by two columns that already exist on the row
   being selected (research R4).
4. **Version creation** — reach `songKey` and `capo` the server already accepts and
   validates but the client type hides (research R5).
5. **Three small fixes** — saved-state feedback on the song screen, tile action buttons
   raised from 24 px to the 32 px floor and no longer hover-hidden (research R8), and a
   favicon (research R7).
6. **Correct `PRODUCT.md`**, which currently misdescribes the shipped app.

Everything else in the spec becomes a verification pass, not construction. The dominant
risk is not building the wrong thing — it is regressing a print-verified stylesheet while
changing tokens around it.

## Technical Context

**Language/Version**: TypeScript 5.7, `strict` mode, ESM throughout

**Primary Dependencies**: React 18.3, React Router 6.28, Vite 6, Express 4.21,
better-sqlite3 11.8. **No dependency is added by this feature.**

**Storage**: SQLite, single local file at `data/chord-me.db`. **No migration.** The two
columns this feature exposes (`song_versions.song_key`, `song_versions.capo`) already
exist and are already populated.

**Testing**: Vitest. One test added (`GET /api/songs` carries key and capo, still omits
`sheetText`). Print fidelity is verified procedurally against real PDF output — see
research R6.

**Target Platform**: Desktop browser on localhost. Chrome's print engine produces the PDF.

**Project Type**: Single local web application — Express API and React client in one repo,
served from one process in production.

**Performance Goals**: None numeric. The listing endpoint must stay at two queries for N
songs; no N+1 is introduced.

**Constraints**:
- Printed output must be byte-for-byte visually identical before and after (Principle II).
- Paper tokens `--ink`, `--paper`, `--rule`, `--chord`, `--muted`, `--grey` must not appear
  in this feature's diff.
- WCAG AA on every text and control pairing (FR-006).
- 32 px minimum interactive target (FR-007).
- Offline after first install; `install → run` in two commands.

**Scale/Scope**: One user. Four screens, one shared stylesheet, one shared type file, one
server route touched. Roughly 20 songs and 50+ chords in real use.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1.*

### I. Local-First, Single-User (NON-NEGOTIABLE) — PASS

No authentication, accounts, sessions, or partitioning is introduced. The spec already
dropped the mockups' "Perfil" entry for exactly this reason, along with PWA installability
— the app is never hosted, so installability buys nothing. Binding stays localhost. No
telemetry, no analytics, no asset pipeline, no CDN.

### II. Print Output Is the Contract — PASS, and the gate that matters

This is the principle this feature most endangers, because it changes colour tokens that
live in the same file as the print tokens.

Enforcement:

- The two token groups are already separated by comment in `:root`. This feature edits only
  the `--app-*` group and adds a comment recording that the groups are now deliberately
  independent — `--app-accent-solid` currently equals `--chord` by coincidence, and after
  this feature it does not.
- `sheet.css` is not edited at all. It already declares its own `background` and `color`
  rather than inheriting from `body`, precisely because a dark chrome once made preview and
  print disagree.
- FR-012 holds by construction: no second render path is introduced; the preview element
  is the printed element.
- The chord catalog's new two-column layout must carry `.chrome`, keeping print hiding
  class-driven rather than structural. That failure mode has already bitten this codebase
  once and is recorded in the `@media print` comment.
- Verification is a before/after PDF comparison at two formatting settings, captured
  **before** any edit (quickstart Step 0), plus a blank-page check printing from every
  non-editor screen.

### III. Radical Simplicity / YAGNI — PASS

- No dependency added. No abstraction introduced.
- The chord panel is a layout change around existing components — `.chordgrid`,
  `.chordcell`, `.field`, `button`, `.chord-preview` are all reused unmodified.
- No repository, service, or factory indirection. The one server change adds two column
  names to an existing `SELECT`.
- A modal for chord creation was rejected (research R3); a separate endpoint for version
  metadata was rejected as an abstraction with one caller (research R4).
- A pixel-diff print harness was rejected as speculative machinery for a one-user tool
  (research R6).
- Most of the feature is *deleting planned work* after discovering it already exists.

### IV. Typed Data, Owned Schema — PASS

- `VersionRef` is defined once in `src/shared/types.ts` and consumed by both server and
  client. Its two new fields, the `SELECT` that populates them, and the UI that reads them
  move in the same commit.
- No schema change, so no migration file is required. The invariant that `VersionRef`
  exists to keep `sheetText` out of summary responses is preserved and re-asserted in the
  contract and in a test.
- Per-version formatting settings are untouched, so saved sheets keep reprinting
  identically.

### V. Pragmatic Testing — PASS

- This feature touches no chord-line detection, no section detection, no diagram geometry,
  no transposition. Those tests stay green as a regression guard.
- It does touch data-layer behaviour, which Principle V names explicitly: one test asserts
  `GET /api/songs` carries `songKey` and `capo` on version refs and still omits `sheetText`.
- The rest is CRUD wiring and pure presentation, which Principle V permits verifying
  manually. The manual procedure is written down in `quickstart.md` rather than left
  implicit.

### Technology Constraints — PASS

TypeScript strict, no `any` introduced, no ORM, localhost only, two-command install-and-run
preserved, destructive operations keep their confirmations, `formatador-cifra.html` stays
as the baseline reference.

### Development Workflow — PASS

Spec Kit flow followed. The spec states how the result is verified on a printed page
(quickstart Step 0 and the US1 print check), as required for any feature adding or changing
a user-visible screen.

**Post-Phase-1 re-evaluation**: no gate moved. No entry is required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-redesign/
├── plan.md                    # This file
├── spec.md                    # Feature specification
├── research.md                # Phase 0 — baseline audit, palette contrast, layout decisions
├── data-model.md              # Phase 1 — VersionRef widening, token boundary
├── quickstart.md              # Phase 1 — run + validation procedure
├── contracts/
│   └── api-delta.md           # Phase 1 — what changes vs. the MVP API contract
├── checklists/
│   └── requirements.md        # Spec quality checklist (3 validation runs)
├── assets/
│   ├── 05-acordes.png         # Chord catalog mockup
│   └── stitch/                # Original Stitch export
└── tasks.md                   # Phase 2 — created by /speckit-tasks, NOT by this command
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts               # CHANGED — VersionRef gains songKey, capo
├── server/
│   └── routes/
│       └── songs.ts           # CHANGED — withVersions() SELECT gains song_key, capo
└── client/
    ├── index.html             # CHANGED — <link rel="icon">
    ├── favicon.svg            # NEW — full-bleed chord-me mark
    ├── api.ts                 # CHANGED — createVersion accepts songKey, capo
    ├── main.tsx               # unchanged — nav already satisfies FR-030/FR-031
    ├── styles/
    │   ├── app.css            # CHANGED — accent tokens, chord catalog layout, tile actions
    │   └── sheet.css          # MUST NOT CHANGE — print contract
    ├── components/
    │   ├── ChordDiagram.tsx   # MUST NOT CHANGE — print contract
    │   ├── Sheet.tsx          # unchanged
    │   ├── ChordPicker.tsx    # unchanged
    │   └── FormattingControls.tsx  # unchanged
    └── pages/
        ├── LibraryPage.tsx    # CHANGED — sub-rows show key and capo
        ├── SongPage.tsx       # CHANGED — create bar takes key and capo; saved feedback
        ├── ChordsPage.tsx     # CHANGED — grid + side panel layout
        └── VersionPage.tsx    # unchanged — already satisfies FR-023…FR-026

tests/                          # CHANGED — one test for the songs-list delta

PRODUCT.md                      # CHANGED — corrected; currently misdescribes the app
```

**Structure Decision**: The existing single-project layout is kept unchanged —
`src/shared` for types crossing the boundary, `src/server` for the Express API,
`src/client` for the React UI, `tests/` alongside. This feature adds no directory and no
module. It is a presentation change with one two-column widening in a shared type, so
introducing structure would be exactly the speculative complexity Principle III forbids.

Two files are marked **MUST NOT CHANGE**: `src/client/styles/sheet.css` and
`src/client/components/ChordDiagram.tsx`. Together with the six paper tokens in
`app.css:root`, they constitute the print contract. Their appearance in this feature's
diff is a defect, not a design decision.

## Implementation Sequence

Ordered so the riskiest thing is guarded first and each step is independently verifiable.
`/speckit-tasks` expands this into concrete tasks.

| # | Work | Story | Notes |
|---|------|-------|-------|
| 0 | Capture print baselines to PDF at two formatting settings | — | **Before any edit.** Cannot be reconstructed later |
| 1 | Retarget the accent tokens; add a near-black on-accent label token; comment the token boundary | US1 | Touch only `--app-*`. Verify tile action buttons keep their paper-side palette |
| 2 | Raise tile action buttons to 32 px, stop hover-hiding them | US5 | Research R8 |
| 3 | Widen `VersionRef`; extend the `SELECT`; render key and capo in library sub-rows; add the round-trip test | US2 | Type, server, client and test in one commit (Principle IV) |
| 4 | Widen `api.createVersion`; add key and capo inputs to the song create bar; add saved-state feedback | US3 | Server unchanged — validation already exists |
| 5 | Rebuild the chord catalog as grid plus sticky side panel; ensure the new containers carry `.chrome` | US5 | Research R3. Reuse existing components untouched |
| 6 | Add `favicon.svg` and reference it from `index.html` | US6 | Research R7 |
| 7 | Correct `PRODUCT.md` | — | It currently states focus styles do not exist |
| 8 | Full verification pass: reprint both baselines, print from every screen, contrast sweep, keyboard-only pass, narrow-window check | all | `quickstart.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| Accent change leaks into printed output | Paper tokens frozen; `sheet.css` and `ChordDiagram.tsx` untouched; diff-checked; before/after PDF comparison |
| New chord layout containers miss `.chrome` and print interface chrome | Print-from-every-screen check is an explicit validation step, not an afterthought |
| `#FF8C00` used as a solid fill with white text, shipping a 2.33:1 control | A dedicated on-accent label token, plus a contrast sweep in the validation pass |
| Tile action buttons pick up the chrome accent | They sit on paper and are styled from `--muted` / `--chord` by design; called out in research R2 |
| `sheetText` leaking into the songs list while widening `VersionRef` | Asserted by the added test and stated in the contract |
| Spec/plan drift, since the spec overstates the remaining work | Research R0 carries the requirement-by-requirement gap table; the plan treats satisfied requirements as verification |

## Complexity Tracking

No Constitution Check violations. No entries.
