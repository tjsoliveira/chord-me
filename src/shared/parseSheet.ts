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
