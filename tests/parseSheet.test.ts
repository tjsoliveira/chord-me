import { describe, expect, it } from "vitest";
import { parseSheet } from "../src/shared/parseSheet.js";

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
