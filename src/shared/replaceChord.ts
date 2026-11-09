import { isChordLine } from "./parseSheet.js";

export interface ChordReplacement {
  text: string;
  count: number;
}

// A line like "Intro: G D Em" is a heading to the parser, but the chords
// after the colon still belong to the song.
const LABELLED = /^([^:]*:)(.*)$/;

/**
 * Swaps one chord name for another wherever it is used as a chord, never in
 * lyrics. Only whole names match, so replacing "E" leaves "Em" alone. Each
 * chord keeps its column so it stays over the same syllable; a longer name
 * only pushes the next chord along when the two would touch. Lines with no
 * match come back byte-for-byte unchanged.
 */
export function replaceChord(text: string, from: string, to: string): ChordReplacement {
  let count = 0;

  const lines = text.split("\n").map((line) => {
    if (isChordLine(line)) {
      const swapped = swapTokens(line, from, to);
      count += swapped.count;
      return swapped.line;
    }

    const labelled = LABELLED.exec(line);
    if (labelled && isChordLine(labelled[2])) {
      const swapped = swapTokens(labelled[2], from, to);
      count += swapped.count;
      return labelled[1] + swapped.line;
    }

    return line;
  });

  return { text: lines.join("\n"), count };
}

function swapTokens(line: string, from: string, to: string): { line: string; count: number } {
  let out = "";
  let count = 0;

  for (const match of line.matchAll(/\S+/g)) {
    const name = match[0] === from ? to : match[0];
    if (name !== match[0]) count++;
    const column = out === "" ? match.index : Math.max(match.index, out.length + 1);
    out = out.padEnd(column) + name;
  }

  return count === 0 ? { line, count } : { line: out, count };
}
