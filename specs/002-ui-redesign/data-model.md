# Phase 1 Data Model: UI Redesign (Stitch)

**Feature**: `specs/002-ui-redesign` | **Date**: 2026-08-17

## Summary

**No schema change. No migration.** This feature adds no tables, no columns, and no
entities. One shared type widens to expose columns that already exist and are already
populated.

The relevant constitutional rule is Principle IV: types are defined once in
`src/shared/types.ts` and shared by persistence, application logic, and UI; the schema, the
types, and the code that reads them move in the same commit.

## Changed type

### `VersionRef`

Carried inside `SongSummary.versions` and used only by the library screen.

**Before**

```
VersionRef { id, label }
```

**After**

```
VersionRef { id, label, songKey, capo }
```

| Field | Type | Source column | Notes |
|-------|------|---------------|-------|
| `id` | number | `song_versions.id` | unchanged |
| `label` | string | `song_versions.label` | unchanged |
| `songKey` | string or null | `song_versions.song_key` | already populated; null means unset |
| `capo` | number or null | `song_versions.capo` | already populated; null means no capo |

**Why**: FR-014 requires each version's key and capo to be visible in the library.

**Invariant that must survive**: `VersionRef` exists to keep `sheetText` out of summary
responses. That is the whole reason the type is narrow, and it is recorded as a comment on
the type. Adding two scalar columns does not weaken it; adding `sheetText` ever would.

**Where it changes**:

- `src/shared/types.ts` — the interface, and its doc comment.
- `src/server/routes/songs.ts` — the `SELECT` inside `withVersions()` gains `song_key` and
  `capo`, and the row-to-ref mapping carries them through. The two-query strategy is
  unchanged; this stays two queries for N songs, not N+1.

## Unchanged types

Listed so the boundary is explicit. None of these may move in this feature:

| Type | Why it is untouched |
|------|---------------------|
| `Chord` | The catalog redesign is layout only |
| `Frets`, `FretToken` | Diagram geometry is out of scope |
| `FormattingSettings`, `DEFAULT_FORMATTING` | Print contract — changing a default reflows every saved sheet |
| `SongVersion`, `SongVersionWithChords` | Already carry `songKey` and `capo` |
| `Song`, `SongSummary` | Only the shape nested inside `SongSummary.versions` changes |
| `ChordUsage`, `ErrorCode`, `ApiErrorBody` | Error handling is unchanged |

## Client-side type widening (not a data-model change)

`api.createVersion` is typed `(songId: number, data: { label: string })`. The server
already accepts and validates `songKey` and `capo` on this route. The client type widens to
`{ label: string; songKey?: string | null; capo?: number | null }` so FR-021 becomes
reachable from the UI.

This is a client call signature catching up to an existing server contract, not a change to
either the schema or the wire format.

## Design tokens

Tokens are not persisted data, but they are the artifact this feature most changes, and
they carry a hard boundary worth restating here.

### Paper tokens — PRINT CONTRACT, frozen

`--ink`, `--paper`, `--rule`, `--chord`, `--muted`, `--grey`

Consumed by `sheet.css` and `ChordDiagram.tsx`. Changing any value changes printed output.
**None of them may appear in this feature's diff.** `--grey` in particular carries a
recorded, deliberate deviation from the `formatador-cifra.html` baseline (MVP research R11)
that must not be undone.

### Chrome tokens — screen only, changed by this feature

`--app-bg`, `--app-surface`, `--app-raised`, `--app-border`, `--app-border-strong`,
`--app-text`, `--app-text-muted`, `--app-accent`, `--app-accent-solid`,
`--app-accent-solid-hover`, `--app-danger`, `--app-danger-solid`,
`--app-danger-solid-hover`

Never printed. The accent family moves to the mockups' `#FF8C00`, and a new token is needed
for the label colour on solid accent fills, which inverts to near-black (research R1).

**Note**: `--app-accent-solid` currently equals `--chord` (`#a8410f`). After this feature
they diverge, and that independence becomes load-bearing rather than incidental.
