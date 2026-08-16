<!--
Sync Impact Report
==================
Version change: (template, unversioned) → 1.0.0
Bump rationale: Initial ratification. All placeholder tokens replaced with concrete,
project-specific governance for chord-me.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Local-First, Single-User (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Print Output Is the Contract
  - [PRINCIPLE_3_NAME] → III. Radical Simplicity / YAGNI
  - [PRINCIPLE_4_NAME] → IV. Typed Data, Owned Schema
  - [PRINCIPLE_5_NAME] → V. Pragmatic Testing (Rendering Logic First)

Added sections:
  - Technology Constraints (was [SECTION_2_NAME])
  - Development Workflow (was [SECTION_3_NAME])

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — "Constitution Check" gate is generic
     ("[Gates determined based on constitution file]"); no edit required, gates are
     derived per-feature from the principles below.
  ✅ .specify/templates/spec-template.md — no constitution references; aligned as-is.
  ✅ .specify/templates/tasks-template.md — no constitution references; task
     categories remain compatible (no mandatory TDD phase imposed, see Principle V).
  ✅ .specify/templates/checklist-template.md — no constitution references.
  ⚠ README.md — does not exist yet; create when the app scaffold lands and reference
     this constitution from it.

Follow-up TODOs: none. Ratification date set to the date of first adoption.
-->

# chord-me Constitution

## Core Principles

### I. Local-First, Single-User (NON-NEGOTIABLE)

The application runs entirely on the owner's machine and is never deployed to a public
host. It MUST NOT contain authentication, authorization, user accounts, sessions,
multi-tenancy, or any per-user data partitioning. All persistence is a local SQLite file
that the owner can copy, back up, or delete with ordinary file operations.

Any proposal that only makes sense for hosted, multi-user software (rate limiting,
CSRF/session hardening, RBAC, tenant scoping, telemetry, analytics, feature flags,
CDN/asset pipelines, horizontal scaling, cloud secrets) MUST be rejected. Network
listeners MUST bind to localhost only.

Rationale: The threat model and the scaling model are both empty. Building for either
imports permanent complexity in exchange for nothing.

### II. Print Output Is the Contract

The purpose of this project is producing printable chord sheets. The on-screen preview
is a print preview: whatever the preview shows MUST be what the printed A4 page and the
exported PDF show — same column count, font size, line height, margins, page breaks, and
chord diagrams.

Every change touching layout, typography, chord-line detection, section detection, or
diagram rendering MUST be verified against real print output (browser print preview or
PDF export), not only against the screen. The existing `formatador-cifra.html` is the
behavioral baseline: its formatting rules (chord/lyric line pairing, section headings,
capo bar, barre detection, fret-diagram geometry, `@page` A4 sizing) MUST be preserved
or deliberately and visibly improved — never silently regressed.

Rationale: A chord sheet that looks right on screen and breaks on paper is a failed
product. The baseline HTML already encodes hard-won formatting decisions.

### III. Radical Simplicity / YAGNI

Start with the smallest thing that works and add only what a concrete, present need
demands. Concretely:

- No abstraction layer introduced for a single implementation. No repository/service/
  factory indirection until a second real caller exists.
- No dependency added without a stated reason it beats the standard library or a
  30-line local helper. Prefer fewer, boring, well-known packages.
- No microservices, no message queues, no caching layer, no state-management library
  adopted "for later".
- Dead code, unused options, and speculative configuration MUST be deleted, not kept
  behind a flag.

Complexity that survives review MUST be justified in writing in the plan's Complexity
Tracking section, naming the simpler alternative that was rejected and why.

Rationale: This is a personal tool maintained by one person in spare time. Every extra
moving part is a future maintenance tax paid by that same person.

### IV. Typed Data, Owned Schema

The domain model is explicit and typed end to end: chords (name, fret string, finger
string, optional caption), songs, and song versions (a song MUST support multiple
versions — different keys, arrangements, or formatting presets). Chord diagrams used by
a song MUST be selectable from the stored chord catalog rather than retyped per song.

Rules:

- Types MUST be defined once and shared between persistence, application logic, and UI;
  duplicated hand-written shapes for the same concept are forbidden.
- Schema changes MUST ship as ordered, checked-in migration files. Editing the SQLite
  file by hand as the only record of a change is forbidden.
- Public data-shape changes MUST be reflected in the same commit that changes the
  storage layer — the schema, the types, and the code that reads them move together.
- Persisted formatting settings MUST be storable per song version so a saved sheet
  reprints identically later.

Rationale: The whole value of moving off a static HTML file is a durable, queryable,
reusable catalog. That only holds if the schema is versioned and the types are honest.

### V. Pragmatic Testing (Rendering Logic First)

Full TDD is NOT mandated. Automated tests ARE mandated for the logic where regressions
are silent and expensive:

- Chord-line vs. lyric-line detection, section detection, and text-block parsing.
- Chord diagram geometry: base-fret calculation, barre detection, open/muted string
  markers, capo offset.
- Transposition and key handling, if implemented.
- Data-layer behavior: migrations apply cleanly, song versions round-trip with their
  formatting settings intact.

CRUD wiring and pure presentation MAY be verified manually. Any bug found in the logic
listed above MUST get a failing regression test before it is fixed.

Rationale: Parsing and geometry code fails quietly and only becomes visible on a printed
page in front of an audience. Everything else is cheap to eyeball.

## Technology Constraints

- **Language**: TypeScript across the stack, with `strict` mode enabled. `any` requires
  an inline comment justifying it.
- **Storage**: SQLite, a single local file, accessed through a typed query layer with
  checked-in migrations. No ORM is required; if one is used it MUST NOT hide the schema.
- **Runtime/UI**: A single locally-run application. The UI runs in the browser so that
  the browser's own print engine produces the PDF — print fidelity (Principle II)
  overrides any UI-framework preference.
- **Ports**: Localhost binding only.
- **Build**: `install → run` MUST be at most two commands and MUST work offline after
  the first install.
- **Data safety**: Destructive operations (delete song, delete version, delete chord)
  MUST confirm, and the SQLite file MUST remain trivially copyable for backup.
- **Baseline asset**: `formatador-cifra.html` at the repository root is retained as the
  reference implementation until the application demonstrably matches its print output.

## Development Workflow

- Work proceeds through the Spec Kit flow: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`.
- Every plan MUST complete its Constitution Check against the five principles above
  before Phase 0 research, and re-check after Phase 1 design.
- Features that add a user-visible screen MUST state, in the spec, how the result is
  verified on a printed page (Principle II).
- Reviews are self-reviews (single maintainer). Before considering a task done, the
  maintainer MUST confirm: it runs locally, the print preview matches paper output for
  affected layout, and any logic from Principle V has tests.
- Scope creep discovered mid-task MUST be captured as a new task, not absorbed silently.

## Governance

This constitution supersedes ad-hoc preferences and prior habits for this repository.
When a plan, spec, task, or piece of code conflicts with a principle here, the
constitution wins or the constitution is amended first — not after the fact.

**Amendment procedure**: Amendments are made by editing this file, recording the change
in the Sync Impact Report comment at the top, bumping the version, and updating
`Last Amended`. An amendment that removes or narrows a principle MUST state what replaces
it and what existing code becomes non-compliant.

**Versioning policy**: Semantic versioning.

- MAJOR — a principle is removed or redefined in a backward-incompatible way.
- MINOR — a principle or section is added, or guidance is materially expanded.
- PATCH — clarifications, wording, typo fixes, non-semantic refinements.

**Compliance review**: The Constitution Check gate in `plan-template.md` is the
enforcement point. Any violation carried forward MUST appear in the plan's Complexity
Tracking table with its justification and the rejected simpler alternative. Unjustified
violations block implementation.

**Version**: 1.0.0 | **Ratified**: 2026-08-16 | **Last Amended**: 2026-08-16
