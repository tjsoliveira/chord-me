import type Database from "better-sqlite3";
import { Router } from "express";
import { formatFretsCanonical, parseFretsInput } from "../../shared/frets.js";
import type { Chord, ChordUsage } from "../../shared/types.js";
import { validateChordInput } from "../../shared/validation.js";
import { ApiError } from "../errors.js";

export interface ChordRow {
  id: number;
  name: string;
  frets: string;
  fingers: string | null;
  caption: string | null;
}

export function rowToChord(row: ChordRow): Chord {
  const parsed = parseFretsInput(row.frets);
  if (!parsed.ok) {
    // Data was validated on the way in; this would only happen from a
    // hand-edited database, which is out of scope to recover from gracefully.
    throw new Error(`Corrupt frets in chord ${row.id}: ${parsed.error}`);
  }
  return { id: row.id, name: row.name, frets: parsed.frets, fingers: row.fingers, caption: row.caption };
}

function findUsages(db: Database.Database, chordId: number): ChordUsage[] {
  return db
    .prepare(
      `SELECT sv.id as versionId, sv.label as versionLabel, s.id as songId, s.title as songTitle
       FROM song_version_chords svc
       JOIN song_versions sv ON sv.id = svc.song_version_id
       JOIN songs s ON s.id = sv.song_id
       WHERE svc.chord_id = ?
       ORDER BY s.title, sv.position`
    )
    .all(chordId) as ChordUsage[];
}

export function chordsRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const rows = q
      ? (db
          .prepare("SELECT * FROM chords WHERE name LIKE ? COLLATE NOCASE ORDER BY name")
          .all(`%${q}%`) as ChordRow[])
      : (db.prepare("SELECT * FROM chords ORDER BY name").all() as ChordRow[]);
    res.json(rows.map(rowToChord));
  });

  router.post("/", (req, res) => {
    const result = validateChordInput(req.body ?? {});
    if (!result.ok || !result.frets) {
      throw ApiError.validation("Invalid chord.", result.errors);
    }
    const now = new Date().toISOString();
    const info = db
      .prepare(
        "INSERT INTO chords (name, frets, fingers, caption, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        req.body.name.trim(),
        formatFretsCanonical(result.frets),
        req.body.fingers || null,
        req.body.caption || null,
        now,
        now
      );
    const row = db.prepare("SELECT * FROM chords WHERE id = ?").get(info.lastInsertRowid) as ChordRow;
    res.status(201).json(rowToChord(row));
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM chords WHERE id = ?").get(req.params.id) as ChordRow | undefined;
    if (!row) throw ApiError.notFound("Chord not found.");
    res.json(rowToChord(row));
  });

  router.put("/:id", (req, res) => {
    const existing = db.prepare("SELECT * FROM chords WHERE id = ?").get(req.params.id) as
      | ChordRow
      | undefined;
    if (!existing) throw ApiError.notFound("Chord not found.");

    const result = validateChordInput(req.body ?? {});
    if (!result.ok || !result.frets) {
      throw ApiError.validation("Invalid chord.", result.errors);
    }

    const now = new Date().toISOString();
    db.prepare(
      "UPDATE chords SET name = ?, frets = ?, fingers = ?, caption = ?, updated_at = ? WHERE id = ?"
    ).run(
      req.body.name.trim(),
      formatFretsCanonical(result.frets),
      req.body.fingers || null,
      req.body.caption || null,
      now,
      req.params.id
    );
    const row = db.prepare("SELECT * FROM chords WHERE id = ?").get(req.params.id) as ChordRow;
    res.json(rowToChord(row));
  });

  router.get("/:id/usages", (req, res) => {
    const existing = db.prepare("SELECT id FROM chords WHERE id = ?").get(req.params.id);
    if (!existing) throw ApiError.notFound("Chord not found.");
    res.json(findUsages(db, Number(req.params.id)));
  });

  router.delete("/:id", (req, res) => {
    const existing = db.prepare("SELECT id FROM chords WHERE id = ?").get(req.params.id);
    if (!existing) throw ApiError.notFound("Chord not found.");

    const usages = findUsages(db, Number(req.params.id));
    if (usages.length > 0) {
      throw ApiError.chordInUse(usages);
    }

    db.prepare("DELETE FROM chords WHERE id = ?").run(req.params.id);
    res.status(204).end();
  });

  return router;
}
