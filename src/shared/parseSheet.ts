export type Block =
  | { kind: "pair"; chordLine: string; lyricLine: string }
  | { kind: "chords"; line: string }
  | { kind: "lyrics"; line: string }
  | { kind: "section"; line: string }
  | { kind: "blank" };

// Ported unchanged from formatador-cifra.html so pasted chord-sheet text keeps
// classifying the way it always has (Constitution Principle II).
const CHORD_NAME =
  /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|[mM])?(?:[0-9()#b+\-º°]|maj|min|dim|aug|sus|add|[mM]|\/[A-G][#b]?)*$/;

function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((w) => CHORD_NAME.test(w));
}

const SECTION_LINE = /^\[.+\]$|^(intro|verso|refr|ponte|solo|final|pré|coda|parte)/i;

function isSectionLine(line: string): boolean {
  return SECTION_LINE.test(line.trim());
}

/**
 * Classifies each line of pasted chord-sheet text. Pure and DOM-free so it is
 * directly testable (Constitution Principle V) and usable identically from
 * both the client (live preview) and, if ever needed, the server.
 */
export function parseSheet(text: string): Block[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      blocks.push({ kind: "blank" });
      i++;
      continue;
    }

    if (isSectionLine(line)) {
      blocks.push({ kind: "section", line: line.trim() });
      i++;
      continue;
    }

    const next = lines[i + 1];
    if (isChordLine(line) && next && next.trim() && !isChordLine(next)) {
      blocks.push({ kind: "pair", chordLine: line, lyricLine: next });
      i += 2;
      continue;
    }

    blocks.push(isChordLine(line) ? { kind: "chords", line } : { kind: "lyrics", line });
    i++;
  }

  return blocks;
}

export interface PairSegment {
  chords: string;
  lyrics: string;
}

/**
 * Cuts a chord+lyric pair into pieces that can wrap as units. A cut falls at
 * the start of each lyric word, unless it would split a chord name; then the
 * piece runs on to the next word. Both halves of a piece have the same length,
 * so the pieces laid side by side reproduce the original two lines exactly.
 */
export function segmentPair(chordLine: string, lyricLine: string): PairSegment[] {
  const width = Math.max(chordLine.length, lyricLine.length);
  const chords = chordLine.padEnd(width);
  const lyrics = lyricLine.padEnd(width);
  const isGap = (s: string, p: number) => s[p] === " ";

  const cuts = [0];
  for (let p = 1; p < width; p++) {
    const wordStart = !isGap(lyrics, p) && isGap(lyrics, p - 1);
    const insideChord = !isGap(chords, p) && !isGap(chords, p - 1);
    if (wordStart && !insideChord) cuts.push(p);
  }
  cuts.push(width);

  const segments: PairSegment[] = [];
  for (let k = 0; k < cuts.length - 1; k++) {
    segments.push({
      chords: chords.slice(cuts[k], cuts[k + 1]),
      lyrics: lyrics.slice(cuts[k], cuts[k + 1]),
    });
  }
  return segments;
}
