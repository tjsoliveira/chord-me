import { parseFretsInput, validateFingers } from "./frets.js";
import type { FormattingSettings, Frets } from "./types.js";

export type FieldErrors = Record<string, string>;

function nonEmpty(value: string | undefined | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export interface ChordInput {
  name: string;
  frets: string;
  fingers?: string | null;
  caption?: string | null;
}

export interface ChordValidationResult {
  ok: boolean;
  errors: FieldErrors;
  frets?: Frets;
}

export function validateChordInput(input: ChordInput): ChordValidationResult {
  const errors: FieldErrors = {};

  if (!nonEmpty(input.name)) {
    errors.name = "Chord name is required.";
  }

  const fretsResult = parseFretsInput(input.frets ?? "");
  if (!fretsResult.ok) {
    errors.frets = fretsResult.error;
  }

  if (input.fingers != null && input.fingers !== "") {
    const fingerError = validateFingers(input.fingers);
    if (fingerError) {
      errors.fingers = fingerError;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    frets: fretsResult.ok ? fretsResult.frets : undefined,
  };
}

export function validateSongTitle(title: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!nonEmpty(title)) {
    errors.title = "Song title is required.";
  }
  return errors;
}

export function validateVersionLabel(label: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!nonEmpty(label)) {
    errors.label = "Version label is required.";
  }
  return errors;
}

export function validateCapo(capo: number | null | undefined): FieldErrors {
  const errors: FieldErrors = {};
  if (capo != null && (!Number.isInteger(capo) || capo < 1 || capo > 12)) {
    errors.capo = "Capo must be an integer between 1 and 12.";
  }
  return errors;
}

const FORMATTING_RANGES: Record<keyof FormattingSettings, [number, number]> = {
  columns: [1, 4],
  bodySize: [6, 16],
  lineHeight: [1.0, 2.0],
  marginMm: [0, 40],
  topExtraMm: [0, 40],
};

export function validateFormatting(formatting: Partial<FormattingSettings>): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of Object.keys(FORMATTING_RANGES) as Array<keyof FormattingSettings>) {
    const value = formatting[key];
    if (value === undefined) continue;
    const [min, max] = FORMATTING_RANGES[key];
    if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
      errors[key] = `${key} must be between ${min} and ${max}.`;
    }
  }
  return errors;
}
