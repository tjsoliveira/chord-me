# Phase 1 Data Model: Chord Sheet MVP

**Feature**: `001-chord-sheet-mvp` | **Date**: 2026-08-16

Storage is a single SQLite file. The schema is owned and explicit per Constitution
Principle IV: every change ships as a numbered migration, and the TypeScript types below are
defined once in shared code and used by both the server and the browser.

`PRAGMA foreign_keys = ON` must be set on every connection — SQLite does not enforce foreign
keys otherwise, and FR-005 depends on that enforcement.

---

## Entity overview

```text
Song ──1:N──> SongVersion ──M:N──> Chord
                   │                  ▲
                   │                  │ ON DELETE RESTRICT
                   └── formatting settings (columns on the version row)
```

- Deleting a **Song** cascades to its versions.
- Deleting a **SongVersion** cascades to its chord links, never to the chords themselves.
- Deleting a **Chord** is **blocked** while any version links to it (FR-005).

---

## Table: `chords`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `name` | TEXT | NOT NULL, non-empty after trim | Display name, e.g. `F#m`, `D/F#`, `Cadd9` |
| `frets` | TEXT | NOT NULL | Canonical: six space-separated tokens |
| `fingers` | TEXT | NULL | Exactly 6 characters from `1`–`4` and `_` when present |
| `caption` | TEXT | NULL | Free note, e.g. an alternate name when a capo is applied |
| `created_at` | TEXT | NOT NULL, ISO-8601 UTC | |
| `updated_at` | TEXT | NOT NULL, ISO-8601 UTC | |

**Fret token grammar** (validated in shared code, FR-003):

- Exactly six tokens, one per string, low E first — matching the baseline's string order.
- Each token is `x` (muted) or an integer `0`–`24`.
- Input also accepts the compact six-character form (`x02220`); it is normalised to canonical
  tokens on save. The compact form cannot express frets above 9, which is the reason the
  canonical form exists (see research R4).
- Rejection messages must name the specific fault: wrong token count, unsupported character,
  or fret out of range.

**Indexes**: `idx_chords_name` on `name` — the catalog is browsed and picked by name.

**Duplicate names are allowed.** Two shapes may share a name (FR edge case: same name,
different voicing). The chord picker must therefore disambiguate by showing the fret pattern
alongside the name, never by name alone.

---

## Table: `songs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `title` | TEXT | NOT NULL, non-empty after trim | |
| `artist` | TEXT | NOT NULL DEFAULT `''` | Empty string allowed, NULL is not |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**Indexes**: `idx_songs_title` on `title`.

**Search (FR-012)**: case-insensitive `LIKE` against `title` and `artist`. At the expected
scale — hundreds of songs — this is instant, and FTS5 would be premature (Principle III).

---

## Table: `song_versions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `song_id` | INTEGER | NOT NULL, FK → `songs(id)` ON DELETE CASCADE | |
| `label` | TEXT | NOT NULL, non-empty after trim | Distinguishes siblings, e.g. "Tom E", "Ao vivo" |
| `position` | INTEGER | NOT NULL DEFAULT 0 | Display order within the song |
| `sheet_text` | TEXT | NOT NULL DEFAULT `''` | The pasted chord sheet, stored verbatim |
| `song_key` | TEXT | NULL | A label only — no transposition in this MVP |
| `capo` | INTEGER | NULL, CHECK between 1 and 12 when present | |
| `fmt_columns` | INTEGER | NOT NULL DEFAULT 3, CHECK 1–4 | |
| `fmt_body_size` | REAL | NOT NULL DEFAULT 8.5, CHECK 6–16 | Points |
| `fmt_line_height` | REAL | NOT NULL DEFAULT 1.3, CHECK 1.0–2.0 | Unitless multiplier |
| `fmt_margin_mm` | INTEGER | NOT NULL DEFAULT 18, CHECK 0–40 | Left/right/bottom page margin |
| `fmt_top_extra_mm` | INTEGER | NOT NULL DEFAULT 12, CHECK 0–40 | Extra space above the header |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**Formatting is stored as discrete columns, not a JSON blob.** Principle IV calls for an
inspectable schema, and each setting has its own valid range that a CHECK constraint can
enforce. The defaults reproduce the baseline file's defaults exactly, satisfying Principle II.

**Indexes**: `idx_song_versions_song_id` on `(song_id, position)`.

**`sheet_text` is stored verbatim.** Whitespace is load-bearing — chord alignment above lyrics
depends on it — so the text is never trimmed, re-wrapped, or normalised on save. Only carriage
returns are stripped, matching the baseline.

---

## Table: `song_version_chords`

Join table carrying the ordered diagram selection for a version (FR-009).

| Column | Type | Constraints |
|--------|------|-------------|
| `song_version_id` | INTEGER | NOT NULL, FK → `song_versions(id)` ON DELETE CASCADE |
| `chord_id` | INTEGER | NOT NULL, FK → `chords(id)` **ON DELETE RESTRICT** |
| `position` | INTEGER | NOT NULL |

- PRIMARY KEY `(song_version_id, position)` — ordering is part of the identity.
- UNIQUE `(song_version_id, chord_id)` — the same chord is not attached twice to one version.
- Index on `chord_id` to answer "which versions use this chord?" (FR-005) cheaply.

**ON DELETE RESTRICT is the enforcement point for FR-005.** The application still queries
usages first so it can show the owner *which* versions block the deletion, but the constraint
guarantees the invariant even if that check is ever bypassed.

---

## Table: `schema_migrations`

| Column | Type | Constraints |
|--------|------|-------------|
| `version` | TEXT | PRIMARY KEY |
| `applied_at` | TEXT | NOT NULL |

Migrations are numbered `.sql` files applied in filename order at startup, inside a
transaction, skipping any version already recorded. The owner never runs a migration command
— this keeps the two-command install-and-run constraint intact.

---

## Shared TypeScript types

Defined once and imported by both server and client (Principle IV forbids duplicated
hand-written shapes for the same concept).

```ts
type FretToken = 'x' | number;          // number constrained 0–24 by validation
type Frets = [FretToken, FretToken, FretToken, FretToken, FretToken, FretToken];

interface Chord {
  id: number;
  name: string;
  frets: Frets;
  fingers: string | null;               // 6 chars of '1'–'4' | '_'
  caption: string | null;
}

interface FormattingSettings {
  columns: number;                      // 1–4
  bodySize: number;                     // pt, 6–16
  lineHeight: number;                   // 1.0–2.0
  marginMm: number;                     // 0–40
  topExtraMm: number;                   // 0–40
}

interface SongVersion {
  id: number;
  songId: number;
  label: string;
  position: number;
  sheetText: string;
  songKey: string | null;
  capo: number | null;                  // 1–12
  formatting: FormattingSettings;
  chordIds: number[];                   // ordered
}

interface Song {
  id: number;
  title: string;
  artist: string;
  versions: SongVersion[];              // omitted or summarised in list responses
}
```

`DEFAULT_FORMATTING` lives beside these types as a constant, not in a settings table — there
is one default set, it never varies per install, and a table for it would be a row nobody
edits (Principle III).

---

## Derived, non-persisted structures

These are computed on demand and never stored. Both are pure functions and both are covered
by the tests Principle V mandates.

**Parsed sheet** — output of `parseSheet(sheetText)`:

```ts
type Block =
  | { kind: 'pair'; chordLine: string; lyricLine: string }
  | { kind: 'chords'; line: string }
  | { kind: 'lyrics'; line: string }
  | { kind: 'section'; line: string }
  | { kind: 'blank' };
```

**Diagram geometry** — output of `computeDiagram(chord, capo)`: the base fret to display, the
per-string dot positions, the barre span if any, the open/muted markers, and whether a capo
bar is drawn. Kept separate from the SVG rendering so the geometry can be asserted in tests
without touching the DOM.

---

## Validation rules mapped to requirements

| Rule | Requirement |
|------|-------------|
| Chord name non-empty; frets exactly six valid tokens; fingers, when present, exactly six valid characters | FR-001, FR-003 |
| Chord deletion blocked while referenced, with the blocking versions listed | FR-005 |
| Song title non-empty | FR-006 |
| A song may hold many versions; each is independently editable | FR-007 |
| Version stores text, key, capo, ordered chord ids, and formatting | FR-008 |
| Capo 1–12 when present | FR-021 |
| Formatting values within their CHECK ranges; reset restores `DEFAULT_FORMATTING` | FR-016, FR-017 |
| All writes committed to the single SQLite file | FR-010, FR-024 |
| Empty database is a valid startup state; seed runs only when `chords` is empty | FR-004, FR-025 |
