# Specification Quality Checklist: UI Redesign (Stitch)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-17
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

**Validation run 1 — findings and resolutions:**

- *Color values in FR-002 are near-implementation.* Kept. The hex anchors come from the
  design source (`manifest.json`) and are the substance of a redesign brief, not a
  technical choice. Assumptions section records that they may shift for contrast
  compliance.
- *"Cards vs. list" for the library was deliberately left unspecified.* FR-014 states
  what information must be visible per song, not how it is arranged. Resolved in run 2
  below.
- *Mockup discrepancy resolved without a clarification marker.* The library mockup shows
  a single Tom/Capo pair per song, but those values live on versions and a song can have
  several. FR-014 requires per-version key and capo instead. Recorded in Assumptions.
- *Sidebar contents differ between the two mockups.* Resolved by governing principles
  (no accounts, YAGNI) rather than by asking; every excluded entry is listed in Out of
  Scope with a reason.

**Validation run 2 — owner ruling applied (2026-08-17):**

Owner directed that anything in the export violating a principle or introducing a new
capability be dropped, not adapted. Effects on the spec:

- *The card-grid tension is closed, not deferred.* `PRODUCT.md` names "grades de cards
  idênticos" as an explicit anti-reference, so the mockup's two-column card grid is a
  violation and is rejected. Added FR-034 (density over padding, ≥12 song entries visible
  without scrolling) and SC-009 to make it measurable. The plan no longer has an open
  question here.
- *Added FR-035* — no primary-flow control hidden behind a menu, accordion, or collapsed
  panel; dialogs only for destructive confirmations. Derived from the same density
  principle the ruling endorses.
- *Out of Scope reframed* from "excluded, with reasons" to a ratified drop list. No item
  moved in or out; the ruling confirms every existing exclusion.
- *No new clarification markers introduced.* Checklist remains fully passing.

No open questions remain from this run.

**Validation run 3 — chord catalog mockup folded in (2026-08-17):**

Owner supplied a mockup of the chord catalog, the screen the Stitch export never covered.
Archived as `assets/05-acordes.png`. Effects on the spec:

- *User Story 5 rewritten.* Was a generic "make it match the rest"; is now a concrete
  journey — recognizing an existing shape by scanning a tile grid — with 10 acceptance
  scenarios instead of 4.
- *FR-027 strengthened.* Previously asked for diagrams "legible against the dark surface",
  which invited restyling them for dark. The mockup supplies the better answer: diagrams
  always sit on a light surface, everywhere on screen, and are never restyled. This closes
  the same question for the sheet preview and removes the risk of a diagram that looks
  right on screen and prints wrong.
- *Added FR-036 through FR-043* — tile grid, counted heading, name search with distinct
  empty states, persistent side panel for create/edit, live preview on light surface,
  create-vs-edit state, per-tile edit/delete with accessible labels, discoverable fret
  syntax placeholder.
- *Added SC-010 and SC-011*, and five catalog edge cases.
- *Two more mockup elements dropped* under the standing owner ruling: a "Cifras" nav
  section (maps to nothing that exists) and a duplicated "Configurações" entry.
- *Potential FR-034 conflict examined and resolved in the spec text.* FR-034 rejects
  uniform cards for listing text records; a chord tile exists to hold a picture at readable
  size. The Out of Scope section states the distinction so the plan does not have to
  re-litigate it.
- *One mockup labelling slip recorded* rather than implemented: the preview area is
  labelled "Legenda", which is an existing text field on a chord. Noted in Assumptions.

Checklist remains fully passing. No open questions. Ready for `/speckit-plan`.

**Post-plan correction (2026-08-17):**

`/speckit-plan` audited the shipped stylesheet and found the spec **overstates the
remaining work**. This checklist passed every quality item but missed a completeness
question it does not ask: *does any of this already exist?*

The spec was written from `PRODUCT.md` plus the mockups. `PRODUCT.md` is stale — it claims
the React app lost its dark monospaced panel and that no focus styling exists. Both were
already fixed in the MVP commit. About two thirds of the 43 functional requirements ship
today.

No requirement is wrong, and none was removed: a satisfied requirement is still a
requirement, and it still has to be verified rather than assumed. The correction lives in
`research.md` R0, which carries a requirement-by-requirement gap table, and the plan treats
satisfied requirements as a verification pass instead of construction.

**Lesson for future specs in this repo**: audit the code before writing requirements from a
product brief. `PRODUCT.md` is a design brief, not a status report, and it is now known to
lag the implementation. Correcting it is step 7 of the plan.
