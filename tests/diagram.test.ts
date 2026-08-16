import { describe, expect, it } from "vitest";
import { computeDiagram } from "../src/shared/diagram.js";
import type { Frets } from "../src/shared/types.js";

describe("computeDiagram", () => {
  it("draws a thick nut line for an open-position shape with no capo", () => {
    const frets: Frets = ["x", 3, 2, 0, 1, 0]; // C
    const g = computeDiagram(frets, null, null);
    expect(g.fretLines[0].thick).toBe(true);
    expect(g.baseFretLabel).toBeNull();
  });

  it("reports a base fret instead of drawing empty frets above the fifth fret", () => {
    const frets: Frets = ["x", 4, 6, 6, 5, 4]; // C#m, starts at fret 4
    const g = computeDiagram(frets, null, null);
    expect(g.baseFretLabel).not.toBeNull();
    expect(g.baseFretLabel?.text).toBe("4");
    expect(g.fretLines[0].thick).toBe(false);
  });

  it("detects a barre across three or more strings sharing the lowest fret", () => {
    const frets: Frets = [1, 3, 3, 2, 1, 1]; // F
    const g = computeDiagram(frets, null, null);
    expect(g.barre).not.toBeNull();
    expect(g.barre?.x1).toBe(g.stringX[0]);
    expect(g.barre?.x2).toBe(g.stringX[5]);
  });

  it("detects a barre across two strings with a higher fretted note between them", () => {
    // strings: x 4 6 6 5 4 -> min=4 at indices [1,5], between has 6s (>4) => gap barre
    const frets: Frets = ["x", 4, 6, 6, 5, 4];
    const g = computeDiagram(frets, null, null);
    expect(g.barre).not.toBeNull();
    expect(g.barre?.x1).toBe(g.stringX[1]);
    expect(g.barre?.x2).toBe(g.stringX[5]);
  });

  it("does not draw a barre when fewer than 3 strings share the lowest fret with no gap", () => {
    const frets: Frets = [0, 2, 2, 0, 0, 0]; // Em, only 2 strings on fret 2, adjacent
    const g = computeDiagram(frets, null, null);
    expect(g.barre).toBeNull();
  });

  it("draws a connecting line when 3+ strings share the lowest fret, matching baseline behaviour", () => {
    const frets: Frets = ["x", 0, 2, 2, 2, 0]; // A - baseline draws this even though it's 3 fingers, not a true barre
    const g = computeDiagram(frets, null, null);
    expect(g.barre).not.toBeNull();
  });

  it("marks muted and open strings correctly below the grid", () => {
    const frets: Frets = ["x", 0, 2, 2, 2, 0]; // A
    const g = computeDiagram(frets, null, null);
    expect(g.belowMarkers[0].type).toBe("muted");
    expect(g.belowMarkers[1].type).toBe("open");
    expect(g.belowMarkers[2].type).toBe("fretted");
  });

  it("suppresses the thick nut line and reports a capo bar when a capo is set", () => {
    const frets: Frets = ["x", 0, 2, 2, 2, 0];
    const g = computeDiagram(frets, null, 2);
    expect(g.fretLines[0].thick).toBe(false);
    expect(g.capoBar).not.toBeNull();
  });

  it("positions frets above 9 correctly", () => {
    const frets: Frets = ["x", 10, 12, 12, "x", "x"];
    const g = computeDiagram(frets, null, null);
    expect(g.baseFretLabel?.text).toBe("10");
    // both fretted dots should exist and be at distinct rows relative to base
    expect(g.dots).toHaveLength(3);
  });

  it("attaches finger numbers to dots when supplied", () => {
    const frets: Frets = [1, 3, 3, 2, 1, 1]; // F
    const g = computeDiagram(frets, "134211", null);
    const firstDot = g.dots.find((d) => d.x === g.stringX[0]);
    expect(firstDot?.finger).toBe("1");
  });
});
