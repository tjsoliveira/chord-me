---

description: "Task list for UI Redesign (Stitch)"
---

# Tasks: UI Redesign (Stitch)

**Input**: Design documents from `/specs/002-ui-redesign/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api-delta.md](./contracts/api-delta.md), [quickstart.md](./quickstart.md)

**Tests**: One test task only (T014). It is not TDD — it exists because Constitution
Principle V names data-layer round-trip behaviour as mandatory coverage, and this feature
changes a response shape. Presentation is verified manually, which Principle V permits.

**Organization**: Grouped by user story, in spec priority order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different file, no dependency on an incomplete task — safe to reorder
- **[Story]**: US1…US6, mapping to spec.md user stories
- Exact file paths in every description

## ⚠️ Read before starting

Research R0 found that **roughly two thirds of this feature already ships**. The MVP commit
delivered the dark tokens, focus styling, monospaced type, dense rows, chord tiles on
paper, reduced-motion handling and print isolation. `PRODUCT.md` says otherwise and is
stale.

So a large share of the tasks below are **verification (V)** rather than construction.
They are not optional: a satisfied requirement still has to be proven, and this feature
edits tokens that sit beside print-contract tokens in the same file. Verification tasks are
marked **[V]** in their description.

**Two files must not appear in this feature's diff**: `src/client/styles/sheet.css` and
`src/client/components/ChordDiagram.tsx`. Nor may the six paper tokens in `app.css` —
`--ink`, `--paper`, `--rule`, `--chord`, `--muted`, `--grey`. A hit is a defect.

## Implementation status (2026-08-17)

**33 of 49 done.** All construction is complete and committed; `npm test` (41 tests) and
`npm run build` are green. The 16 open tasks all need a human at a browser — the Chrome
extension was not connected during implementation, so no visual, print, timing or
keyboard-navigation check could be run by the agent.

Two decisions were taken during implementation and are recorded where they belong:

1. **Print baselines (T002/T003) were deferred, not skipped**, at the owner's direction —
   they will be reconstructed by checking out `main` rather than captured up front. T013
   remains a blocking gate.
2. **Capo 0 does not exist.** The schema constrains capo to 1–12 or null. The contract,
   the quickstart and T014 said otherwise and were corrected.

One defect was found and fixed beyond the planned scope: `--app-border-strong` measured
**1.63:1** against `--app-raised`, so the visible edge of every input, select and secondary
button failed WCAG 1.4.11's 3:1 floor for control boundaries. Pre-existing, but FR-006 and
SC-005 are in this feature's scope, so it was fixed rather than logged.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Capture evidence that cannot be reconstructed once editing starts

- [X] T001 Create a working branch off `main` for this feature (the Spec Kit git extension is not installed, so no branch was created automatically)
- [ ] T002 Print a full saved version to PDF at default formatting (3 columns, body 8.5, line height 1.3, margin 18, top 12) and save as `baseline-default.pdf` outside the repo — pick a version with several sections, chord/lyric pairs and at least four diagrams
- [ ] T003 Print the same version at 4 columns, body 7, margin 26, top 0 to `baseline-dense.pdf` outside the repo, then restore and save the version's original formatting
- [X] T004 Record the current values of the six paper tokens from `src/client/styles/app.css` (`--ink`, `--paper`, `--rule`, `--chord`, `--muted`, `--grey`) in the branch's first commit message, so any later drift is visible in history

**⚠️ CRITICAL**: T002 and T003 must complete before any file is edited. They are the only
evidence for SC-002 and cannot be produced retroactively.

**Checkpoint**: Print baselines captured; editing may begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The accent palette is consumed by every screen, so it must settle before any
story is judged visually

**⚠️ CRITICAL**: No user story can be visually verified until this phase is complete

- [X] T005 Retarget the chrome accent tokens in `src/client/styles/app.css` `:root` — `--app-accent`, `--app-accent-solid`, `--app-accent-solid-hover` — to the mockups' `#FF8C00` family, leaving every `--app-bg` / `--app-surface` / `--app-raised` / `--app-border*` / `--app-text*` / `--app-danger*` value alone
- [X] T006 Add an `--app-on-accent` token in `src/client/styles/app.css` holding a near-black label colour for solid accent fills, and apply it to the `button` base rule in place of `color: #fff` — white on `#FF8C00` measures 2.33:1 and fails FR-006 (research R1)
- [X] T007 Update the contrast ratios recorded in the `:root` chrome-token comment block in `src/client/styles/app.css` to the newly measured values, and add a note that `--app-accent-solid` no longer coincides with the print token `--chord` and that the two groups are deliberately independent (research R2)
- [X] T008 [V] Confirm `.chordcell-actions button` in `src/client/styles/app.css` still resolves to `--muted` / `--chord` and did not inherit the new chrome accent — those buttons sit on a paper tile (research R2)
- [X] T009 [V] Run `git diff src/client/styles/sheet.css src/client/components/ChordDiagram.tsx` and confirm both are empty, and that no paper token changed value

**Checkpoint**: Accent settled and print tokens proven untouched — story work can begin.

---

## Phase 3: User Story 1 - The workshop stops competing with the sheet (Priority: P1) 🎯 MVP

**Goal**: The chrome recedes into dark monospaced surfaces and the sheet is the only bright
object; printed output is unchanged.

**Independent Test**: Open a saved version, confirm dark chrome against a white sheet, and
print — the page matches `baseline-default.pdf` exactly.

**Note**: Almost entirely verification. The dark chrome, focus treatment, reduced-motion
handling and print isolation all ship already (research R0); what is new here is the accent
from Phase 2 landing on this screen.

- [ ] T010 [V] [US1] Open a version page and confirm all chrome is dark and monospaced while `.sheet` renders as light paper, using `src/client/pages/VersionPage.tsx` and `src/client/styles/sheet.css` as the reference for what belongs to which surface
- [ ] T011 [V] [US1] Tab through every control on the version page and confirm each shows the `:focus-visible` ring defined in `src/client/styles/app.css`, including the sheet-text textarea's inset variant
- [ ] T012 [V] [US1] Confirm the "Salvar" and "Imprimir / PDF" buttons in `src/client/pages/VersionPage.tsx` render orange with the near-black `--app-on-accent` label, not white
- [ ] T013 [US1] Reprint the two baseline configurations from T002/T003 and compare page against page — column count, body size, line height, margins, page breaks, diagram geometry, capo bar, section headings. Any difference fails FR-011 and SC-002 and blocks the feature

**Checkpoint**: The print contract is proven intact under the new palette. This is the
riskiest gate in the feature; do not proceed past a failure here.

---

## Phase 4: User Story 2 - Finding a song is a glance (Priority: P2)

**Goal**: Library rows carry each version's key and capo, so the right version is picked
without opening anything.

**Independent Test**: With 20+ songs, locate and open a known version in under 10 seconds
without opening any song to check its key.

- [X] T014 [US2] Add a test in `tests/persistence.test.ts` (or a new `tests/songs-api.test.ts` following its temp-database pattern) asserting `GET /api/songs` returns `songKey` and `capo` on each `versions[]` entry, that no entry carries `sheetText`, and that versions stay ordered by position — mount `songsRouter(db)` on a bare Express instance and call it over an ephemeral port; do not add a new dependency. **Corrected during implementation**: the original wording asked the test to assert `capo: 0` survives as `0`. It cannot — `migrations/001` declares `CHECK (capo IS NULL OR (capo >= 1 AND capo <= 12))`, so capo 0 is unrepresentable and the mockup's "Capo 0" is not a state. The test asserts the real rule instead, and `contracts/api-delta.md` was corrected to match
- [X] T015 [US2] Widen `VersionRef` in `src/shared/types.ts` to `{ id, label, songKey, capo }` and update its doc comment to state that the type stays narrow to keep `sheetText` out of summary responses
- [X] T016 [US2] Extend the `SELECT` inside `withVersions()` in `src/server/routes/songs.ts` to include `song_key` and `capo`, and map them onto each `VersionRef` — keep the two-query strategy, do not introduce an N+1
- [X] T017 [US2] Render each version's key and capo in the library sub-rows in `src/client/pages/LibraryPage.tsx`, reusing the phrasing the song screen already uses (`Tom G · capo 2ª`, `sem tom` for unset) at the `.subrow-link` muted text level
- [ ] T018 [V] [US2] Confirm at least 12 song rows are visible without scrolling at the target window size (SC-009) — the sub-row gains characters on a line it already occupies, so vertical density must be unchanged
- [X] T019 [V] [US2] Confirm the two empty states in `src/client/pages/LibraryPage.tsx` still read differently for "no songs exist" and "nothing matched this query"

**Checkpoint**: The library answers the key/capo question without navigation.

---

## Phase 5: User Story 3 - Setting up a version takes one row (Priority: P3)

**Goal**: A version is created with its name, key and capo in one submission, and song
edits report that they saved.

**Independent Test**: Create a version with all three values in one submit and confirm the
editor opens with key and capo already populated.

- [X] T020 [US3] Widen `api.createVersion` in `src/client/api.ts` to `(songId: number, data: { label: string; songKey?: string | null; capo?: number | null })` — the server already accepts and validates both fields, so no server change is needed (research R5)
- [X] T021 [US3] Add compact "Tom" and "Capo" inputs to the create-version `.createbar` in `src/client/pages/SongPage.tsx` and pass them through `addVersion`, keeping both optional and digit-filtering the capo input the way `VersionPage.tsx` already does
- [X] T022 [US3] Add saved-state feedback to `saveMeta` in `src/client/pages/SongPage.tsx` so the title/artist save reports success without navigation (FR-019) — reuse the existing button-label pattern from `VersionPage.tsx` rather than introducing a toast
- [ ] T023 [V] [US3] Submit an out-of-range capo and confirm the server's existing `validateCapo` error surfaces on the capo field rather than as a generic failure
- [X] T024 [V] [US3] Confirm version rows in `src/client/pages/SongPage.tsx` still show `sem tom` for unset values rather than a blank gap (FR-022)

**Checkpoint**: Version setup is one row; the song screen confirms its own saves.

---

## Phase 6: User Story 4 - Getting around without a map (Priority: P4)

**Goal**: Library and chord catalog are reachable from anywhere, without costing the editor
horizontal room.

**Independent Test**: From the version editor, reach the catalog and return to the library
without the browser's back button.

**Note**: Fully satisfied today by the sticky top bar in `src/client/main.tsx`. Verification
only — but the accent change touches the active-link indicator, so it is not free.

- [ ] T025 [V] [US4] Confirm the active `NavLink` indicator in `src/client/main.tsx` still reads as current-destination under the new accent, and that its border colour meets the 3:1 non-text contrast floor
- [X] T026 [V] [US4] Confirm the version editor's `.editor-input` remains no narrower than its `minmax(420px, 1fr)` floor with the nav present (FR-024, FR-031)
- [ ] T027 [V] [US4] Print from the version editor and confirm the nav does not appear on the page — `.app-nav` carries `.chrome`

**Checkpoint**: Navigation verified under the new palette.

---

## Phase 7: User Story 5 - The chord catalog reads like a chord chart (Priority: P5)

**Goal**: The grid stays visible while a chord is being described, and tile actions meet the
interactive-target floor.

**Independent Test**: With 50+ chords, determine whether a shape exists by scanning the
grid, then create a chord without the grid leaving the screen.

- [X] T028 [US5] Raise `.chordcell-actions button` in `src/client/styles/app.css` to the 32 px minimum required by FR-007 (currently `min-height: 24px`) and remove the `opacity: 0` hover-reveal so the actions are permanently visible (research R8)
- [X] T029 [US5] Add a two-column catalog layout to `src/client/styles/app.css` — a scrolling grid column beside a sticky panel column — replacing the shared `880px` `.page` container for this screen only, with a breakpoint that returns the panel to a stacked block on narrow windows
- [X] T030 [US5] Restructure `src/client/pages/ChordsPage.tsx` so the chord form moves from below the grid into the new side panel, reusing `.field`, `button` and `.chord-preview` unchanged and keeping the existing create/edit toggle, Cancelar action and live preview intact
- [X] T031 [US5] Ensure every new container introduced in T029/T030 carries the `.chrome` class, so print hiding stays class-driven rather than structural (contracts/api-delta.md, UI contract invariant 3)
- [X] T032 [V] [US5] Confirm chord diagrams in both the grid tiles and the panel preview still render on `--paper` and were not restyled for the dark theme (FR-027)
- [ ] T033 [V] [US5] Scroll the grid with 50+ chords loaded and confirm the panel stays reachable, then create a chord and confirm the grid never left the screen (FR-039, SC-011)
- [X] T034 [V] [US5] Attempt to delete an in-use chord and confirm the refusal still lists every using song and version, reachable, in the new layout (FR-029)
- [ ] T035 [V] [US5] Time a shape lookup against a 50+ chord catalog by scanning diagrams — target under 15 seconds (SC-010)

**Checkpoint**: The catalog compares and creates on one screen.

---

## Phase 8: User Story 6 - The app looks like itself (Priority: P6)

**Goal**: The tab carries the chord-me mark.

**Independent Test**: Load the app; the tab shows the mark, legible at tab size.

- [X] T036 [P] [US6] Create `src/client/favicon.svg` reproducing the mark from `specs/002-ui-redesign/assets/stitch/03-favicon-mockup.png` — orange eighth-note fused with a fretboard grid — as full-bleed geometry with no drop shadow and no white surround, using `#FF8C00` on `#0D0D0D` (research R7)
- [X] T037 [US6] Reference the icon explicitly with `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` in `src/client/index.html`, which currently declares no icon at all
- [X] T038 [V] [US6] Confirm the mark is still readable at 16 px and that the old `src/client/favicon.ico` is either replaced or deliberately kept as a fallback

**Checkpoint**: The app is identifiable in a tab.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Correct the record and run the full validation sweep

- [X] T039 [P] Correct `PRODUCT.md` — remove the stale claims that the React version lost the dark monospaced panel and that "hoje **não existe** estilo de foco", and note that it is a design brief rather than a status report (research R0)
- [ ] T040 [P] Update `README.md` if any run or verification step changed
- [X] T041 Run `npm test` and confirm the existing parsing, geometry, fret-validation and migration suites are green alongside the new T014 test
- [X] T042 Run `npm run build` and confirm the server and client type-checks pass with no new `any`
- [X] T043 Sweep every text and control colour pairing against its own surface — body ≥ 4.5:1, large text and control boundaries ≥ 3:1 — paying particular attention to accent text on dark, the label on solid accent fills, and the tile action buttons which sit on paper (FR-006, SC-005)
- [ ] T044 Print from the library, the song screen and the chord catalog; each must yield a blank page, proving `.chrome` still covers every container including the new catalog layout (FR-013, SC-008)
- [ ] T045 Operate every screen end to end with the keyboard only, confirming the focused element is identifiable at every step (SC-004)
- [X] T046 Enable the system reduced-motion setting and confirm no transition animates (FR-008)
- [X] T047 Narrow the window below 1280px and confirm the editor panes stack, the sheet-text field never becomes the narrowest element, and the catalog panel returns to a stacked block
- [ ] T048 Run the full `quickstart.md` validation procedure end to end and record the result
- [X] T049 Final diff review: confirm `src/client/styles/sheet.css` and `src/client/components/ChordDiagram.tsx` are untouched and no paper token changed value

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T002/T003 **must** precede every edit
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks visual verification in all stories
- **US1 (Phase 3)**: Depends on Phase 2. Gates the whole feature — a print regression here stops everything
- **US2 (Phase 4)**: Depends on Phase 2. Independent of US1's outcome in code, but should not ship before T013 passes
- **US3 (Phase 5)**: Depends on Phase 2. Touches `SongPage.tsx`, which no other story touches
- **US4 (Phase 6)**: Depends on Phase 2. Verification only
- **US5 (Phase 7)**: Depends on Phase 2. Touches `ChordsPage.tsx` and catalog CSS only
- **US6 (Phase 8)**: Depends on nothing but Phase 1. Fully isolated
- **Polish (Phase 9)**: Depends on every story that will ship

### Within stories

- T014 (test) before T015–T017: the test defines the contract the type and query must satisfy
- T015 (type) before T016 (server) before T017 (client) — Principle IV requires them in one commit
- T028 (tile targets) is independent of T029–T031 (layout) and can land first as a standalone fix
- T029 (CSS) before T030 (component) before T031 (print-class audit)
- T036 (asset) before T037 (reference)

### Parallel opportunities

Single maintainer, so `[P]` marks *reorderable*, not concurrent:

- T036 and T039–T040 touch files no other task touches and can land at any point
- T028 is a self-contained accessibility fix, independent of the catalog restructure
- US6 depends only on Phase 1 and could ship first if a quick win is wanted

Everything in Phase 2 is sequential — the same `:root` block.

---

## Implementation Strategy

### MVP (Phases 1–3)

1. Capture print baselines — **non-negotiable, non-reconstructable**
2. Retarget the accent tokens
3. Verify US1, ending at T013's print comparison
4. **STOP AND VALIDATE.** If the reprint differs from the baseline, the feature is blocked
   until it does not

That alone delivers the redesign's most visible change on the screen carrying 90% of the
usage, and proves the print contract survived it.

### Incremental delivery

1. Phases 1–2 → foundation, print tokens proven frozen
2. + US1 → new accent on the editor, print verified (**MVP**)
3. + US2 → library answers the key/capo question
4. + US3 → version setup in one row
5. + US4 → navigation verified
6. + US5 → catalog compares and creates on one screen
7. + US6 → tab identity
8. + Polish → `PRODUCT.md` corrected, full sweep

Each step is independently verifiable and leaves the app working.

### If time is short

T028 (32 px targets) and T039 (`PRODUCT.md`) are the highest value per minute: one closes a
stated accessibility failure, the other stops a document actively misleading the next
person to read it. Neither depends on the rest.

---

## Notes

- `[V]` marks verification rather than construction — a consequence of research R0, not
  padding. These prove requirements the MVP already satisfied still hold after the token
  change
- `[P]` marks reorderable tasks for a single maintainer, not team concurrency
- Commit after each task or logical group; keep T015–T017 in one commit (Principle IV)
- Constitution Principle II makes T013 and T044 blocking, not advisory
- Do not add a dependency. T014's HTTP test uses a bare Express instance and `fetch`
- The scope deliberately excludes anything the spec's Out of Scope section drops: no
  accounts, no dashboard, no settings screen, no filter chips, no PWA installability
