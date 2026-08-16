import type { FretToken, Frets } from "./types.js";

const STRING_COUNT = 6;
const MAX_FRET = 24;

export type FretsParseResult =
  | { ok: true; frets: Frets }
  | { ok: false; error: string };

function parseToken(raw: string): FretToken | null {
  if (raw === "x" || raw === "X") return "x";
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (n < 0 || n > MAX_FRET) return null;
  return n;
}

/**
 * Accepts either the canonical space-separated form ("x 0 2 2 2 0") or the
 * compact six-character shorthand ("x02220"). The compact form cannot express
 * frets above 9 since each string is one character.
 */
export function parseFretsInput(input: string): FretsParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Fret pattern is required." };
  }

  const rawTokens = trimmed.includes(" ")
    ? trimmed.split(/\s+/)
    : trimmed.split("");

  if (rawTokens.length !== STRING_COUNT) {
    return {
      ok: false,
      error: `Expected ${STRING_COUNT} strings, got ${rawTokens.length}.`,
    };
  }

  const tokens: FretToken[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const parsed = parseToken(rawTokens[i]);
    if (parsed === null) {
      return {
        ok: false,
        error: `String ${i + 1}: "${rawTokens[i]}" is not "x" or a fret 0-${MAX_FRET}.`,
      };
    }
    tokens.push(parsed);
  }

  return { ok: true, frets: tokens as Frets };
}

export function formatFretsCanonical(frets: Frets): string {
  return frets.join(" ");
}

const FINGER_CHARS = /^[1-4_]{6}$/;

export function validateFingers(fingers: string): string | null {
  if (!FINGER_CHARS.test(fingers)) {
    return "Fingers must be exactly 6 characters, each '1'-'4' or '_'.";
  }
  return null;
}
