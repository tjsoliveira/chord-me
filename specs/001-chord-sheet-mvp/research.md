# Phase 0 Research: Chord Sheet MVP

**Feature**: `001-chord-sheet-mvp` | **Date**: 2026-08-16

All open technical choices below were resolved during planning. No `NEEDS CLARIFICATION`
items remain. Every decision is measured against the constitution: local-first single-user
(I), print output is the contract (II), radical simplicity/YAGNI (III), typed data with an
owned schema (IV), pragmatic testing (V).

---

## R1. Where does the application run?

**Decision**: A single local Node.js process exposing a small HTTP API on `127.0.0.1`,
plus a browser UI built with Vite. In development, the Vite dev server proxies `/api` to
the Node process; `npm start` serves the built UI from the same Node process.

**Rationale**: Principle II makes the browser's print engine non-negotiable — it is the only
thing on the machine that renders CSS multi-column layout, `@page` A4 sizing, and
`break-inside: avoid` and then produces a PDF. So the UI must be a web page. Principle I
requires the data to be a local SQLite file the owner can copy, which needs a process with
real filesystem access. Node in front of the browser satisfies both with no hosting.

**Alternatives considered**:

- *SQLite compiled to WebAssembly (sql.js / wa-sqlite) with OPFS, no server at all.*
  Rejected: the database would live inside the browser profile's origin-private filesystem,
  breaking FR-024 and SC-009 ("back up the library by copying a single file"). It also adds
  a persistence layer that is far more exotic than a Node file handle.
- *Electron or Tauri desktop shell.* Rejected under Principle III: a whole packaging and
  update toolchain to avoid typing a localhost URL.
- *A full-stack framework (Next.js, Remix, SvelteKit).* Rejected under Principle III: file
  system routing, server components, and a bundler-integrated server are a large amount of
  machinery for roughly eight endpoints and four screens, and they complicate controlling
  the exact print DOM.

---

## R2. How is print fidelity guaranteed?

**Decision**: The preview and the printout are the **same DOM nodes**. There is one sheet
component; a `@media print` block hides the application chrome and lets the sheet occupy
the page. Formatting settings are applied as CSS custom properties on the sheet element,
plus one dynamically generated `<style>` element carrying the `@page` rule and the
print-only margin overrides. Printing is `window.print()`.

**Rationale**: This is the direct implementation of Principle II. Any design where the
preview is one rendering and the print is another re-rendering creates a class of bug where
they silently diverge, which is precisely the failure mode the constitution names. The
existing `formatador-cifra.html` already works this way and its approach is the baseline.

**Consequences captured as rules for implementation**:

- Application chrome (nav, toolbars, editors, buttons) MUST be hidden via `@media print`,
  never by re-rendering a separate print view.
- Margins must be expressed in millimetres and applied as print-only padding on the sheet's
  inner containers, with `@page { size: A4; margin: 0 }`, exactly as the baseline does.
  Setting non-zero `@page` margins alongside CSS columns produces inconsistent results
  across browsers.
- `break-inside: avoid` / `page-break-inside: avoid` on every chord-and-lyric block and on
  section headings satisfies FR-015.
- Verification is manual and mandatory: browser print preview or PDF export, not screen.

**Alternatives considered**:

- *Server-side PDF generation (Puppeteer, wkhtmltopdf, a PDF library).* Rejected: it adds a
  headless browser or a layout engine as a dependency, and it reintroduces exactly the
  two-renderings divergence Principle II forbids. The owner already reaches PDF through the
  browser's print dialog.
- *Rendering the sheet to canvas or SVG for print.* Rejected: loses text selection, loses
  automatic pagination, and would require reimplementing multi-column flow by hand.

---

## R3. Database access layer

**Decision**: `better-sqlite3` with hand-written SQL, wrapped in a thin typed query module.
Schema changes ship as numbered `.sql` files in `migrations/`, applied in order at startup
and recorded in a `schema_migrations` table.

**Rationale**: Principle IV demands an owned, visible schema and checked-in migrations, and
explicitly warns against an ORM that hides the schema. `better-sqlite3` is synchronous,
which removes async plumbing from every query for a workload that is single-user and
sub-millisecond. Applying migrations at startup means the owner never runs a migration
command — consistent with the two-command constraint.

**Alternatives considered**:

- *Prisma.* Rejected: a schema DSL, a generated client, a query engine binary, and its own
  migration tooling — a large amount of machinery that also puts a layer between the owner
  and the SQL.
- *Drizzle.* Closer to acceptable since it keeps SQL visible, but still an extra abstraction
  and code-generation step for a schema of four tables. Rejected under Principle III.
- *Node 22's built-in `node:sqlite`.* Attractive for having zero dependencies, but its API
  is still settling and it would tie the project to a specific Node version. Revisit later;
  the query module is small enough that swapping the driver is a contained change.

---

## R4. Fret pattern representation (a deliberate improvement over the baseline)

**Decision**: Store a chord's frets canonically as **six space-separated tokens**, each
either `x` (muted) or an integer `0`–`24`. The chord input field additionally accepts the
compact six-character form the owner types today (`x02220`), normalising it on save.
Fingers stay a six-character string of `1`–`4` and `_`.

**Rationale**: The baseline splits the fret string per character, so fret 10 and above are
unrepresentable. Principle II permits deliberate, visible improvement over the baseline —
this is one, it costs a normalisation function, and it removes a real limitation for barre
chords high on the neck. Fingers genuinely are single characters, so no change is needed
there.

**Alternatives considered**:

- *Keep the compact string only.* Rejected: silently caps the catalog at fret 9.
- *Store frets as a JSON array column.* Rejected under Principle IV: a JSON blob is less
  inspectable from `sqlite3` on the command line than a readable token string, for no gain
  at six fixed elements.

---

## R5. Sheet text parsing

**Decision**: A pure function `parseSheet(text) → Block[]` classifying each line as a chord
line, a chord line paired with the lyric line beneath it, a section heading, or a blank
separator. It ports the baseline's chord-name regex and section regex unchanged as the
starting point.

**Rationale**: The baseline regexes are tuned against real text from Brazilian chord sites
and already satisfy SC-007's target. Porting them unchanged preserves behaviour (Principle
II). Making the function pure and free of DOM access is what makes it testable, which
Principle V requires for exactly this code.

**Note for implementation**: the chord regex must keep matching slash chords (`D/F#`),
extensions (`Cmaj7`, `Em9`, `Cadd9`), and the degree sign used in Portuguese notation
(`º`, `°`). SC-007 is measured against pasted text, so any regex change needs a test case
drawn from real pasted material.

---

## R6. UI framework and routing

**Decision**: React with TypeScript, built by Vite. `react-router-dom` for routing. No
state-management library, no data-fetching library — component state plus a small typed
`fetch` wrapper.

**Rationale**: The screens are a library list, a chord catalog, and a version editor with a
live preview. That is ordinary component state. Principle III explicitly bars adopting a
state library "for later". `react-router-dom` earns its place because there are five routes,
two of them parameterised, and hand-rolling history handling plus URL parameters is the kind
of bug-prone wheel that a boring dependency removes.

**Alternatives considered**:

- *Svelte.* Fewer runtime concepts and smaller output, but no advantage that matters here
  and less familiar ground for maintenance.
- *Vanilla TypeScript with direct DOM manipulation.* Genuinely viable for a tool this size
  and closest to the baseline file, but the version editor needs the preview to re-render on
  every keystroke across several inputs; hand-written DOM diffing for that is worse than
  taking React.
- *TanStack Query.* Rejected under Principle III: caching, retries, and background refetch
  solve problems a localhost single-user app does not have.

---

## R7. HTTP layer

**Decision**: Express, with JSON request bodies, mounted under `/api`, bound explicitly to
`127.0.0.1`.

**Rationale**: One well-known dependency that supplies routing, path parameters, JSON body
parsing, static file serving, and error middleware. Writing those against `node:http` is
roughly a hundred lines of code with no upside.

**Binding is a constitutional requirement, not a preference**: the listener must be created
with an explicit `127.0.0.1` host so the tool is never reachable from the network
(Principle I).

**Alternatives considered**: Fastify (schema validation and speed neither of which is
needed), Hono (fine, but no advantage over the more widely known option), bare `node:http`
(rejected above).

---

## R8. Input validation

**Decision**: Hand-written validator functions in shared code, returning field-level error
messages. No validation library.

**Rationale**: The only non-trivial validation is the fret pattern (FR-003), which needs a
custom function regardless because it must produce a message naming the specific problem —
wrong number of strings, unsupported character, fret out of range. Everything else is
"non-empty title", "capo between 1 and 12", "columns between 1 and 4". Adding zod to express
those is a dependency serving four trivial checks. Since the validators live in shared code,
the browser can run them for instant feedback and the server can run them again at the
boundary.

**Alternatives considered**: zod (rejected as above, though it would be the right call the
moment the schema grows complex or the API stops being trusted).

---

## R9. Testing

**Decision**: Vitest for everything, with tests concentrated on the logic Principle V names:
sheet parsing, chord diagram geometry, fret normalisation and validation, migration
application, and version round-trip with formatting settings intact.

**Rationale**: One test runner covering both browser-side and Node-side pure modules. No
browser automation, no end-to-end framework — Principle V explicitly permits verifying CRUD
wiring and presentation by hand, and print fidelity is verified by looking at paper, which
no automated tool in scope can do.

**Alternatives considered**: Playwright for end-to-end coverage. Rejected under Principle
III for now; it would earn its place only if a class of regression appears that manual
checking keeps missing. Visual regression testing of the sheet is explicitly out of scope —
the human check against printed output is the guard.

---

## R10. Starter chord catalog

**Decision**: Seed the catalog on first run from the `DB` object embedded in
`formatador-cifra.html` (roughly fifty shapes), converted to canonical fret tokens. Seeding
runs only when the chord table is empty, so it never fights the owner's own edits.

**Rationale**: FR-004 and SC-004 require the application to be useful before the owner
defines anything. The shapes already exist and are already trusted.

**Implementation note**: seed data belongs in a checked-in migration or a checked-in seed
module, not in a one-off script the owner has to remember to run.

---

## R11. String marker contrast (deliberate deviation from the baseline)

**Decision**: Darken the below-grid string markers from `#b5b0a8` to `#8a857d`
(the `--grey` token). This changes printed output and is recorded here for that reason.

**Rationale**: The markers below each diagram carry meaning — `×` means don't play the
string, `○` means play it open, `●` means fretted. At `#b5b0a8` they measured **2.10:1**
against the paper, under the 3:1 that WCAG 1.4.11 asks of a graphic conveying
information. `#8a857d` reaches **3.57:1** while staying **4.74:1** clear of the
near-black fretted dots, so the markers remain visibly subordinate and the diagram's
hierarchy is unchanged.

The failure mode being fixed is not confusion between marker types — `×` and `○` are
distinguished by shape, not colour — but the markers disappearing altogether. Sheet music
is routinely read on a stand in poor light, and this owner reads exclusively on paper.

**Alternatives considered**:

- *Keep `#b5b0a8` for exact baseline fidelity.* Rejected: Constitution Principle II
  permits deliberate, visible improvement over the baseline, and legibility of a
  meaningful graphic outweighs pixel-exact fidelity to an inherited value.
- *Darken further (`#7d786f` at 4.28:1, `#6f6862` at 5.34:1).* Rejected: both close the
  gap to the fretted dots to under 4:1, at which point the subordinate markers start
  competing with the primary information.

**Cost**: sheets printed before this change show lighter markers than sheets printed
after. Nothing already on paper changes, and the owner reprints from the application, so
the inconsistency is transient.

---

## Resolved technical context summary

| Item | Resolution |
|------|-----------|
| Language | TypeScript, `strict: true`, shared types across server and client |
| Runtime | Node.js 22 LTS |
| UI | React + Vite, `react-router-dom` |
| Server | Express bound to `127.0.0.1` |
| Storage | SQLite via `better-sqlite3`, one file, numbered SQL migrations |
| Print | Browser print engine, `@page { size: A4; margin: 0 }`, single shared sheet DOM |
| Testing | Vitest on parsing, geometry, validation, and persistence round-trip |
| Validation | Hand-written shared validators |
| Deployment | None — localhost only, never hosted |
