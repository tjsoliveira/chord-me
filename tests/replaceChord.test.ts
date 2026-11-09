import { describe, expect, it } from "vitest";
import { replaceChord } from "../src/shared/replaceChord.js";

describe("replaceChord", () => {
  it("replaces every use of the chord and counts them", () => {
    const sheet = "G        D\nA estrada é longa\nG\nmas eu sigo";
    expect(replaceChord(sheet, "G", "C")).toEqual({
      text: "C        D\nA estrada é longa\nC\nmas eu sigo",
      count: 2,
    });
  });

  it("never touches lyric lines, even when a word looks like the chord", () => {
    const sheet = "Em\nE a noite caiu";
    expect(replaceChord(sheet, "E", "A").text).toBe(sheet);
  });

  it("matches whole names only", () => {
    expect(replaceChord("E  Em  E7", "E", "F").text).toBe("F  Em  E7");
  });

  it("keeps each following chord in its column when the name grows", () => {
    expect(replaceChord("B5      D", "B5", "Cadd9").text).toBe("Cadd9   D");
  });

  it("pushes the next chord along only when the names would touch", () => {
    expect(replaceChord("A B", "A", "Asus4").text).toBe("Asus4 B");
  });

  it("keeps following chords in place when the name shrinks", () => {
    expect(replaceChord("Cadd9   D", "Cadd9", "C").text).toBe("C       D");
  });

  it("keeps leading indentation", () => {
    expect(replaceChord("      G", "G", "D").text).toBe("      D");
  });

  it("replaces chords listed after a heading label", () => {
    expect(replaceChord("Intro: G  D  Em", "G", "C").text).toBe("Intro: C  D  Em");
  });

  it("leaves a sheet without the chord untouched", () => {
    const sheet = "D   A  \nvoltei pra casa";
    expect(replaceChord(sheet, "G", "C")).toEqual({ text: sheet, count: 0 });
  });
});
