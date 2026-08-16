import type { ChordUsage, ErrorCode } from "../shared/types.js";
import type { FieldErrors } from "../shared/validation.js";

export class ApiError extends Error {
  code: ErrorCode;
  fields?: FieldErrors;
  usages?: ChordUsage[];
  status: number;

  constructor(status: number, code: ErrorCode, message: string, extra?: { fields?: FieldErrors; usages?: ChordUsage[] }) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = extra?.fields;
    this.usages = extra?.usages;
  }

  static validation(message: string, fields: FieldErrors): ApiError {
    return new ApiError(400, "VALIDATION_FAILED", message, { fields });
  }

  static notFound(message = "Not found."): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static chordInUse(usages: ChordUsage[]): ApiError {
    return new ApiError(
      409,
      "CHORD_IN_USE",
      `This chord is used by ${usages.length} song version${usages.length === 1 ? "" : "s"}.`,
      { usages }
    );
  }
}
