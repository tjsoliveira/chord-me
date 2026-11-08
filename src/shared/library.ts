import type { SongSummary, VersionRef } from "./types.js";

/**
 * Case- and accent-blind form of a string. Titles arrive copied from
 * Brazilian chord sites, so "isaias" has to find "Isaías 9". Runs of
 * whitespace collapse, so a doubled space never makes a title look new.
 */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/**
 * Alphabetical as a reader expects it: "Águas" among the A's and "eu vejo"
 * beside "Eu Navegarei". The server's ORDER BY compares bytes, which puts
 * accented and lower-case initials after Z.
 */
export function sortSongs(songs: SongSummary[]): SongSummary[] {
  return [...songs].sort(
    (a, b) => collator.compare(a.title, b.title) || collator.compare(a.artist, b.artist) || a.id - b.id
  );
}

/**
 * Title or artist contains the query. Titles that start with it come first,
 * the same rule as filterChords, so the top row (the one Enter opens) is the
 * most likely intent. Within each bucket the caller's order survives.
 */
export function filterSongs(songs: SongSummary[], query: string): SongSummary[] {
  const q = fold(query);
  if (q === "") return songs;

  const prefix: SongSummary[] = [];
  const rest: SongSummary[] = [];
  for (const song of songs) {
    const title = fold(song.title);
    if (title.startsWith(q)) prefix.push(song);
    else if (title.includes(q) || fold(song.artist).includes(q)) rest.push(song);
  }
  return [...prefix, ...rest];
}

/** Whether creating `query` as a title would duplicate a song already stored. */
export function hasExactTitle(songs: SongSummary[], query: string): boolean {
  const q = fold(query);
  return q !== "" && songs.some((s) => fold(s.title) === q);
}

/** The letter a title files under in the index: A to Z, anything else "#". */
export function initialOf(title: string): string {
  const c = fold(title).charAt(0).toUpperCase();
  return c >= "A" && c <= "Z" ? c : "#";
}

/** The version saved most recently, which is what a reprint most likely wants. */
export function latestVersion(song: SongSummary): VersionRef | null {
  let latest: VersionRef | null = null;
  for (const v of song.versions) {
    if (!latest || v.updatedAt > latest.updatedAt) latest = v;
  }
  return latest;
}

export interface RecentVersion {
  song: SongSummary;
  version: VersionRef;
}

/** Versions across every song, newest save first. ISO strings sort as text. */
export function recentVersions(songs: SongSummary[], limit: number): RecentVersion[] {
  const all: RecentVersion[] = [];
  for (const song of songs) {
    for (const version of song.versions) all.push({ song, version });
  }
  all.sort(
    (a, b) =>
      (a.version.updatedAt < b.version.updatedAt ? 1 : a.version.updatedAt > b.version.updatedAt ? -1 : 0) ||
      b.version.id - a.version.id
  );
  return all.slice(0, limit);
}

/**
 * Key and capo worth printing next to a version's label. The key is dropped
 * when the label already names it, since labels like "Tom A" are common and
 * "Tom A · Tom A" says nothing twice. Phrasing matches SongPage.
 */
export function versionDetails(v: Pick<VersionRef, "label" | "songKey" | "capo">): string[] {
  const parts: string[] = [];
  if (v.songKey) {
    const key = `tom ${fold(v.songKey)}`;
    const label = ` ${fold(v.label)} `;
    if (!label.includes(` ${key} `)) parts.push(`Tom ${v.songKey}`);
  }
  if (v.capo) parts.push(`capo ${v.capo}ª`);
  return parts;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "hoje", "30 out", or "30 out 2025" once the year is not the current one. */
export function shortDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return "hoje";
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return sameYear ? base : `${base} ${d.getFullYear()}`;
}
