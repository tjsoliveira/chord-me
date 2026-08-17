# Feature Specification: UI Redesign (Stitch)

**Feature Branch**: `002-ui-redesign`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "lê tudo que tá no arquivo /Users/thiagooliveira/Downloads/stitch.zip. Ele é um redesign da nossa UI. Usa isso pra planejar como fazer"

**Refined by**: "do que foi proposto, pode ignorar o que violar algum princípio ou for algo
novo" (owner ruling, see Context) and "vê o que podemos usar essa imagem para alterar nossa
tela de acordes" (chord catalog mockup, `assets/05-acordes.png`)

## Context

The redesign source is a Stitch export, archived in `assets/stitch/` next to this spec so
the feature does not depend on a file in Downloads. It contains:

| Asset | What it shows |
|-------|---------------|
| `01-biblioteca.png` | Library screen: header with title + primary action, sidebar nav, search bar with filter chips, two-column grid of song entries showing Tom and Capo |
| `02-musica-versoes.png` | Song screen: title/artist form with Save + Delete, a Versions table (Nome, Tom, Capo, Ações), and an inline "Adicionar Versão" row |
| `03-favicon-mockup.png` | Favicon concept: orange eighth-note fused with a fretboard grid on black |
| `04-apple-touch-icon-mockup.png` | Same motif at higher fidelity |
| `manifest.json` | App metadata: background `#0D0D0D`, theme `#FF8C00` |
| `recursos_da_web.md` | Notes describing the icon set |

A later mockup, supplied separately and archived as `assets/05-acordes.png`, covers the
chord catalog: sidebar, a counted heading, a full-width name search, a five-column grid of
**white** chord tiles each holding an orange chord name over a black-on-white fret diagram,
and a persistent right-hand creation panel (Nome, Casas, Dedos, Legenda, live preview,
primary action).

The mockups establish a visual language — near-black surfaces, a single saturated orange
accent, monospaced type throughout, hairline-bordered containers, low-chroma body text.
That language is the deliverable of this feature. No mockup covers the version editor with
its live sheet preview, so this spec extends the language to it rather than inventing a
second one.

The chord mockup contributes one idea the rest of the export does not: **chord diagrams sit
on white tiles inside the dark shell**. That resolves the tension between a dark interface
and diagrams drawn for paper — the diagram is never restyled for the dark theme, it is
simply shown on the surface it was designed for. The same reasoning already governs the
sheet preview, so the catalog and the editor end up consistent.

**The mockups are a visual reference, not a functional specification.** Where a mockup
implies a capability the product does not have and does not want (see Out of Scope), the
existing product wins.

**Owner ruling, 2026-08-17**: anything in the export that conflicts with a governing
principle, or that introduces a capability the product does not already have, is dropped
outright rather than adapted or deferred into this feature. This feature adopts the
export's *visual language only*. That ruling is what resolves the Out of Scope list below,
and it settles the library layout question in favor of density (FR-034).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The workshop stops competing with the sheet (Priority: P1)

The owner opens a saved version to reprint it. Everything that is not the chord sheet —
toolbar, panels, navigation, form fields — recedes into a near-black, monospaced,
low-contrast surface. The sheet itself remains a bright white page, visually the only
warm, lit object on screen. The owner's eye lands on the sheet immediately, without
having to filter out interface.

**Why this priority**: This is the single design principle the whole product rests on
("the tool does not compete with the artifact"). Every other screen inherits the tokens
this story establishes. Shipped alone, it already delivers the redesign's core value on
the screen where 90% of the time is spent.

**Independent Test**: Open any saved version. Confirm the chrome is dark and monospaced,
the sheet is unchanged white paper, and printing produces the same page as before the
redesign.

**Acceptance Scenarios**:

1. **Given** a saved version with chord sheet text, **When** the owner opens its page,
   **Then** all interface surfaces render dark and the sheet preview renders as light
   paper, unchanged from the current output.
2. **Given** the version page, **When** the owner prints or exports to PDF, **Then** the
   printed page is visually identical to what the same version printed before the
   redesign — same columns, body size, line height, margins, page breaks, and diagrams.
3. **Given** the version page, **When** the owner moves focus with the keyboard through
   every control, **Then** each focused control shows a clearly visible focus indicator.
4. **Given** unsaved edits, **When** the owner looks at the toolbar and status line,
   **Then** the unsaved state is communicated by a state color, not by decoration.

---

### User Story 2 - Finding a song is a glance, not a search (Priority: P2)

The owner sits down with a specific song in mind. The library shows the saved songs with
enough musical information visible — artist, and the key and capo of the versions — to
pick the right one without opening anything. Typing in the search field narrows the list
by title or artist. Creating a new song is one obvious action.

**Why this priority**: The library is the entry point to every session, and the redesign
changes it the most. It is independently valuable: a faster library pays off even if no
other screen changes.

**Independent Test**: With a library of songs, find and open a specific version in under
10 seconds using only the library screen.

**Acceptance Scenarios**:

1. **Given** a library with saved songs, **When** the owner opens the app, **Then** each
   song entry shows title, artist, and its versions with each version's key and capo.
2. **Given** the library, **When** the owner types part of a title or artist, **Then**
   the list narrows to matching songs as they type.
3. **Given** a search with no matches, **When** the results are empty, **Then** the
   screen states nothing matched that query — distinct from the empty-library state.
4. **Given** an empty library, **When** the owner opens the app, **Then** the screen
   states no songs exist yet and offers song creation as the obvious next action.
5. **Given** any library entry, **When** the owner activates it, **Then** they reach the
   song, and version entries link straight to the version editor.
6. **Given** the owner requests deletion of a song, **When** they activate delete,
   **Then** deletion requires an explicit confirmation naming what will be lost.

---

### User Story 3 - Setting up a version takes one row (Priority: P3)

The owner opens a song, corrects the artist name, and adds a new version. Adding a
version captures its name, key, and capo in a single row, so the version arrives already
labeled with the musical information instead of needing a second trip to the editor. The
existing versions are listed with their key and capo side by side, comparable at a
glance, each with edit and delete actions.

**Why this priority**: Depends on the tokens from P1 but on nothing else, and removes a
real step from the setup flow. Lower than the library because it is visited less often.

**Independent Test**: From a song page, add a version with name, key, and capo in one
submission, and confirm those values are already set when its editor opens.

**Acceptance Scenarios**:

1. **Given** a song with versions, **When** the owner views the song, **Then** the
   versions appear as rows showing name, key, and capo, with per-row edit and delete
   actions.
2. **Given** the add-version row, **When** the owner submits a name with key and capo,
   **Then** the version is created carrying those values.
3. **Given** the add-version row, **When** the owner submits only a name, **Then** the
   version is created with key and capo empty.
4. **Given** a version with no key or capo set, **When** it appears in the list,
   **Then** its empty values are shown as explicit placeholders, never as blank cells
   indistinguishable from a rendering fault.
5. **Given** the owner activates a row's delete action, **When** the action fires,
   **Then** deletion requires explicit confirmation before anything is removed.
6. **Given** edited title or artist, **When** the owner saves, **Then** the saved state
   is visible without leaving the page.

---

### User Story 4 - Getting around without a map (Priority: P4)

From any screen, the owner reaches the song library or the chord catalog directly,
through a persistent navigation element that shows which of the two they are currently
in. Deep inside a version, that navigation does not steal space from the editing area.

**Why this priority**: A genuine gap — the current app has no global navigation — but a
small one for a four-screen tool, and it must not cost the editor any horizontal room.

**Independent Test**: Starting from a version editor, reach the chord catalog and return
to the library without using the browser's back button.

**Acceptance Scenarios**:

1. **Given** any screen, **When** the owner looks at the navigation, **Then** the
   current destination is visually distinguished from the others.
2. **Given** the version editor, **When** navigation is present, **Then** the sheet-text
   editing area remains at least as wide as it is today.
3. **Given** navigation is on screen, **When** the owner prints, **Then** the navigation
   does not appear on the printed page.

---

### User Story 5 - The chord catalog reads like a chord chart (Priority: P5)

The owner opens the catalog to check whether a shape already exists before typing it in.
The chords appear as a grid of white tiles — chord name above, fret diagram below — the
same way a printed chord chart reads, so recognition is by shape, not by reading names one
at a time. A count states how many chords the catalog holds. Typing a name narrows the
grid. Creating a chord happens in a panel that stays on screen beside the grid, with the
diagram preview updating as the fret positions are typed, so the owner sees the shape they
are describing without leaving the grid they are comparing against.

**Why this priority**: The catalog is visited rarely — seeded chords cover most needs —
but leaving one screen in the old style makes the redesign look unfinished, and the tile
grid is the change that makes an existing shape findable at a glance.

**Independent Test**: With a catalog of 50+ chords, find whether a given shape already
exists by scanning the grid, then create a new chord without the grid leaving the screen.

**Acceptance Scenarios**:

1. **Given** the catalog screen, **When** chords are listed, **Then** each appears as a
   tile showing its name and its fret diagram, and the diagram renders on a light surface
   at the same accuracy it prints.
2. **Given** the catalog screen, **When** it loads, **Then** the heading states how many
   chords the catalog holds.
3. **Given** the catalog, **When** the owner types part of a chord name, **Then** the grid
   narrows to matching chords as they type.
4. **Given** a search matching nothing, **When** the grid is empty, **Then** the screen
   states nothing matched — distinct from an empty catalog.
5. **Given** the creation panel, **When** the owner types fret positions, **Then** a live
   diagram preview reflects the input, on the same light surface as the grid tiles.
6. **Given** the creation panel, **When** the owner submits a valid chord, **Then** it
   appears in the grid without the panel or the grid being navigated away from.
7. **Given** invalid chord input, **When** the owner submits, **Then** the offending
   fields are marked with a state color and an error message, not silently rejected.
8. **Given** an existing chord, **When** the owner chooses to edit it, **Then** the same
   panel loads its values and the primary action reflects that this is an edit, not a
   creation.
9. **Given** a chord used by at least one version, **When** the owner attempts deletion,
   **Then** the deletion is refused and every song and version using it is listed and
   reachable.
10. **Given** any chord tile, **When** the owner needs to edit or delete it, **Then** both
    actions are reachable from the tile, with accessible labels if shown as icons.

---

### User Story 6 - The app looks like itself in the browser (Priority: P6)

The owner keeps the app open in a tab alongside other work and identifies it by its icon.

**Why this priority**: Pure polish. Zero functional weight, trivial to add once the
palette is settled.

**Independent Test**: Load the app and confirm the tab icon is the chord-me mark, not a
default or placeholder.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the owner looks at the browser tab, **Then** the
   chord-me icon is shown at tab size and remains legible.
2. **Given** the supplied icon files are presentation renders (drop shadow, white
   surround), **When** the icon ships, **Then** it is a clean full-bleed asset with no
   mockup framing.

### Edge Cases

- A song with a long title, or an artist field left empty, must not break the library
  entry layout or push its key/capo information out of view.
- A song with many versions must not make its library entry grow without bound.
- A version whose key or capo is unset must render an explicit placeholder everywhere
  those values appear.
- Chord diagrams are drawn for paper. On a dark surface they must not become
  low-contrast smudges, and the dark treatment must not follow them onto the page.
- The chord-sheet editing field must never become the narrowest element on screen, at any
  window width, with navigation present.
- The redesign must respect a reduced-motion preference: any transition it introduces is
  suppressed when the system asks for reduced motion.
- Every text and control color pairing must meet the contrast floor; a saturated accent
  on near-black fails easily at small sizes and must be verified, not assumed.
- Printing from any screen must produce the chord sheet alone — no navigation, toolbar,
  or panel chrome.
- A chord with an unusually long name must not overflow or distort its tile, and must not
  push the diagram out of alignment with neighbouring tiles.
- A catalog large enough to scroll must keep the creation panel and its live preview
  reachable while the grid scrolls.
- Editing a chord that is in use must make clear the change affects every version that
  already selected it.
- Starting an edit and then navigating or searching must not silently discard the panel's
  in-progress values without the owner noticing.

## Requirements *(mandatory)*

### Functional Requirements

**Visual system**

- **FR-001**: The interface MUST use a single documented set of design tokens — surfaces,
  text levels, borders, accent, and state colors — defined once and consumed by every
  screen. No screen may introduce a one-off color.
- **FR-002**: All interface chrome MUST use near-black surfaces with a single saturated
  orange accent, matching the mockups' palette (`#0D0D0D` background family, `#FF8C00`
  accent family).
- **FR-003**: The accent color MUST be reserved for the primary action, the current
  navigation destination, focus, and active state. It MUST NOT be used decoratively.
- **FR-004**: Interface typography MUST be monospaced, consistent with the mockups and
  with the chord-sheet content it frames.
- **FR-005**: Every interactive element MUST show a visible focus indicator that meets
  the contrast floor against its own surface.
- **FR-006**: Every text and control color pairing MUST meet WCAG AA contrast: 4.5:1 for
  body text, 3:1 for large text and for the boundaries of interactive controls.
- **FR-007**: Interactive targets MUST be at least 32 px on their smallest dimension.
- **FR-008**: Any transition introduced MUST be suppressed under a reduced-motion
  preference.
- **FR-009**: Color and motion MUST signal state only — focus, error, saved, unsaved,
  selected, blocked. Purely decorative color or motion is forbidden.
- **FR-034**: Layouts MUST favor density over padding. The uniform card grid shown in the
  library mockup is rejected: it is named as an explicit anti-reference in the product
  brief. At the target window size, at least 12 song entries MUST be visible without
  scrolling.
- **FR-035**: No control that belongs to a primary flow may be hidden behind a menu,
  accordion, or collapsed panel. Dialogs are permitted only for destructive confirmations.

**Print protection (non-negotiable)**

- **FR-010**: The dark treatment MUST NOT reach the chord sheet. The sheet renders as
  light paper on screen and on paper, before and after this feature.
- **FR-011**: Printed output — column count, body size, line height, margins, page
  breaks, chord-diagram geometry, capo bar, section headings — MUST be unchanged by this
  feature.
- **FR-012**: The preview and the printout MUST remain the same rendered element. This
  feature MUST NOT introduce a second render path for the sheet.
- **FR-013**: Navigation, toolbars, panels, and form chrome MUST be excluded from printed
  output from every screen.

**Library**

- **FR-014**: The library MUST show, for each song, its title, its artist, and its
  versions, with each version's key and capo visible.
- **FR-015**: The library MUST provide search that filters by title or artist as the
  owner types.
- **FR-016**: The library MUST distinguish "no songs exist" from "no songs match this
  search" in its empty state.
- **FR-017**: The library MUST offer song creation as a visible primary action.
- **FR-018**: Library entries MUST link to the song, and version entries MUST link
  directly to the version editor.

**Song**

- **FR-019**: The song screen MUST allow editing title and artist and MUST show when
  changes are saved.
- **FR-020**: The song screen MUST list versions as rows showing name, key, and capo,
  each with edit and delete actions.
- **FR-021**: Version creation MUST accept name, key, and capo in a single submission,
  with key and capo optional.
- **FR-022**: Unset key or capo MUST render as an explicit placeholder wherever it
  appears.

**Version editor**

- **FR-023**: The version editor MUST keep the chord-sheet text field and the live sheet
  preview visible at the same time.
- **FR-024**: The chord-sheet text field MUST NOT be the narrowest element on screen at
  any supported window width.
- **FR-025**: The version editor MUST show unsaved state, saving state, and saved state
  distinctly, and MUST keep its existing save and print keyboard shortcuts working.
- **FR-026**: Formatting controls MUST remain a compact strip in the toolbar, one row
  above the preview, so a change and its effect are visible together. They MUST NOT be
  moved behind a menu, dialog, or collapsed panel.

**Chord catalog**

- **FR-027**: Chord diagrams MUST be presented on a light surface wherever they appear on
  screen — catalog tiles, creation preview, and sheet preview alike. The diagram's own
  rendering MUST NOT be restyled for the dark theme, and its printed rendering MUST stay
  unchanged.
- **FR-028**: The catalog MUST report validation failures against the specific offending
  fields.
- **FR-029**: Attempting to delete an in-use chord MUST be refused, and every song and
  version using it MUST be listed and reachable.
- **FR-036**: The catalog MUST present chords as a grid of tiles, each showing the chord
  name and its fret diagram together.
- **FR-037**: The catalog heading MUST state the number of chords currently listed.
- **FR-038**: The catalog MUST provide a name search that filters the grid as the owner
  types, and MUST distinguish "no chords match this search" from "the catalog is empty".
- **FR-039**: Chord creation and editing MUST happen in a panel that remains visible
  alongside the grid — the owner MUST NOT have to navigate away from the grid to add or
  change a chord.
- **FR-040**: The creation panel MUST show a live diagram preview that updates as fret
  positions are typed, rendered on the same light surface as the grid tiles.
- **FR-041**: The creation panel MUST indicate whether it is creating a new chord or
  editing an existing one, and MUST offer a way to abandon an in-progress edit and return
  to a clean creation state.
- **FR-042**: Edit and delete MUST be reachable for every chord in the grid, carrying
  accessible labels when presented as icons.
- **FR-043**: The fret-position field MUST show, as placeholder text, an example of the
  accepted input formats so the syntax is discoverable without documentation.

**Navigation and destructive actions**

- **FR-030**: A persistent navigation element MUST reach the song library and the chord
  catalog from any screen and MUST indicate the current destination.
- **FR-031**: Navigation MUST NOT reduce the width available to the chord-sheet editing
  area below its current width.
- **FR-032**: Every destructive action — delete song, delete version, delete chord — MUST
  require an explicit confirmation that names what will be lost. Icon-only delete
  affordances MUST carry an accessible label.

**Identity**

- **FR-033**: The app MUST ship a browser tab icon using the chord-me mark, legible at
  tab size, produced as a clean full-bleed asset without the mockup's drop shadow or
  white surround.

### Key Entities

This feature adds no entities and changes no stored data shapes. It consumes the existing
model:

- **Song**: title, artist, and its ordered versions.
- **Song Version**: name, key, capo, chord-sheet text, its saved formatting settings, and
  the chords selected for its diagram row. Key and capo belong to the version, not to the
  song — a song can carry several versions in different keys.
- **Chord**: name, fret positions, optional fingering and caption; shared catalog reused
  across versions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reprinting a saved sheet still takes under 30 seconds from opening the app,
  unchanged by the redesign.
- **SC-002**: A sheet printed after the redesign is visually indistinguishable from the
  same sheet printed before it, compared page against page.
- **SC-003**: The owner locates and opens a known song from a library of at least 20
  songs in under 10 seconds without opening any song to check its key.
- **SC-004**: Every screen can be operated end to end using only the keyboard, with the
  focused element identifiable at every step.
- **SC-005**: 100% of text and control color pairings pass their WCAG AA contrast
  threshold when measured.
- **SC-006**: Creating a version with name, key, and capo takes one submission, down from
  two steps today.
- **SC-007**: No screen retains the pre-redesign styling once the feature ships.
- **SC-008**: Printing from any screen yields the chord sheet alone, with zero interface
  elements on the page.
- **SC-009**: At least 12 song entries are visible in the library without scrolling at the
  target window size.
- **SC-010**: With a catalog of 50 or more chords, the owner determines whether a given
  shape already exists in under 15 seconds, by scanning diagrams rather than reading names
  one by one.
- **SC-011**: Creating a chord requires no navigation away from the catalog grid — the
  grid stays visible for the whole operation.

## Out of Scope

The mockups show navigation entries and capabilities that the product deliberately does
not have. Per the owner ruling above, each is dropped rather than adapted:

- **"Perfil" / user accounts** — the app is single-user and login-free by governing
  principle. No account concept may be introduced.
- **"Dashboard"** — no metric or overview exists that would justify a screen; the library
  is the entry point.
- **"Artistas" as a browsable section** — artist is a field on a song, not an entity.
  Search already covers finding by artist.
- **"Configurações"** — formatting settings live per version, by design, so they reprint
  identically. A global settings screen has nothing to hold.
- **Filter chips ("ARTISTA" / "TOM")** — a filter mechanism beyond the existing search is
  a new capability, not a redesign. Deferred until search proves insufficient.
- **PWA installation / standalone display** — the app is never hosted and runs from
  localhost; installability adds machinery for no gain. Only the tab icon and the color
  metadata are adopted from the manifest.
- **Data model changes** — no new fields, no migrations. Key and capo already exist on
  versions.
- **Changes to sheet parsing, diagram geometry, or formatting behavior** — this feature
  is chrome only.
- **The uniform card grid** — rejected by FR-034 as an anti-reference violation. The
  library's information requirements (FR-014) stand; the card presentation does not.
- **"Cifras" as a navigation section** (chord catalog mockup) — the product has songs and
  a chord catalog. A third "cifras" section maps to nothing that exists and would be a new
  capability. Dropped.
- **The duplicated "Configurações" entry** in the chord mockup's sidebar — a mockup
  artifact, and settings are already out of scope.

Note that the chord tile grid is **not** excluded by FR-034. FR-034 rejects uniform cards
as a way of listing *text records*, where they waste space that a dense row would use
better. A chord is a picture: the tile exists to hold a diagram at a readable size, and the
grid is how printed chord charts have always been laid out. Different content, different
verdict.

## Assumptions

- The mockups' two screens define the visual language; the version editor and chord
  catalog inherit it by extension rather than getting a separately designed look.
- The exact hex values in `manifest.json` (`#0D0D0D`, `#FF8C00`) are the intended anchors
  and may be adjusted only as far as contrast compliance requires.
- The mockups show a fixed desktop viewport. The app is used on a desktop browser at
  roughly that size; phone layouts are not a target, though the layout must not collapse
  if the window is narrowed.
- Interface language stays Portuguese, as in the mockups and the current app.
- Icon files in the export are presentation renders, not shippable assets, and the mark
  must be reproduced cleanly to ship.
- The supplied icons show a fretboard motif; guitar-oriented iconography is correct for
  this product.
- The mockups differ in their sidebar contents across all three screens. The narrowest
  set — songs and chords — is treated as the accurate one, since it matches what the
  product actually has.
- The chord mockup labels its diagram preview area "Legenda". In the existing model,
  *Legenda* is a text caption stored on a chord, separate from the diagram. The label is
  read as a mockup slip: the preview keeps its own identity, and Legenda remains a text
  field alongside Nome, Casas, and Dedos.
- The chord mockup shows no edit or delete affordance on its tiles. Those capabilities
  exist today and are treated as omitted from the drawing, not removed from the product
  (FR-042).
- The chord tiles are assumed to show name and diagram only. Fingering and caption remain
  editable fields but are not required on the tile face.
