import { describe, expect, it } from "vitest";
import { formatFretsCanonical, parseFretsInput, validateFingers } from "../src/shared/frets.js";

describe("parseFretsInput", () => {
  it("parses the compact six-character form", () => {
    const result = parseFretsInput("x02220");
    expect(result).toEqual({ ok: true, frets: ["x", 0, 2, 2, 2, 0] });
  });

  it("parses the canonical space-separated form", () => {
    const result = parseFretsInput("x 0 2 2 2 0");
    expect(result).toEqual({ ok: true, frets: ["x", 0, 2, 2, 2, 0] });
  });

  it("round-trips frets above 9 through the canonical form only", () => {
    const result = parseFretsInput("x 10 12 12 x x");
    expect(result).toEqual({ ok: true, frets: ["x", 10, 12, 12, "x", "x"] });
    if (result.ok) {
      expect(formatFretsCanonical(result.frets)).toBe("x 10 12 12 x x");
    }
  });

  it("rejects the compact form's inability to express frets above 9 as a wrong-length string", () => {
    // "x101212xx" is 9 characters, not 6 - the compact form simply cannot
    // represent two-digit frets, so it is caught by the token-count check.
    const result = parseFretsInput("x101212xx");
    expect(result.ok).toBe(false);
  });

  it("rejects wrong token count with a specific message", () => {
    const result = parseFretsInput("x0222");
    expect(result).toEqual({
      ok: false,
      error: "Expected 6 strings, got 5.",
    });
  });

  it("rejects an unsupported character with a specific message naming the string", () => {
    const result = parseFretsInput("x 0 2 2 y 0");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("String 5");
    }
  });

  it("rejects a fret above the maximum with a specific message", () => {
    const result = parseFretsInput("x 0 2 2 2 25");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("String 6");
    }
  });

  it("rejects empty input", () => {
    const result = parseFretsInput("   ");
    expect(result.ok).toBe(false);
  });
});

describe("formatFretsCanonical", () => {
  it("joins tokens with single spaces", () => {
    expect(formatFretsCanonical(["x", 0, 2, 2, 2, 0])).toBe("x 0 2 2 2 0");
  });
});

describe("validateFingers", () => {
  it("accepts exactly six chars of 1-4 and _", () => {
    expect(validateFingers("_123__")).toBeNull();
  });

  it("rejects wrong length", () => {
    expect(validateFingers("_123_")).not.toBeNull();
  });

  it("rejects unsupported characters", () => {
    expect(validateFingers("_123_5")).not.toBeNull();
  });
});
