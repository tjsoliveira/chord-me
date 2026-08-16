# Contract: Local HTTP API

**Feature**: `001-chord-sheet-mvp` | **Date**: 2026-08-16

The browser UI is the only client. The server binds to `127.0.0.1` and carries no
authentication, per Constitution Principle I — this API is not reachable from the network and
must never be exposed.

- Base path: `/api`
- Request and response bodies: JSON, UTF-8
- Field names: `camelCase`, matching the shared TypeScript types in
  [data-model.md](../data-model.md)

## Error envelope

Every non-2xx response uses one shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable summary",
    "fields": { "frets": "Expected 6 strings, got 5" }
  }
}
```

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_FAILED` | 400 | One or more fields rejected; `fields` names each one (FR-003) |
| `NOT_FOUND` | 404 | The addressed record does not exist |
| `CHORD_IN_USE` | 409 | Chord deletion blocked; see the extended shape below (FR-005) |
| `INTERNAL` | 500 | Unexpected failure |

`CHORD_IN_USE` carries the blocking usages so the UI can name them:

```json
{
  "error": {
    "code": "CHORD_IN_USE",
    "message": "This chord is used by 2 song versions.",
    "usages": [
      { "songId": 4, "songTitle": "...", "versionId": 9, "versionLabel": "Tom E" }
    ]
  }
}
```

---

## Chords

### `GET /api/chords`

Optional `?q=` filters by name (case-insensitive substring).

`200` → `Chord[]`, ordered by name.

### `POST /api/chords`

Body: `{ name, frets, fingers?, caption? }`

`frets` accepts either canonical tokens (`"x 0 2 2 2 0"`) or the compact form (`"x02220"`);
the response always returns canonical. `201` → `Chord`. `400` on invalid input.

### `GET /api/chords/:id`

`200` → `Chord`. `404` if absent.

### `PUT /api/chords/:id`

Body: same as POST. `200` → updated `Chord`.

### `DELETE /api/chords/:id`

`204` on success. `409 CHORD_IN_USE` when any version references it — the chord is not
deleted and the usage list is returned (FR-005).

### `GET /api/chords/:id/usages`

`200` → the `usages` array shown above. Lets the UI warn before the owner attempts a delete.

---

## Songs

### `GET /api/songs`

Optional `?q=` matches title or artist, case-insensitive substring (FR-012).

`200` → array of song summaries:

```json
[{
  "id": 1, "title": "...", "artist": "...",
  "versionCount": 2,
  "versions": [{ "id": 9, "label": "Tom D" }, { "id": 10, "label": "Tom E" }]
}]
```

Summaries omit `sheetText` — the library list has no use for it and songs can be large.
`versions` carries only `id` and `label`, ordered by `position`, so the library can show
and link each version without a second request. It is `[]` for a song with no versions,
never `null`, and `versionCount` always equals `versions.length`.

The server resolves this with one extra query for the whole page of results, not one per
song.

### `POST /api/songs`

Body: `{ title, artist? }`. `201` → `Song` with an empty `versions` array.

### `GET /api/songs/:id`

`200` → `Song` including all its versions in `position` order, each with full detail.

### `PUT /api/songs/:id`

Body: `{ title, artist }`. `200` → updated song summary.

### `DELETE /api/songs/:id`

`204`. Cascades to the song's versions and their chord links. The UI must confirm first
(FR-011); the API does not second-guess a delete it receives.

---

## Versions

### `POST /api/songs/:songId/versions`

Body: `{ label, sheetText?, songKey?, capo?, chordIds?, formatting? }`

Omitted fields take their defaults: empty sheet text, null key and capo, no chords, and
`DEFAULT_FORMATTING`. `position` is assigned as the next free slot within the song.

`201` → `SongVersion`. `404` if the song does not exist.

### `GET /api/versions/:id`

`200` → `SongVersion`, plus the fully resolved `chords` array so the preview can render
diagrams without a second round trip:

```json
{
  "id": 9, "songId": 4, "label": "Tom E",
  "sheetText": "...", "songKey": "E", "capo": 2, "position": 0,
  "formatting": { "columns": 3, "bodySize": 8.5, "lineHeight": 1.3, "marginMm": 18, "topExtraMm": 12 },
  "chordIds": [3, 7, 12],
  "chords": [ { "id": 3, "name": "...", "frets": [], "fingers": null, "caption": null } ]
}
```

`chords` is ordered to match `chordIds`.

### `PUT /api/versions/:id`

Body: any subset of `{ label, sheetText, songKey, capo, chordIds, formatting, position }`.

`chordIds` replaces the whole ordered selection — the server rewrites the join rows inside one
transaction. A `chordId` that does not exist yields `400`.

`200` → the updated version in the `GET` shape.

Saving formatting through this endpoint is what makes FR-017 hold: reopening the version
restores the same layout. "Reset to defaults" is the client sending
`formatting: DEFAULT_FORMATTING`; there is no separate reset endpoint.

### `DELETE /api/versions/:id`

`204`. Cascades to the version's chord links only; chords survive.

Deleting a song's last version leaves the song in place with zero versions, which the library
list shows as `versionCount: 0`. This resolves the spec's edge case explicitly: songs are
never auto-deleted, so no record becomes unreachable.

---

## Contract rules

1. **No authentication, no sessions, no CORS allowance for other origins.** The listener is
   created with an explicit `127.0.0.1` host (Principle I).
2. **Validation runs on the server even though the client validates first.** The shared
   validators are called on both sides; the client copy exists for instant feedback, not as
   the guarantee.
3. **Writes touching more than one table run in a transaction** — notably version updates that
   rewrite `chordIds`.
4. **`sheetText` is stored and returned verbatim.** Only carriage returns are stripped.
   Alignment of chords above lyrics depends on whitespace surviving the round trip.
5. **Timestamps are server-generated** and never accepted from the client.
