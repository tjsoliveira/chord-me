import type { Chord } from "./types.js";

/**
 * Name-only substring match, mirroring the catalog endpoint's
 * `name LIKE ? COLLATE NOCASE` (server/routes/chords.ts) so the picker and the
 * catalog page never disagree about what a query means. Frets, fingers and
 * caption are deliberately not searched.
 *
 * ASCII toLowerCase, not toLocaleLowerCase: SQLite's NOCASE folds ASCII only,
 * and chord names are ASCII, so a Turkish locale must not make the client
 * match a different set than the server.
 *
 * Prefix matches come first. Every flat contains "b", so under plain
 * alphabetical order a single "b" buries B, B7 and Bm under Ab, Bb, Db, Eb and
 * Gb - and "b" is one of the most likely first keystrokes in the catalog.
 * Within each bucket the caller's order survives, which keeps the server's
 * ORDER BY name.
 */
export function filterChords(chords: Chord[], query: string): Chord[] {
  const q = query.trim().toLowerCase();
  if (q === "") return chords;

  const prefix: Chord[] = [];
  const rest: Chord[] = [];
  for (const chord of chords) {
    const at = chord.name.toLowerCase().indexOf(q);
    if (at === 0) prefix.push(chord);
    else if (at > 0) rest.push(chord);
  }
  return prefix.length === 0 ? rest : [...prefix, ...rest];
}
