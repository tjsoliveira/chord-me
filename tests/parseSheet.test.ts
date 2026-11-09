import { describe, expect, it } from "vitest";
import { parseSheet, segmentPair } from "../src/shared/parseSheet.js";

describe("parseSheet", () => {
  it("pairs a chord line with the lyric line directly beneath it", () => {
    const blocks = parseSheet("D        G\nOusado amor");
    expect(blocks).toEqual([
      { kind: "pair", chordLine: "D        G", lyricLine: "Ousado amor" },
    ]);
  });

  it("leaves a chord line alone when nothing follows it", () => {
    const blocks = parseSheet("D G Em A");
    expect(blocks).toEqual([{ kind: "chords", line: "D G Em A" }]);
  });

  it("leaves a chord line alone when the next line is also a chord line", () => {
    const blocks = parseSheet("D G\nEm A");
    expect(blocks).toEqual([
      { kind: "chords", line: "D G" },
      { kind: "chords", line: "Em A" },
    ]);
  });

  it("classifies bracketed section markers as headings", () => {
    const blocks = parseSheet("[Intro]\nD G");
    expect(blocks[0]).toEqual({ kind: "section", line: "[Intro]" });
  });

  it("classifies Portuguese word-form section markers as headings", () => {
    const blocks = parseSheet("Refrão\nletra");
    expect(blocks[0]).toEqual({ kind: "section", line: "Refrão" });
  });

  it("classifies a lyrics-only sheet with no line as chords", () => {
    const blocks = parseSheet("Just some lyrics\nMore lyrics here");
    expect(blocks.every((b) => b.kind !== "chords" && b.kind !== "pair")).toBe(true);
  });

  it("turns blank lines into separators", () => {
    const blocks = parseSheet("a\n\nb");
    expect(blocks[1]).toEqual({ kind: "blank" });
  });

  it("recognises slash chords, extensions, and degree-sign notation on a chord line", () => {
    const blocks = parseSheet("D/F# Cmaj7 Em9 Cadd9 Fº G°");
    expect(blocks).toEqual([{ kind: "chords", line: "D/F# Cmaj7 Em9 Cadd9 Fº G°" }]);
  });
});

describe("segmentPair", () => {
  const join = (segs: { chords: string; lyrics: string }[]) => ({
    chords: segs.map((s) => s.chords).join(""),
    lyrics: segs.map((s) => s.lyrics).join(""),
  });

  it("cuts at each lyric word and reproduces both lines when rejoined", () => {
    const segs = segmentPair("D        G", "Ousado amor");
    expect(segs).toEqual([
      { chords: "D      ", lyrics: "Ousado " },
      { chords: "  G ", lyrics: "amor" },
    ]);
    expect(join(segs)).toEqual({ chords: "D        G ", lyrics: "Ousado amor" });
  });

  it("keeps a chord over the syllable it was written over once the line wraps", () => {
    const lyric = "I see that I never really got it right";
    const chord = "Bm" + " ".repeat(lyric.indexOf("right") + 4 - 2) + "G";
    const segs = segmentPair(chord, lyric);
    expect(segs[0]).toEqual({ chords: "Bm", lyrics: "I " });
    expect(segs.at(-1)).toEqual({ chords: "    G", lyrics: "right" });
  });

  it("never cuts through a chord name that spans the start of a word", () => {
    expect(segmentPair("   F#m", "got it right")).toEqual([
      { chords: "   F#m ", lyrics: "got it " },
      { chords: "     ", lyrics: "right" },
    ]);
  });

  it("keeps chords past the end of the lyric in the last piece", () => {
    expect(segmentPair("C     G", "la la")).toEqual([
      { chords: "C  ", lyrics: "la " },
      { chords: "   G", lyrics: "la  " },
    ]);
  });

  it("keeps a lyric's leading spaces as a piece of their own", () => {
    expect(segmentPair("   C", "   hello")).toEqual([
      { chords: "   ", lyrics: "   " },
      { chords: "C    ", lyrics: "hello" },
    ]);
  });
});
