import { describe, expect, it } from "vitest";
import { filterChords } from "../src/shared/chordSearch.js";
import type { Chord, Frets } from "../src/shared/types.js";

function chord(id: number, name: string, frets: Frets = ["x", 0, 2, 2, 2, 0]): Chord {
  return { id, name, frets, fingers: null, caption: null };
}

const catalog: Chord[] = [
  chord(1, "Ab"),
  chord(2, "Am7", ["x", 0, 2, 0, 1, 0]),
  chord(3, "B", ["x", 2, 4, 4, 4, 2]),
  chord(4, "B7"),
  chord(5, "Bb"),
  chord(6, "Bm", ["x", 2, 4, 4, 3, 2]),
  chord(7, "Db"),
];

describe("filterChords", () => {
  it("returns the list untouched for an empty query", () => {
    expect(filterChords(catalog, "")).toEqual(catalog);
  });

  it("treats a whitespace-only query as empty", () => {
    expect(filterChords(catalog, "   ")).toEqual(catalog);
  });

  it("matches regardless of case, in either direction", () => {
    expect(filterChords(catalog, "bm").map((c) => c.name)).toEqual(["Bm"]);
    expect(filterChords(catalog, "BM").map((c) => c.name)).toEqual(["Bm"]);
  });

  it("matches a substring, not only a prefix", () => {
    expect(filterChords(catalog, "m7").map((c) => c.name)).toEqual(["Am7"]);
  });

  it("ranks prefix matches above substring matches, keeping the input order inside each", () => {
    // The reason this ordering exists: every flat contains "b".
    expect(filterChords(catalog, "b").map((c) => c.name)).toEqual([
      "B",
      "B7",
      "Bb",
      "Bm",
      "Ab",
      "Db",
    ]);
  });

  it("returns nothing when no name matches", () => {
    expect(filterChords(catalog, "zz")).toEqual([]);
  });

  it("keeps both rows when two chords share a name with different voicings", () => {
    const twins = [
      chord(10, "Bm", ["x", 2, 4, 4, 3, 2]),
      chord(11, "Bm", [7, 9, 9, 7, 7, 7]),
    ];
    const result = filterChords(twins, "bm");
    expect(result.map((c) => c.id)).toEqual([10, 11]);
  });

  it("never matches frets, fingers or caption - name only", () => {
    const shaped: Chord[] = [
      { id: 20, name: "E", frets: [0, 2, 2, 1, 0, 0], fingers: "_231__", caption: "pestana" },
    ];
    expect(filterChords(shaped, "022100")).toEqual([]);
    expect(filterChords(shaped, "0 2 2 1 0 0")).toEqual([]);
    expect(filterChords(shaped, "pestana")).toEqual([]);
    expect(filterChords(shaped, "231")).toEqual([]);
  });
});
