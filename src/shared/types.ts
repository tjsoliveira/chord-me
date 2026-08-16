export type FretToken = "x" | number;

export type Frets = [FretToken, FretToken, FretToken, FretToken, FretToken, FretToken];

export interface Chord {
  id: number;
  name: string;
  frets: Frets;
  fingers: string | null;
  caption: string | null;
}

export interface FormattingSettings {
  columns: number;
  bodySize: number;
  lineHeight: number;
  marginMm: number;
  topExtraMm: number;
}

export const DEFAULT_FORMATTING: FormattingSettings = {
  columns: 3,
  bodySize: 8.5,
  lineHeight: 1.3,
  marginMm: 18,
  topExtraMm: 12,
};

export interface SongVersion {
  id: number;
  songId: number;
  label: string;
  position: number;
  sheetText: string;
  songKey: string | null;
  capo: number | null;
  formatting: FormattingSettings;
  chordIds: number[];
}

export interface SongVersionWithChords extends SongVersion {
  chords: Chord[];
}

/** Just enough to name a version and link to it. Never carries sheetText. */
export interface VersionRef {
  id: number;
  label: string;
}

export interface SongSummary {
  id: number;
  title: string;
  artist: string;
  versionCount: number;
  /** Ordered by position. Empty array, never null, when the song has none. */
  versions: VersionRef[];
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  versions: SongVersion[];
}

export interface ChordUsage {
  songId: number;
  songTitle: string;
  versionId: number;
  versionLabel: string;
}

export type ErrorCode = "VALIDATION_FAILED" | "NOT_FOUND" | "CHORD_IN_USE" | "INTERNAL";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
    usages?: ChordUsage[];
  };
}
