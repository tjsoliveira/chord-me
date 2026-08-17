# API Contract Delta: UI Redesign (Stitch)

**Feature**: `specs/002-ui-redesign` | **Date**: 2026-08-17

Baseline: `specs/001-chord-sheet-mvp/contracts/api.md`. This document records only what
this feature changes. Everything not listed here is unchanged.

## Changed: `GET /api/songs`

Each entry in `versions[]` gains `songKey` and `capo`.

**Before**

```json
[
  {
    "id": 1,
    "title": "Isaías 9",
    "artist": "Rodolfo Abrantes",
    "versionCount": 2,
    "versions": [
      { "id": 4, "label": "Original" },
      { "id": 5, "label": "Acústico" }
    ]
  }
]
```

**After**

```json
[
  {
    "id": 1,
    "title": "Isaías 9",
    "artist": "Rodolfo Abrantes",
    "versionCount": 2,
    "versions": [
      { "id": 4, "label": "Original", "songKey": "G", "capo": 2 },
      { "id": 5, "label": "Acústico", "songKey": "E", "capo": null }
    ]
  }
]
```

**Rules**

- `songKey` is a string or `null`. `null` means the version has no key set.
- `capo` is an integer 1–12, or `null` for no capo. **Capo `0` is not representable**:
  `migrations/001_initial_schema.sql` declares
  `CHECK (capo IS NULL OR (capo >= 1 AND capo <= 12))`, and `validateCapo` enforces the
  same range. Capo 0 is not a distinct state — it is the absence of a capo — so the
  `02-musica-versoes.png` mockup's "Capo 0" label describes something the domain cannot
  store. An earlier draft of this contract asserted the opposite; the schema is correct
  and the draft was wrong.
- `versions[]` stays ordered by `position`, and stays `[]` — never `null` — when a song has
  no versions.
- `sheetText` MUST NOT appear in this response. That is the reason `VersionRef` is a
  narrow type; the invariant survives this change.
- The endpoint stays at two queries for N songs. No N+1.
- The `?q=` search parameter is unchanged: it matches title or artist only, never key.

**Compatibility**: additive. Existing consumers that read `id` and `label` are unaffected.

## Unchanged, but newly reachable: `POST /api/songs/:songId/versions`

**The server contract does not change.** It already accepts `songKey` and `capo` in the
request body and already validates `capo` through `validateCapo`.

What changes is the client: `api.createVersion` was typed `{ label: string }`, so the two
fields were unreachable from the UI. The client type widens to match what the server
already accepts.

**Request body, as already supported**

```json
{
  "label": "Acústico",
  "songKey": "E",
  "capo": 0
}
```

- `label` — required, validated by `validateVersionLabel`.
- `songKey` — optional. Empty string is stored as `null`.
- `capo` — optional. Validated by `validateCapo`. Omitted or `null` means no capo.
- `formatting` — optional; omitted means `DEFAULT_FORMATTING`. This feature never sends it.

**Response**: `201` with the full `SongVersionWithChords`, unchanged.

## Explicitly unchanged

| Endpoint | Note |
|----------|------|
| `GET /api/songs/:id` | Already returns full versions with key and capo |
| `PUT /api/songs/:id` | Untouched |
| `DELETE /api/songs/:id` | Untouched |
| `GET /api/versions/:id`, `PUT`, `DELETE` | Untouched |
| `GET /api/chords`, `POST`, `PUT`, `DELETE`, `GET /:id/usages` | Untouched — the catalog redesign is presentation only |
| Error bodies (`VALIDATION_FAILED`, `NOT_FOUND`, `CHORD_IN_USE`, `INTERNAL`) | Untouched |

## UI contract: surface boundary

Not an HTTP contract, but the interface guarantee this feature is built to hold, and the
one most easily broken by a stylesheet edit.

| Surface | Palette | Printed? |
|---------|---------|----------|
| Chrome — nav, toolbars, panels, forms, rows | `--app-*` (dark, `#FF8C00` accent) | Never. Carries `.chrome`, hidden by `@media print` |
| Chord sheet — `.sheet` and descendants | `--ink` / `--paper` / `--rule` / `--chord` / `--muted` / `--grey` | Yes. This is the artifact |
| Chord diagrams — catalog tiles, creation preview, sheet | Paper tokens, on a `--paper` background, everywhere on screen | Yes, within the sheet |

**Invariants**

1. A chrome token MUST NOT be referenced from `sheet.css` or from `ChordDiagram.tsx`.
2. A paper token MUST NOT change value in this feature.
3. Every chrome container MUST carry `.chrome`, so print hiding stays class-driven rather
   than structural — the failure mode the MVP already fixed once.
4. Chord diagrams render on `--paper` wherever they appear on screen, and are never
   restyled for the dark theme.
