import type Database from "better-sqlite3";
import { Router } from "express";
import { DEFAULT_FORMATTING, type Chord, type SongVersion, type SongVersionWithChords } from "../../shared/types.js";
import { validateCapo, validateFormatting, validateVersionLabel } from "../../shared/validation.js";
import { ApiError } from "../errors.js";
import { rowToChord, type ChordRow } from "./chords.js";

export interface VersionRow {
  id: number;
  song_id: number;
  label: string;
  position: number;
  sheet_text: string;
  song_key: string | null;
  capo: number | null;
  fmt_columns: number;
  fmt_body_size: number;
  fmt_line_height: number;
  fmt_margin_mm: number;
  fmt_top_extra_mm: number;
}

function getChordIds(db: Database.Database, versionId: number): number[] {
  return (
    db
      .prepare("SELECT chord_id FROM song_version_chords WHERE song_version_id = ? ORDER BY position")
      .all(versionId) as { chord_id: number }[]
  ).map((r) => r.chord_id);
}

export function rowToVersion(db: Database.Database, row: VersionRow): SongVersion {
  return {
    id: row.id,
    songId: row.song_id,
    label: row.label,
    position: row.position,
    sheetText: row.sheet_text,
    songKey: row.song_key,
    capo: row.capo,
    formatting: {
      columns: row.fmt_columns,
      bodySize: row.fmt_body_size,
      lineHeight: row.fmt_line_height,
      marginMm: row.fmt_margin_mm,
      topExtraMm: row.fmt_top_extra_mm,
    },
    chordIds: getChordIds(db, row.id),
  };
}

function resolveChords(db: Database.Database, chordIds: number[]): Chord[] {
  const stmt = db.prepare("SELECT * FROM chords WHERE id = ?");
  return chordIds.map((id) => rowToChord(stmt.get(id) as ChordRow));
}

function nextPosition(db: Database.Database, songId: number): number {
  const row = db
    .prepare("SELECT COALESCE(MAX(position), -1) as maxPos FROM song_versions WHERE song_id = ?")
    .get(songId) as { maxPos: number };
  return row.maxPos + 1;
}

function replaceChordSelection(db: Database.Database, versionId: number, chordIds: number[]): void {
  for (const id of chordIds) {
    const exists = db.prepare("SELECT id FROM chords WHERE id = ?").get(id);
    if (!exists) {
      throw ApiError.validation("Invalid chord selection.", { chordIds: `Chord ${id} does not exist.` });
    }
  }
  db.prepare("DELETE FROM song_version_chords WHERE song_version_id = ?").run(versionId);
  const insert = db.prepare(
    "INSERT INTO song_version_chords (song_version_id, chord_id, position) VALUES (?, ?, ?)"
  );
  chordIds.forEach((chordId, i) => insert.run(versionId, chordId, i));
}

export function versionsRouter(db: Database.Database): Router {
  const router = Router();

  router.post("/songs/:songId/versions", (req, res) => {
    const song = db.prepare("SELECT id FROM songs WHERE id = ?").get(req.params.songId);
    if (!song) throw ApiError.notFound("Song not found.");

    const body = req.body ?? {};
    const labelErrors = validateVersionLabel(body.label ?? "");
    const capoErrors = validateCapo(body.capo ?? null);
    const formatting = { ...DEFAULT_FORMATTING, ...(body.formatting ?? {}) };
    const formattingErrors = validateFormatting(formatting);
    const errors = { ...labelErrors, ...capoErrors, ...formattingErrors };
    if (Object.keys(errors).length > 0) {
      throw ApiError.validation("Invalid version.", errors);
    }

    const now = new Date().toISOString();
    const songId = Number(req.params.songId);
    const position = nextPosition(db, songId);
    const sheetText = (body.sheetText ?? "").replace(/\r/g, "");

    const run = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO song_versions
           (song_id, label, position, sheet_text, song_key, capo,
            fmt_columns, fmt_body_size, fmt_line_height, fmt_margin_mm, fmt_top_extra_mm,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          songId,
          body.label.trim(),
          position,
          sheetText,
          body.songKey || null,
          body.capo ?? null,
          formatting.columns,
          formatting.bodySize,
          formatting.lineHeight,
          formatting.marginMm,
          formatting.topExtraMm,
          now,
          now
        );
      const versionId = Number(info.lastInsertRowid);
      if (Array.isArray(body.chordIds) && body.chordIds.length > 0) {
        replaceChordSelection(db, versionId, body.chordIds);
      }
      return versionId;
    });

    const versionId = run();
    const row = db.prepare("SELECT * FROM song_versions WHERE id = ?").get(versionId) as VersionRow;
    res.status(201).json(rowToVersion(db, row));
  });

  router.get("/versions/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM song_versions WHERE id = ?").get(req.params.id) as
      | VersionRow
      | undefined;
    if (!row) throw ApiError.notFound("Version not found.");

    const version = rowToVersion(db, row);
    const withChords: SongVersionWithChords = {
      ...version,
      chords: resolveChords(db, version.chordIds),
    };
    res.json(withChords);
  });

  router.put("/versions/:id", (req, res) => {
    const existing = db.prepare("SELECT * FROM song_versions WHERE id = ?").get(req.params.id) as
      | VersionRow
      | undefined;
    if (!existing) throw ApiError.notFound("Version not found.");

    const body = req.body ?? {};
    const errors: Record<string, string> = {};

    if (body.label !== undefined) Object.assign(errors, validateVersionLabel(body.label));
    if (body.capo !== undefined) Object.assign(errors, validateCapo(body.capo));
    if (body.formatting !== undefined) Object.assign(errors, validateFormatting(body.formatting));
    if (Object.keys(errors).length > 0) {
      throw ApiError.validation("Invalid version.", errors);
    }

    const now = new Date().toISOString();
    const next = {
      label: body.label !== undefined ? body.label.trim() : existing.label,
      position: body.position !== undefined ? body.position : existing.position,
      sheetText: body.sheetText !== undefined ? String(body.sheetText).replace(/\r/g, "") : existing.sheet_text,
      songKey: body.songKey !== undefined ? body.songKey || null : existing.song_key,
      capo: body.capo !== undefined ? body.capo : existing.capo,
      columns: body.formatting?.columns ?? existing.fmt_columns,
      bodySize: body.formatting?.bodySize ?? existing.fmt_body_size,
      lineHeight: body.formatting?.lineHeight ?? existing.fmt_line_height,
      marginMm: body.formatting?.marginMm ?? existing.fmt_margin_mm,
      topExtraMm: body.formatting?.topExtraMm ?? existing.fmt_top_extra_mm,
    };

    const run = db.transaction(() => {
      db.prepare(
        `UPDATE song_versions SET
           label = ?, position = ?, sheet_text = ?, song_key = ?, capo = ?,
           fmt_columns = ?, fmt_body_size = ?, fmt_line_height = ?, fmt_margin_mm = ?, fmt_top_extra_mm = ?,
           updated_at = ?
         WHERE id = ?`
      ).run(
        next.label,
        next.position,
        next.sheetText,
        next.songKey,
        next.capo,
        next.columns,
        next.bodySize,
        next.lineHeight,
        next.marginMm,
        next.topExtraMm,
        now,
        req.params.id
      );
      if (Array.isArray(body.chordIds)) {
        replaceChordSelection(db, Number(req.params.id), body.chordIds);
      }
    });
    run();

    const row = db.prepare("SELECT * FROM song_versions WHERE id = ?").get(req.params.id) as VersionRow;
    const version = rowToVersion(db, row);
    const withChords: SongVersionWithChords = { ...version, chords: resolveChords(db, version.chordIds) };
    res.json(withChords);
  });

  router.delete("/versions/:id", (req, res) => {
    const existing = db.prepare("SELECT id FROM song_versions WHERE id = ?").get(req.params.id);
    if (!existing) throw ApiError.notFound("Version not found.");
    db.prepare("DELETE FROM song_versions WHERE id = ?").run(req.params.id); // cascades to chord links only
    res.status(204).end();
  });

  return router;
}
