# Feature Specification: Chord Sheet MVP

**Feature Branch**: `001-chord-sheet-mvp`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "mvp" — expanded from the project brief: replace the static
`formatador-cifra.html` with a basic, login-free application that lets the owner create
reusable chord diagrams, register songs with multiple versions, and edit chord-sheet
formatting on a print-preview screen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register a song version and print it (Priority: P1)

The owner opens the application, creates a song by giving it a title and artist, pastes
the chord-sheet text (chord lines above lyric lines, section markers like `[Intro]`) into
a version of that song, sees the sheet laid out as it will print, and produces a PDF or
paper printout.

**Why this priority**: This is the entire reason the project exists and the direct
replacement for the static HTML file. With only this story shipped, the owner already has
a working tool that beats the current file, because the pasted sheet is now saved and can
be reprinted later without re-pasting.

**Independent Test**: Create one song with one version, paste chord-sheet text, confirm
the preview renders chord lines, lyric lines and section headings distinctly, print to
PDF, close the app, reopen it, and confirm the same song reprints identically.

**Acceptance Scenarios**:

1. **Given** an empty library, **When** the owner creates a song with a title and artist
   and saves a version containing pasted chord-sheet text, **Then** the song appears in
   the library and its version opens showing a print preview of the sheet.
2. **Given** a version whose text has a chord line directly above a lyric line, **When**
   the preview renders, **Then** the chord line is visually distinguished from the lyric
   line and the two stay together on the same page and in the same column.
3. **Given** a version whose text contains a section marker line (for example `[Intro]`
   or `Refrão`), **When** the preview renders, **Then** that line is styled as a section
   heading rather than as lyrics.
4. **Given** an open version preview, **When** the owner triggers printing, **Then** the
   printed A4 output shows the sheet without any application controls, toolbars, or
   navigation.
5. **Given** a saved song version, **When** the application is closed and reopened,
   **Then** the version is still present with its text intact.

---

### User Story 2 - Build a reusable chord catalog and attach chords to a version (Priority: P2)

The owner maintains a catalog of chord shapes. Each entry has a chord name, the fret
pattern per string, optionally which finger goes where, and an optional caption note. When
editing a song version, the owner picks chords from this catalog, and the chosen diagrams
are drawn on the printed sheet.

**Why this priority**: The brief calls this out explicitly and it is what removes the most
manual work from the current file, where diagram definitions must be retyped for every
sheet. It is second because a sheet can already be printed without diagrams.

**Independent Test**: Add a chord to the catalog, verify it renders as a correct diagram
in the catalog screen, attach it to a song version, and confirm it appears on that
version's printed sheet.

**Acceptance Scenarios**:

1. **Given** the chord catalog, **When** the owner creates a chord with a name and a fret
   pattern, **Then** the chord is saved and a diagram preview is shown immediately.
2. **Given** a chord whose fret pattern includes muted and open strings, **When** the
   diagram renders, **Then** muted strings show a mute marker and open strings show an
   open marker below the grid.
3. **Given** a chord whose lowest fretted position is repeated across three or more
   strings, **When** the diagram renders, **Then** a barre is drawn across those strings.
4. **Given** a chord positioned above the fifth fret, **When** the diagram renders,
   **Then** the starting fret number is shown beside the grid instead of drawing an
   unusable number of empty frets.
5. **Given** a song version being edited, **When** the owner selects chords from the
   catalog, **Then** those diagrams appear in the version's preview and printout in the
   selected order.
6. **Given** a version whose capo position is set, **When** the diagrams render, **Then**
   each diagram indicates the capo and the sheet header states the capo position.
7. **Given** a chord that is attached to at least one song version, **When** the owner
   tries to delete it from the catalog, **Then** the application refuses and lists the
   song versions that use it.

---

### User Story 3 - Adjust and save formatting on the print-preview screen (Priority: P3)

On the preview screen the owner changes how the sheet is laid out — number of columns,
body text size, line spacing, page margins, extra top spacing — and sees the preview update
as the printed page will look. Those settings are saved with that song version, so the
sheet reprints the same way next time.

**Why this priority**: The current file already offers these controls, so this story is
about parity plus persistence. It ranks third because sensible defaults let stories 1 and
2 deliver value first.

**Independent Test**: Open a saved version, change column count and body size, confirm the
preview reflows, print and confirm paper matches the preview, then reopen the version and
confirm the settings were remembered.

**Acceptance Scenarios**:

1. **Given** an open version preview, **When** the owner changes the column count,
   **Then** the preview reflows into that many columns and no chord/lyric pair is split
   across a column boundary.
2. **Given** an open version preview, **When** the owner changes body size, line spacing,
   margin, or extra top spacing, **Then** the preview updates without the owner having to
   reload or re-enter the sheet text.
3. **Given** formatting settings that were changed and saved, **When** the version is
   reopened later, **Then** the same settings are applied automatically.
4. **Given** a version with saved formatting, **When** the sheet is printed, **Then** the
   printed page margins, column count, and text size match what the preview showed.
5. **Given** a version with modified formatting, **When** the owner resets formatting,
   **Then** the version returns to the application's default settings.

---

### User Story 4 - Manage a growing library of songs and versions (Priority: P4)

The owner accumulates songs over time and needs to find them, keep several versions of the
same song side by side (different keys or arrangements), and edit or remove entries.

**Why this priority**: Only becomes necessary once enough material exists. The first three
stories are usable with a handful of songs.

**Independent Test**: Create several songs, add a second version to one of them, find a
song by typing part of its title, edit it, and delete a version.

**Acceptance Scenarios**:

1. **Given** a library with several songs, **When** the owner types part of a title or
   artist into the search field, **Then** only matching songs are listed.
2. **Given** an existing song, **When** the owner adds a second version with a different
   key label, **Then** both versions are listed under that song and can be opened
   independently.
3. **Given** an existing version, **When** the owner edits its text, chords, or metadata
   and saves, **Then** the changes persist and the other versions of that song are
   unaffected.
4. **Given** an existing song or version, **When** the owner deletes it, **Then** the
   application asks for confirmation before removing it.
5. **Given** a song with exactly one version, **When** that version is deleted, **Then**
   the application makes clear whether the song remains with no versions or is removed,
   and does not leave an unreachable record.

---

### Edge Cases

- Pasted text contains only lyrics with no chord lines: the sheet renders as plain text
  blocks without any line being mistaken for chords.
- Pasted text contains a lyric line made entirely of words that look like chord names: the
  application may misclassify it; the owner MUST be able to see and correct the result by
  editing the text, and the misclassification MUST NOT corrupt the stored text.
- Pasted text is very long: it flows across multiple printed pages, with chord/lyric pairs
  and section headings never split across a page break.
- Pasted text contains characters with special meaning in markup: they render literally on
  the sheet, not as formatting.
- A chord's fret pattern is incomplete, too long, or contains unsupported characters: the
  application rejects it with a message naming the problem instead of drawing a broken
  diagram.
- Two chords are created with the same name but different shapes: both are allowed and are
  distinguishable when selecting chords for a version.
- A version has no chords attached: the sheet prints with the diagram area absent, not as
  an empty gap that shifts the layout.
- A version has many chords attached: diagrams wrap within the header area without pushing
  the sheet body off the first page.
- Formatting settings are pushed to extremes (largest text with most columns): the preview
  still renders and the owner can back the settings off; the application does not become
  unresponsive.
- The stored data file is missing or newly created: the application starts with an empty
  library and a usable default chord catalog rather than failing.

## Requirements *(mandatory)*

### Functional Requirements

**Chord catalog**

- **FR-001**: System MUST let the owner create, view, edit, and delete chord entries,
  where an entry consists of a chord name, a six-string fret pattern, an optional finger
  assignment per string, and an optional caption.
- **FR-002**: System MUST render each chord entry as a fret diagram showing fretted
  positions, open strings, muted strings, finger numbers when supplied, barres, and the
  starting fret number when the shape sits above the open position.
- **FR-003**: System MUST validate chord fret patterns and reject invalid ones with a
  message that identifies what is wrong.
- **FR-004**: System MUST ship with a starter catalog of common chord shapes so the owner
  can register a song without first defining every chord.
- **FR-005**: System MUST prevent deletion of a chord that is attached to any song version
  and MUST show which versions use it.

**Songs and versions**

- **FR-006**: System MUST let the owner create, view, edit, and delete songs, where a song
  carries at minimum a title and an artist.
- **FR-007**: System MUST let a single song hold multiple versions, each independently
  editable and printable.
- **FR-008**: Each version MUST store its chord-sheet text, an optional key label, an
  optional capo position, its selected chord diagrams in a defined order, and its
  formatting settings.
- **FR-009**: System MUST let the owner attach chords to a version by selecting them from
  the catalog, reorder them, and detach them.
- **FR-010**: System MUST persist every song, version, and chord to local storage so all
  data survives closing and reopening the application.
- **FR-011**: System MUST require confirmation before deleting any song, version, or
  chord.
- **FR-012**: System MUST let the owner find songs by matching text against title and
  artist.

**Sheet rendering and print preview**

- **FR-013**: System MUST parse the version's chord-sheet text and classify each line as a
  chord line, a lyric line, a section heading, or a blank separator, keeping a chord line
  bound to the lyric line immediately below it.
- **FR-014**: System MUST render the parsed sheet as an on-screen preview that represents
  the printed A4 page, including the header (title, artist, key, capo) and the attached
  chord diagrams.
- **FR-015**: System MUST keep chord/lyric pairs and section headings from being split
  across a column or page boundary.
- **FR-016**: System MUST let the owner adjust column count, body text size, line spacing,
  page margin, and extra top spacing from the preview screen, with the preview updating to
  reflect each change.
- **FR-017**: System MUST save formatting settings against the version so reopening it
  restores the same layout, and MUST offer a reset to defaults.
- **FR-018**: System MUST produce printed output that matches the preview in column count,
  text size, line spacing, margins, and page breaks.
- **FR-019**: System MUST exclude all application controls, navigation, and editing
  affordances from printed output.
- **FR-020**: System MUST render the sheet text literally, so characters with special
  meaning in markup appear as typed.
- **FR-021**: System MUST indicate the capo position both in the sheet header and on the
  rendered chord diagrams when a capo is set for the version.

**Application shape**

- **FR-022**: System MUST operate without any login, account, or user identity.
- **FR-023**: System MUST run entirely on the owner's machine with no dependency on a
  remote service for any feature.
- **FR-024**: System MUST keep all data in a single local data file that the owner can
  copy elsewhere as a backup.
- **FR-025**: System MUST start successfully with an empty library when no prior data
  exists.

### Key Entities

- **Chord**: A reusable fingering shape. Carries a display name, the fret position for
  each of the six strings (including muted and open), optional finger numbers, and an
  optional caption used for notes such as an alternate name when a capo is applied. Chords
  are referenced by many song versions.
- **Song**: A piece of music the owner wants to print. Carries a title and an artist and
  owns one or more versions.
- **Song Version**: One concrete rendition of a song. Carries a label distinguishing it
  from sibling versions, the chord-sheet text, an optional key, an optional capo position,
  an ordered set of references to catalog chords, and its own formatting settings. This is
  the unit that is previewed and printed.
- **Formatting Settings**: The layout choices applied to a sheet — column count, body text
  size, line spacing, page margin, extra top spacing. Stored per version, with an
  application-wide default used for new versions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Starting from an empty library, the owner can go from pasted chord-sheet
  text to a printed PDF in under 3 minutes without consulting documentation.
- **SC-002**: Reprinting a previously saved version takes under 30 seconds and requires no
  re-pasting of text or re-entry of formatting.
- **SC-003**: For a sheet the owner has already formatted, the printed page matches the
  on-screen preview in column count, text size, margins, and page breaks in 100% of
  checks.
- **SC-004**: For sheets using the starter chord catalog, the owner defines zero new chord
  shapes to produce a complete sheet.
- **SC-005**: A chord shape defined once is reused across later songs without being
  retyped, in 100% of cases where the same shape is needed.
- **SC-006**: Adjusting any formatting control updates the preview quickly enough that the
  owner can settle on a layout by direct trial, without a perceptible wait between change
  and result.
- **SC-007**: For chord-sheet text copied from a typical online chord source, at least 95%
  of chord lines and section headings are classified correctly without the owner editing
  the text.
- **SC-008**: All songs, versions, chords, and formatting settings survive closing and
  reopening the application with zero data loss.
- **SC-009**: The owner can back up the entire library by copying a single file.

## Assumptions

- The owner is the only user. No accounts, permissions, sharing, or collaboration features
  are in scope, per the project constitution.
- The application runs locally on the owner's machine and is never hosted publicly.
- Chord-sheet text is entered by pasting plain text in the established layout — chord lines
  positioned above lyric lines, section markers on their own lines — matching what is copied
  from common online chord sources. A structured or WYSIWYG chord editor is out of scope.
- Automatic transposition between keys is out of scope for this MVP. The key field is a
  label, and the capo field affects the header note and diagram annotation only, matching
  the behavior of the existing static file.
- Printing is performed through the operating system's or browser's standard print dialog,
  which is also how PDF export is obtained. The application does not implement its own PDF
  writer.
- A4 is the target page size. Other paper sizes are out of scope for this MVP.
- The starter chord catalog is seeded from the chord shapes already embedded in
  `formatador-cifra.html`, so the application is useful on first launch.
- The visual design of the printed sheet — serif body face, accent color for chords, header
  rule, diagram geometry — follows the existing `formatador-cifra.html` as its baseline, per
  the constitution's "Print Output Is the Contract" principle.
- Guitar in standard tuning with six strings is the only instrument supported. Other
  instruments and tunings are out of scope.
- Importing from or scraping chord websites is out of scope; the owner pastes text
  manually.
- The existing `formatador-cifra.html` remains in the repository as the reference baseline
  until the application matches its print output.
