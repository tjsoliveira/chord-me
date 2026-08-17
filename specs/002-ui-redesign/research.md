# Phase 0 Research: UI Redesign (Stitch)

**Feature**: `specs/002-ui-redesign` | **Date**: 2026-08-17

## R0 — Baseline audit: what the spec assumes vs. what already ships

**This is the finding that reshapes the whole feature.**

The spec was written from `PRODUCT.md` and the mockups without auditing the current
stylesheet. `PRODUCT.md` states that "a versão React perdeu isso" (the dark monospaced
panel) and that "hoje **não existe** estilo de foco". Both statements are stale. The MVP
commit (`46a23a9`) already shipped:

- A full dark token set in `src/client/styles/app.css` — `--app-bg: #141210`,
  `--app-surface`, `--app-raised`, `--app-border`, text levels, accent, danger — with
  measured contrast ratios recorded in comments.
- One global `:focus-visible` treatment, explicitly introduced because nothing had focus
  styling before.
- Monospaced type across the whole tool via `--font-ui`.
- Dense `.rowlist` / `.rowitem` rows, commented "replaces the card grids".
- A chord grid whose tiles already carry `background: var(--paper)`, and a
  `.chord-preview` on paper too.
- `prefers-reduced-motion` handling.
- Hardened print isolation: `.chrome` is hidden by explicit class rather than by a
  structural selector, the sheet's ancestor chain collapses to block flow, and `sheet.css`
  declares its own `background` and `color` rather than inheriting from a dark `body`.
- A two-pane version workspace whose editor column has a `minmax(420px, 1fr)` floor,
  commented as "the point of the redesign".

**Decision**: Reframe this feature from "apply a redesign" to "close the gap between the
shipped design and the mockups". Roughly two thirds of the spec's functional requirements
are already satisfied; the plan must verify them rather than rebuild them, and spend its
effort on the genuinely open items.

**Rationale**: Planning work that already exists would produce churn, risk regressing a
print-verified stylesheet, and hide the handful of changes that actually matter.

**Alternatives considered**: Rewriting the stylesheet from the mockups. Rejected — it
would discard measured contrast values and a print isolation strategy whose comments
record the exact bugs they were written to fix.

**Follow-up**: `PRODUCT.md` actively misleads and must be corrected as part of this work.

### Requirement-by-requirement gap table

| Status | Requirements | Evidence |
|--------|--------------|----------|
| **Already satisfied** | FR-001, FR-003…FR-013, FR-015…FR-018, FR-020, FR-022…FR-032, FR-034…FR-038, FR-040, FR-041, FR-043 | `app.css`, `sheet.css`, `main.tsx`, the four page components |
| **Partially satisfied** | FR-019 (no saved-state feedback on the song screen), FR-042 (tile actions are 24 px and hidden until hover), FR-002 (dark + accent shipped, but not the mockups' hues) | `SongPage.tsx:saveMeta`, `.chordcell-actions`, `:root` tokens |
| **Open** | FR-014, FR-021, FR-033, FR-039 | Library shows no key/capo; version creation takes a label only; no favicon link; the chord form sits below the grid |

## R1 — Does the mockup palette survive a contrast check?

**Question**: The manifest specifies `#0D0D0D` background and `#FF8C00` accent. FR-006
requires WCAG AA throughout. Do those values hold?

**Measured**:

| Pairing | Ratio | Verdict |
|---------|-------|---------|
| `#FF8C00` text on `#0D0D0D` | **8.33:1** | Passes AA and AAA comfortably |
| `#FF8C00` as a focus ring / border on `#0D0D0D` | 8.33:1 | Passes the 3:1 non-text floor |
| **White text on `#FF8C00`** | **2.33:1** | **Fails AA badly** |
| Near-black (`#141210`) text on `#FF8C00` | ~8.1:1 | Passes |
| White on today's `#a8410f` | 6.13:1 | Passes — matches the ratio recorded in `app.css` |

**Decision (superseded — see R1a)**: Adopt `#FF8C00` as the accent for text, borders, focus,
and active state. For *solid* accent fills — primary buttons — invert the label to
near-black instead of white. The mockups draw white on orange, which is the one thing in
them that cannot ship.

**Rationale**: The accent hue is the most recognisable part of the redesign and it is
excellent as a foreground. Its failure mode is narrow and specific: it is too light to
carry white text. Dark-on-orange is the standard resolution and reads as deliberate on a
"technical editor" surface.

**Alternatives considered**:
- Darkening the accent until white passes. Rejected — it lands back near the current
  `#a8410f` and abandons the redesign's most visible decision.
- Keeping white text and accepting 2.33:1. Rejected — FR-006 is not negotiable, and the
  primary button is the highest-traffic control in the app.

## R1a — The mockup accent shipped, then was reverted

**Finding**: `#FF8C00` was implemented and immediately rejected on sight by the owner. The
contrast maths in R1 were right and the accent passed every threshold; the problem was
taste, and taste on a tool used daily by one person outranks a mockup.

Two things went wrong that the ratio table could not show:

1. **Solid fills read as warnings.** A primary button went from a dark rust block with a
   white label — which recedes — to a bright orange block with a black label, which is the
   visual grammar of a hazard sign. Principle "the tool does not compete with the artifact"
   is exactly what that breaks.
2. **It severed an echo.** `--app-accent-solid` held `#a8410f`, the same value as the print
   token `--chord`. R2 below treated that as coincidence to be eliminated. It was not
   coincidence — it is why the palette feels of a piece. The highlight in the tool is the
   ink the chord lines print in.

**Decision**: Revert the accent family to `#e5946a` / `#a8410f` / `#c14e13`, with white
labels on solid fills (6.1:1). Keep `--app-on-accent` as a token: it names the relationship
and is where the fix goes if the accent is ever brightened again.

**What survives from R1**: the measurement itself. White on `#FF8C00` is 2.33:1 and can
never ship. That is recorded in the token comment so the trap is not re-entered.

**Not reverted**: the `--app-border-strong` fix (R8a). It had nothing to do with the accent.

## R8a — Control boundaries failed the non-text contrast floor

**Found during implementation**, not planned.

`--app-border-strong: #47423d` measured **1.63:1** against `--app-raised: #23201d`. That
token draws the visible edge of every input, select, secondary button and chip. WCAG 1.4.11
holds the boundary of a user interface component to 3:1, and FR-006 restates it.

**Decision**: `#787066` (3.32:1 on `--app-raised`, 3.83:1 on `--app-bg`), with the two
hardcoded `#5b554e` hover values replaced by a new `--app-border-hover: #8f8578` (4.47:1).

`--app-border` was left alone at 1.35:1. It draws separators and container frames only —
decorative rules, which 1.4.11 does not cover — and raising it would add visual noise the
density principle does not want. The distinction is now recorded in the token comment.

**Why fixed rather than logged**: pre-existing, but FR-006 and SC-005 are in this feature's
scope, and the fix is two values.

## R2 — Keeping the chrome accent away from the print ink

**Question**: `--chord: #a8410f` is a **print contract token** (Principle II) consumed by
`sheet.css` and `ChordDiagram.tsx`. Today `--app-accent-solid` holds the identical value.
Does changing the chrome accent endanger printed output?

**Decision**: Change only the `--app-*` tokens. Leave `--ink`, `--paper`, `--rule`,
`--chord`, `--muted`, `--grey` untouched, byte for byte.

**Amended after R1a**: this section originally called `--app-accent-solid == --chord` a
coincidence to be eliminated, and planned a comment declaring the two groups independent.
That reading was wrong, and the reverted accent restores the shared value. The rule that
survives is narrower and still absolute: **the paper tokens are never edited from the
chrome side.** They may coincide with a chrome token; they may not be changed by one.

**Rationale**: The paper palette is tuned for ink on white and was already adjusted once
for contrast (`--grey`, recorded as R11 in the MVP research). A saturated `#FF8C00` on
paper would be both wrong and a silent print regression.

**Risk**: `.chordcell-actions button` currently styles itself with `--muted` and
`--chord`, because those buttons sit on a paper tile. That coupling is correct and must
survive the accent change — those buttons must **not** pick up `#FF8C00`.

**Alternatives considered**: Unifying screen and print palettes. Rejected outright — it
violates Principle II and inverts the reason the two groups exist.

## R3 — Where the chord creation panel lives

**Question**: FR-039 requires create/edit to happen beside the grid, with the grid staying
visible. Today the form is a `.createbar` **below** the grid, inside a `.page` capped at
`880px`. With 53 chords the owner scrolls past the entire catalog to reach the form, and
once there the grid is off-screen — defeating the point of comparing against existing
shapes.

**Decision**: Give the chord catalog its own two-column layout — a scrolling grid column
and a sticky panel column — rather than the shared `880px` `.page` container. Reuse the
existing `.chordgrid` and `.chordcell` rules unchanged; the panel reuses `.field`,
`button`, and `.chord-preview`. Below a breakpoint the panel returns to a stacked block.

**Rationale**: This is the chord mockup's one genuine structural contribution, and it is
the difference between SC-011 passing and failing. It is a layout change around existing
components, not new machinery.

**Alternatives considered**:
- A modal for chord creation. Rejected — hides the grid, contradicts FR-035, and modal
  dialogs are reserved for destructive confirmation.
- Keeping the form below and adding a "new chord" jump link. Rejected — treats the symptom
  and still leaves the grid off-screen during creation.

## R4 — Key and capo in the library without losing density

**Question**: FR-014 requires each version's key and capo visible in the library, while
FR-034 requires at least 12 song entries visible without scrolling.

**Current shape**: `SongSummary.versions` is `VersionRef[]`, deliberately carrying only
`{ id, label }` — `withVersions()` in `src/server/routes/songs.ts` selects exactly those
columns, with a comment explaining that `sheetText` must never enter a summary response.
The library sub-row prints `"{title} - {label}"` and nothing else.

**Decision**: Widen `VersionRef` to `{ id, label, songKey, capo }` and add the two columns
to the existing `SELECT`. Render them in the sub-row as suffixed metadata, in the muted
text level, matching how the song screen already renders `"Tom G · capo 2ª"`.

**Rationale**: The columns exist on `song_versions` already — no migration, no new query,
no N+1. The sub-row gains a few characters on a line it already occupies, so vertical
density is unchanged and SC-009 is unaffected. The song screen has already proven the
exact phrasing and the "sem tom" placeholder for unset values.

**Alternatives considered**:
- Aggregating keys onto the song row (as the mockup draws it). Rejected in the spec
  already: key and capo belong to versions, and a song can hold several.
- A separate endpoint for version metadata. Rejected — a second round trip for two columns
  already in reach, and an abstraction with one caller (Principle III).

## R5 — Version creation carrying key and capo

**Question**: FR-021 asks for name, key and capo in one submission. How much of the stack
changes?

**Finding**: The server already handles it. `POST /api/songs/:songId/versions` reads
`body.songKey` and `body.capo`, and already runs `validateCapo` on them. The gap is
entirely client-side: `api.createVersion` is typed `{ label: string }`, and the song
screen's create bar renders a single input.

**Decision**: Widen the client call's type and add two compact inputs to the existing
`.createbar`. No server change, no validation change, no contract change.

**Rationale**: The cheapest possible route to the requirement, and it exercises validation
that already exists but is currently unreachable from the UI.

## R6 — Proving the print contract did not move

**Question**: Principle II requires every layout- or typography-touching change to be
verified against real print output. This feature touches tokens and page layout.

**Decision**: Verification is procedural, not automated:

1. Before any change, print one saved version to PDF at default formatting and one at a
   non-default setting (4 columns, body 7, margin 26). Keep both as the baseline.
2. After the changes, print the same two versions with the same settings.
3. Compare page against page: column count, body size, line height, margins, page breaks,
   diagram geometry, capo bar, section headings.
4. Additionally print from the library, song, and chord screens — each must yield nothing,
   confirming `.chrome` still covers every container.

**Rationale**: A pixel-diff harness for browser print output is exactly the speculative
machinery Principle III forbids, for a tool with one user who can hold two PDFs side by
side. Principle V mandates tests for parsing and geometry logic — neither of which this
feature touches.

**Guard**: If any token under the "Paper tokens: PRINT CONTRACT" comment appears in a diff
for this feature, that is a defect, not a design choice.

## R7 — The favicon

**Question**: FR-033 requires a chord-me tab icon.

**Finding**: `src/client/favicon.ico` exists but `index.html` carries no `<link
rel="icon">`, so the browser only finds it by root-path convention — and Vite serves the
client from `src/client`, so it is not reliably picked up. The supplied PNGs are
presentation renders: the artwork sits on a white field with a drop shadow, occupying
about 55% of the canvas.

**Decision**: Reproduce the mark — orange eighth-note fused with a fretboard grid — as a
small full-bleed SVG, referenced explicitly from `index.html`. Adopt `#FF8C00` on `#0D0D0D`
to match the manifest metadata.

**Rationale**: The motif is simple geometry: a note head, a stem, and a fret grid. An
inline SVG stays crisp at every size, needs no build step, and avoids shipping a 500 KB
mockup render as an icon.

**Alternatives considered**: Cropping the supplied PNG. Rejected — the render has a soft
drop shadow baked in that cannot be cleanly removed, and it is far too heavy for a favicon.

## R8 — Tile actions: size and discoverability

**Question**: `.chordcell-actions` buttons are `min-height: 24px` and `opacity: 0` until
hover or focus-within. FR-007 requires a 32 px minimum target, and FR-042 requires edit and
delete to be reachable.

**Decision**: Raise the buttons to the 32 px floor and keep them permanently visible rather
than hover-revealed.

**Rationale**: 24 px fails a stated requirement outright. Hover-reveal additionally fails
Principle "density is respect" in the wrong direction — it hides a control to buy
tidiness, which is the trade the product brief rejects. The tile already has a fixed
footprint; showing the actions costs nothing that scrolling does not already absorb.

**Note**: `:focus-within` already reveals them, so keyboard users were never fully blocked
— but the 24 px target applies to them too.

## Resolved unknowns

No `NEEDS CLARIFICATION` markers remain. Every Technical Context field is resolved from the
existing codebase.
