# Contract: Print Output

**Feature**: `001-chord-sheet-mvp` | **Date**: 2026-08-16

Constitution Principle II makes the printed page the contract this project is judged against.
This document states that contract precisely so a plan reviewer, and later the tests and the
manual check, have something concrete to verify against.

The reference implementation is `formatador-cifra.html` at the repository root. It stays in
the repository until the application matches it.

---

## The central rule

**The preview and the printout are the same DOM.** There is one sheet component. Printing
applies `@media print` rules to the page the owner is already looking at. There is no second
render path, no server-side PDF, no canvas snapshot.

Any change that introduces a separate representation for printing violates this contract,
because it creates the possibility of the two diverging silently — the exact failure Principle
II exists to prevent.

---

## Page setup

| Property | Value | Source |
|----------|-------|--------|
| Paper size | A4 | Spec assumption; other sizes out of scope |
| `@page` margin | `0` | Baseline; page margins are applied as padding instead |
| Effective side margins | `fmt_margin_mm` as left/right padding on the header and body containers | Baseline |
| Bottom margin | `fmt_margin_mm` as bottom padding on the body container | Baseline |
| Top space | `fmt_top_extra_mm` as top padding on the sheet | Baseline |

Using `@page { margin: 0 }` and expressing margins as padding is deliberate: browsers handle
CSS multi-column flow inconsistently inside a non-zero `@page` margin box. The baseline
already settled on this and it must not be "simplified" back.

---

## What must not print

`@media print` must hide every application affordance: navigation, the sheet-text editor, the
chord picker, the formatting controls, buttons, and any status or toast UI (FR-019). The
printed page carries only the sheet: header, chord diagrams, and body.

Verification is trivial and mandatory — open the browser's print preview and confirm nothing
but the sheet appears.

---

## Sheet anatomy

```text
┌──────────────────────────────────────────────────────┐
│  Title                              [dia] [dia] [dia] │
│  Artist                             [dia] [dia]       │
│  KEY · CAPO NOTE                                      │
├──────────────────────────────────────────────────────┤   ← rule under the header
│  section heading                                      │
│  chord line          │  chord line     │  chord line  │   ← fmt_columns columns
│  lyric line          │  lyric line     │  lyric line  │
│  …                   │  …              │  …           │
└──────────────────────────────────────────────────────┘
```

- **Header**: title, artist, and a metadata line combining the key label and the capo note
  when either is set (FR-021). A rule separates the header from the body.
- **Diagrams**: top-right of the first page, wrapping right-aligned within a bounded width so
  they never push the body off the page. Absent entirely when the version has no chords — not
  rendered as an empty reserved block.
- **Body**: the parsed sheet flowed into `fmt_columns` columns with a rule between columns.

---

## Typography and colour

Carried over from the baseline. These are part of the contract because the owner's existing
printed sheets look this way.

| Element | Treatment |
|---------|-----------|
| Body text | Monospace — chord alignment above lyrics depends on a fixed advance width |
| Title, artist, headings | Serif |
| Chord lines | Accent colour, bold |
| Section headings | Muted colour, bold, letter-spaced, with space above |
| Lyric lines | Default ink colour |
| Diagram name | Accent colour, monospace, bold |
| Diagram caption | Small, muted |

Body size is `fmt_body_size` in points; line height is `fmt_line_height`, unitless.

---

## Pagination and column rules

- Every chord-and-lyric pair is one block carrying `break-inside: avoid` and
  `page-break-inside: avoid` (FR-015). A chord line must never be separated from the lyric
  line it sits above — that is the single most damaging print regression possible here.
- Section headings carry the same protection.
- The header block does not split.
- Long sheets flow across pages naturally; the diagrams appear on the first page only.

---

## Formatting settings and their effect

| Setting | Range | Effect on the printed page |
|---------|-------|---------------------------|
| `columns` | 1–4 | Number of body columns |
| `bodySize` | 6–16 pt | Body font size |
| `lineHeight` | 1.0–2.0 | Body line spacing |
| `marginMm` | 0–40 mm | Left, right, and bottom page margins |
| `topExtraMm` | 0–40 mm | Extra space above the header |

Changing any control updates the preview immediately, with no reload and no loss of the text
being edited (FR-016). Because preview and print share one DOM, "immediately" and "on paper"
are the same result.

---

## Diagram rendering contract

Ported from the baseline's geometry, extended for frets above 9 (research R4).

- Six vertical string lines, six horizontal fret lines.
- Open position: the top fret line is drawn thick, representing the nut. Not drawn thick when
  the shape starts above the nut or when a capo bar is present.
- Shapes sitting above the fifth fret display the starting fret number beside the grid rather
  than drawing unusable empty frets.
- A barre is drawn when the lowest fretted position repeats across three or more strings, or
  across two strings with a higher fretted note between them.
- Finger numbers, when supplied, are drawn inside the dots.
- Below the grid: `×` for muted strings, a hollow circle for open strings, a filled circle for
  fretted strings.
- With a capo set, a capo bar is drawn above the grid carrying the fret number, and the chord
  name is marked to indicate the shape is relative to the capo.

Geometry is computed by a pure function and asserted in tests (Constitution Principle V); the
SVG rendering is a thin layer over its output.

---

## Acceptance

The contract holds when, for a version the owner has formatted:

1. The browser print preview shows the sheet and nothing else.
2. Column count, body size, line spacing, and margins on paper match the on-screen preview
   (SC-003).
3. No chord line is orphaned from its lyric line at any column or page boundary.
4. Reopening the version later and printing again produces the same pages (SC-002).

These are verified by eye against print preview or an exported PDF. No automated test in scope
substitutes for that check.
