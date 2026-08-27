import type { Frets } from "./types.js";

// Geometry constants ported unchanged from formatador-cifra.html so printed
// diagrams keep the exact proportions the owner already prints today
// (Constitution Principle II).
const GL = 13;
const DX = 7;
const DY = 7.6;
export const DIAGRAM_WIDTH = 62;

export interface Point {
  x: number;
  y: number;
}

export interface FretLine {
  y: number;
  thick: boolean;
}

export interface Dot {
  x: number;
  y: number;
  finger: string | null;
}

export type BelowMarkerType = "muted" | "open" | "fretted";

export interface BelowMarker {
  x: number;
  type: BelowMarkerType;
}

export interface Barre {
  x1: number;
  x2: number;
  y: number;
}

export interface DiagramGeometry {
  width: number;
  height: number;
  top: number;
  bottom: number;
  stringX: number[];
  fretLines: FretLine[];
  baseFretLabel: { x: number; y: number; text: string } | null;
  barre: Barre | null;
  dots: Dot[];
  belowMarkers: BelowMarker[];
  capoBar: { x: number; y: number; width: number; height: number; fretLabelX: number } | null;
}

function isFretted(f: Frets[number]): f is number {
  return typeof f === "number" && f >= 1;
}

interface BarreSpan {
  at: number[];
  fret: number;
}

/**
 * A barre is one finger held across several strings — exactly what the fingers
 * string records. Where a fingering exists it is the authority, and the shape
 * heuristic never runs.
 *
 * Where two fingers repeat (a double barre), the lower one wins: it is the one
 * the shape is built on.
 */
function barreFromFingers(frets: Frets, fg: string[]): BarreSpan | null {
  const byFinger = new Map<string, number[]>();
  frets.forEach((f, i) => {
    if (!isFretted(f) || !/[1-4]/.test(fg[i])) return;
    const at = byFinger.get(fg[i]) ?? [];
    at.push(i);
    byFinger.set(fg[i], at);
  });

  let best: BarreSpan | null = null;
  for (const at of byFinger.values()) {
    if (at.length < 2) continue;
    const fret = Math.min(...at.map((i) => frets[i] as number));
    if (!best || fret < best.fret) best = { at, fret };
  }
  return best;
}

/**
 * Shape-only fallback for chords stored without a fingering, ported from
 * formatador-cifra.html: the lowest fret held on three or more strings, or on
 * two strings with a higher note between them.
 *
 * The two-string arm needed a span limit the baseline never had. It fired on D
 * (xx0232) — lowest fret on strings 4 and 6, fret 3 between them — and drew a
 * barre across a shape nobody barres. Bm (x24432) has the identical signature
 * but reaches across five strings. Four strings under the finger is the line:
 * below it the shape is comfortably reachable with separate fingers, so it is
 * not a barre. Deliberate divergence from the baseline (Principle II).
 */
function barreFromShape(frets: Frets, numericFrets: number[]): BarreSpan | null {
  if (numericFrets.length === 0) return null;
  const min = Math.min(...numericFrets);
  const at = frets.reduce<number[]>((acc, f, i) => {
    if (f === min) acc.push(i);
    return acc;
  }, []);
  if (at.length < 2) return null;

  const first = at[0];
  const last = at[at.length - 1];
  const gap =
    last - first >= 3 &&
    frets.slice(first + 1, last).some((f) => typeof f === "number" && f > min);

  return at.length >= 3 || gap ? { at, fret: min } : null;
}

/**
 * Pure geometry computation for a chord fret diagram, mirroring the layout
 * baked into formatador-cifra.html. Kept separate from SVG rendering so the
 * math is directly testable (Constitution Principle V).
 */
export function computeDiagram(frets: Frets, fingers: string | null, capo: number | null): DiagramGeometry {
  const fg = (fingers ?? "______").padEnd(6, "_").split("");
  const numericFrets = frets.filter(isFretted);
  const base = numericFrets.length > 0 && Math.max(...numericFrets) > 5 ? Math.min(...numericFrets) : 0;
  const rel = (n: number) => n - (base ? base - 1 : 0);

  const top = capo ? 20 : 14;
  const bottom = top + 5 * DY;
  const height = bottom + 11;

  const stringX = [0, 1, 2, 3, 4, 5].map((i) => GL + i * DX);

  const fretLines: FretLine[] = [0, 1, 2, 3, 4, 5].map((i) => ({
    y: top + i * DY,
    thick: i === 0 && !base && !capo,
  }));

  const baseFretLabel = base
    ? { x: GL + 5 * DX + 3, y: top + DY - 1.5, text: String(base) }
    : null;

  // A fingering with no digits at all carries no information, so it falls
  // through to the shape rather than suppressing a real barre.
  const span = /[1-4]/.test(fg.join(""))
    ? barreFromFingers(frets, fg)
    : barreFromShape(frets, numericFrets);

  const barre: Barre | null = span
    ? {
        x1: stringX[span.at[0]],
        x2: stringX[span.at[span.at.length - 1]],
        y: top + (rel(span.fret) - 0.5) * DY,
      }
    : null;

  const dots: Dot[] = [];
  frets.forEach((f, i) => {
    if (!isFretted(f)) return;
    const finger = /[1-4]/.test(fg[i]) ? fg[i] : null;
    dots.push({ x: stringX[i], y: top + (rel(f) - 0.5) * DY, finger });
  });

  const belowMarkers: BelowMarker[] = frets.map((f, i) => ({
    x: stringX[i],
    type: f === "x" ? "muted" : f === 0 ? "open" : "fretted",
  }));

  const capoBar = capo
    ? {
        x: GL - 3.5,
        y: 4,
        width: 5 * DX + 7,
        height: 7,
        fretLabelX: GL - 6,
      }
    : null;

  return {
    width: DIAGRAM_WIDTH,
    height,
    top,
    bottom,
    stringX,
    fretLines,
    baseFretLabel,
    barre,
    dots,
    belowMarkers,
    capoBar,
  };
}
