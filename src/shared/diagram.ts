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

  const min = numericFrets.length > 0 ? Math.min(...numericFrets) : 0;
  const at = frets.reduce<number[]>((acc, f, i) => {
    if (f === min) acc.push(i);
    return acc;
  }, []);
  const between = at.length >= 2 ? frets.slice(at[0] + 1, at[at.length - 1]) : [];
  const gap = between.some((f) => typeof f === "number" && f > min);

  const barre: Barre | null =
    min && (at.length >= 3 || gap)
      ? { x1: stringX[at[0]], x2: stringX[at[at.length - 1]], y: top + (rel(min) - 0.5) * DY }
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
