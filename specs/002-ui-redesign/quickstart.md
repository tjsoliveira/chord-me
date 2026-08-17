# Quickstart & Validation: UI Redesign (Stitch)

**Feature**: `specs/002-ui-redesign` | **Date**: 2026-08-17

How to run the app and prove this feature works. Details live in
[`spec.md`](./spec.md), [`research.md`](./research.md),
[`data-model.md`](./data-model.md), and [`contracts/api-delta.md`](./contracts/api-delta.md).

## Prerequisites

```bash
npm install
```

Existing library data in `data/chord-me.db`. For the density and scanning criteria
(SC-009, SC-010) you need at least 20 songs and 50 chords; the seeded chord catalog
already supplies the chords.

## Run

```bash
npm run dev     # API on 127.0.0.1:3001, client on 127.0.0.1:5173
npm test        # parsing, geometry, fret validation, migrations
npm run build   # type-check server + client, build client
```

## Step 0 — Capture the print baseline BEFORE changing anything

**Do this first. It cannot be reconstructed afterwards.** Principle II makes printed output
the contract, and this feature touches tokens and layout.

1. Open a saved version with a full sheet — several sections, chord/lyric pairs, at least
   four diagrams.
2. Print to PDF at default formatting (3 columns, body 8.5, line height 1.3, margin 18,
   top 12). Save as `baseline-default.pdf`.
3. Change to 4 columns, body 7, margin 26, top 0. Print to PDF as `baseline-dense.pdf`.
4. Restore the version's original formatting and save.

Keep both files outside the repo. They are the evidence for SC-002.

## Validating each user story

### US1 — The workshop stops competing with the sheet (P1)

Mostly a verification pass: the dark chrome, focus treatment, reduced-motion handling and
print isolation already ship (research R0). What is new is the accent hue.

1. Open a version. The chrome is dark and monospaced; the sheet is white paper.
2. Tab through every control on the page. Each focused control shows a visible ring.
3. Primary buttons ("Salvar", "Imprimir / PDF") render orange with a **near-black** label,
   not white (research R1 — white on `#FF8C00` measures 2.33:1).
4. Edit the sheet text. The status line reads "não salvo · ⌘S"; press ⌘S; it reads "salvo".
5. `git diff src/client/styles/sheet.css` is empty, and `git diff` shows no change to
   `--ink`, `--paper`, `--rule`, `--chord`, `--muted`, or `--grey`. **A hit here is a
   defect** (research R6).

**Print check**: reprint both baseline configurations and compare page against page —
column count, body size, line height, margins, page breaks, diagram geometry, capo bar,
section headings. Any difference fails FR-011 and SC-002.

### US2 — Finding a song is a glance (P2)

1. Open the library. Each song row shows title, artist, version count; each version
   sub-row shows its own key and capo (`Original · Tom G · capo 2ª`).
2. A version with no key shows an explicit placeholder, not a blank gap.
3. A version with no capo shows no capo text at all. Capo is 1–12 or unset — the schema
   has no encoding for capo 0, so the mockup's "Capo 0" is not a state to represent.
4. Type a partial title, then a partial artist. Both narrow the list.
5. Type nonsense. The screen says nothing matched that query — different wording from an
   empty library.
6. Count visible rows at the target window size without scrolling: **at least 12** (SC-009).
7. `curl -s 'http://127.0.0.1:3001/api/songs' | head -40` — `versions[]` entries carry
   `songKey` and `capo`; **no entry carries `sheetText`**.

### US3 — Setting up a version takes one row (P3)

1. Open a song. The version rows show name, key, and capo (this already ships).
2. Edit the artist, save. A saved indication appears without leaving the page (FR-019 —
   currently missing).
3. In the create bar, enter name + key + capo and submit once. The editor opens with both
   values already populated.
4. Submit a name alone. The version is created with key and capo empty.
5. Enter an out-of-range capo. The server's existing `validateCapo` rejects it and the
   error lands on the capo field, not as a generic failure.
6. Delete a version. Confirmation is required before anything is removed.

### US4 — Getting around without a map (P4)

Already ships as a sticky top bar (`main.tsx`), which costs the editor no horizontal room.

1. From the version editor, reach Acordes and return to Músicas without the browser's back
   button.
2. The current destination is visually distinguished.
3. Print from the version editor: the nav does not appear on the page.

### US5 — The chord catalog reads like a chord chart (P5)

1. Open Acordes. Chords appear as a grid of tiles, name over diagram, on white tiles inside
   the dark shell.
2. The heading states the count.
3. The creation panel is visible **beside** the grid, not below it. Scroll the grid — the
   panel stays reachable (FR-039).
4. Type fret positions. The preview updates live, on the same light surface as the tiles.
5. Submit a valid chord. It appears in the grid and the grid never left the screen (SC-011).
6. Submit an invalid fret string. The offending field is marked; the message is specific.
7. Click Editar on a tile. The panel loads its values and the primary action reflects that
   this is an edit. Cancel returns to a clean creation state.
8. Measure a tile's action buttons: **at least 32 px** on the smallest dimension, and
   visible without hovering (research R8).
9. Attempt to delete a chord used by a version. Refused, with every using song and version
   listed and reachable.
10. With 50+ chords loaded, time how long it takes to determine whether a shape exists by
    scanning diagrams: **under 15 seconds** (SC-010).

### US6 — The app looks like itself (P6)

1. Load the app. The tab shows the chord-me mark, not a default globe.
2. Shrink the tab or check at 16 px — the mark is still readable as a mark.
3. The icon is full-bleed: no drop shadow, no white surround (the supplied PNGs are
   presentation renders, research R7).

## Cross-cutting checks

**Print isolation from every screen** (FR-013, SC-008). Print from the library, the song
screen, and the chord catalog. Each must produce a blank page — proving `.chrome` still
covers every container, including the chord catalog's new two-column layout.

**Contrast** (FR-006, SC-005). Measure every text and control pairing against its own
surface: body text ≥ 4.5:1, large text and control boundaries ≥ 3:1. Pay particular
attention to accent text on dark, the label on solid accent fills, and the tile action
buttons, which sit on paper rather than on chrome.

**Reduced motion** (FR-008). Enable the system reduced-motion setting; no transition
animates.

**Keyboard only** (SC-004). Operate every screen end to end without a mouse, with the
focused element identifiable at every step.

**Narrow window**. Shrink below 1280px. The version editor's two panes stack, the sheet
text field never becomes the narrowest element (FR-024), and the chord panel returns to a
stacked block.

## Regression suite

```bash
npm test
```

Existing coverage — parsing, diagram geometry, fret validation, migrations — must stay
green. This feature adds one test: `GET /api/songs` returns `songKey` and `capo` on version
refs and still omits `sheetText`. That is data-layer round-trip behaviour, which Principle V
names explicitly.

No new tests are added for presentation. Principle V allows CRUD wiring and pure
presentation to be verified manually, and this feature is almost entirely presentation.

## Done when

- Both print comparisons show no difference.
- Every checklist item above passes.
- `PRODUCT.md` no longer claims focus styles are missing or that the dark panel was lost
  (research R0) — it currently misdescribes the shipped app.
