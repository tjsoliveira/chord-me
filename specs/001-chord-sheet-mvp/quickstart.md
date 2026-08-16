# Quickstart & Validation Guide: Chord Sheet MVP

**Feature**: `001-chord-sheet-mvp` | **Date**: 2026-08-16

How to run the application and how to prove each user story actually works. This is a
validation guide — implementation belongs in `tasks.md` and the code.

---

## Prerequisites

- Node.js 22 LTS or newer
- A Chromium- or WebKit-based browser for printing (its print engine produces the PDF)

## Run

```bash
npm install
npm run dev
```

Two commands, as Constitution Principle "Technology Constraints" requires. `npm run dev`
starts the API on `127.0.0.1:3001` and the UI on `127.0.0.1:5173`; open the UI URL.

Migrations apply automatically at startup, and the chord catalog seeds itself on first run
when the table is empty. There is no separate setup step.

```bash
npm test          # Vitest: parsing, diagram geometry, validation, persistence round-trip
npm run build     # Type-check and build the UI
npm start         # Serve the built UI and the API from one process
```

The database lives at `data/chord-me.db`. Backing up the library is copying that file
(SC-009). Deleting it and restarting yields a fresh, empty library with a seeded catalog
(FR-025).

---

## Validation scenarios

Each scenario maps to a user story in [spec.md](./spec.md). Entity shapes are in
[data-model.md](./data-model.md); endpoints in [contracts/api.md](./contracts/api.md); the
print rules being checked are in [contracts/print-contract.md](./contracts/print-contract.md).

### V1 — Register a song version and print it (User Story 1, P1)

1. From an empty library, create a song with a title and artist.
2. Add a version, paste chord-sheet text containing chord lines above lyric lines and at
   least one section marker on its own line.
3. Confirm in the preview that chord lines are visually distinct from lyric lines, and that
   section markers render as headings.
4. Print to PDF. Confirm no application chrome appears on the page.
5. Stop the server, restart it, reopen the version. The text is intact.

**Passes when**: all five hold, and step 4's page shows only the sheet.
**Covers**: FR-006, FR-007, FR-010, FR-013, FR-014, FR-019, FR-025.

### V2 — Chord catalog and diagram attachment (User Story 2, P2)

1. Open the chord catalog. The seeded shapes are present (FR-004).
2. Create a chord with muted and open strings; confirm the diagram shows `×` for muted and a
   hollow circle for open, below the grid.
3. Create a barre chord whose lowest fretted position repeats across three or more strings;
   confirm a barre is drawn.
4. Create a shape above the fifth fret; confirm the starting fret number appears beside the
   grid instead of a stack of empty frets.
5. Submit an invalid fret pattern — five strings, or an unsupported character. Confirm the
   error names the specific fault and nothing is saved.
6. Attach several chords to a version; confirm the diagrams appear in the preview and the
   printout in the order selected.
7. Set a capo on the version; confirm the header states the capo position and the diagrams
   show the capo bar.
8. Try to delete an attached chord. Confirm the deletion is refused and the blocking versions
   are listed.

**Passes when**: 2–4 and 7 match the diagram rules in the print contract, 5 produces a
specific message, and 8 refuses.
**Covers**: FR-001 through FR-005, FR-009, FR-021.

### V3 — Formatting on the preview screen (User Story 3, P3)

1. Open a saved version with enough text to fill more than one column.
2. Change the column count. The preview reflows; no chord line is separated from its lyric
   line at a column boundary.
3. Change body size, line spacing, margin, and top spacing in turn. The preview updates each
   time without a reload and without losing the text being edited.
4. Print. Column count, text size, spacing, and margins on paper match the preview.
5. Reopen the version. The settings were remembered.
6. Reset formatting. The version returns to the defaults — 3 columns, 8.5 pt, 1.3, 18 mm,
   12 mm.
7. Push the settings to extremes (largest text, most columns). The preview still renders and
   the settings can be dialled back.

**Passes when**: step 4 matches exactly (SC-003) and step 5 shows the settings persisted.
**Covers**: FR-008, FR-015, FR-016, FR-017, FR-018.

### V4 — Library management (User Story 4, P4)

1. Create several songs. Search by part of a title, then by part of an artist; only matches
   are listed.
2. Add a second version to one song with a different key label. Both versions are listed and
   open independently.
3. Edit one version's text and save. The song's other version is unchanged.
4. Delete a version. Confirmation is requested first.
5. Delete a song's only version. The song remains, listed with zero versions — no record
   becomes unreachable.
6. Delete a song. Confirmation is requested; its versions go with it, and the chords those
   versions used still exist in the catalog.

**Passes when**: all six hold, particularly 5 and 6's cascade behaviour.
**Covers**: FR-007, FR-011, FR-012.

### V5 — Parsing edge cases

Paste each of the following into a version and check the preview:

| Input | Expected |
|-------|----------|
| Lyrics only, no chord lines | No line is styled as chords |
| Text containing `<`, `>`, `&` | Characters appear literally, not as markup (FR-020) |
| A very long sheet | Flows across pages; no chord/lyric pair split at a page break |
| Slash chords, extensions, and degree-sign notation on a chord line | The whole line is recognised as chords |

**Covers**: FR-013, FR-015, FR-020, SC-007.

---

## What is verified automatically vs by hand

**Automated (`npm test`)** — the logic Principle V names, because it fails silently:
sheet parsing and line classification, diagram geometry including base fret, barre detection,
open and muted markers and capo offset, fret normalisation and validation, migrations applying
cleanly to an empty file, and versions round-tripping with formatting intact.

**By hand** — CRUD wiring, screen layout, and above all **print fidelity**. No automated check
in scope substitutes for looking at the print preview or an exported PDF. Any layout change
requires re-running V1 step 4 and V3 step 4.
