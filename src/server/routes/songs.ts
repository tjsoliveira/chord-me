import type Database from "better-sqlite3";
import { Router } from "express";
import type { Song, SongSummary, SongVersion, VersionRef } from "../../shared/types.js";
import { validateSongTitle } from "../../shared/validation.js";
import { ApiError } from "../errors.js";
import { rowToVersion, type VersionRow } from "./versions.js";

interface SongRow {
  id: number;
  title: string;
  artist: string;
}

type SummaryRow = Omit<SongSummary, "versions">;

interface VersionRefRow {
  id: number;
  song_id: number;
  label: string;
  song_key: string | null;
  capo: number | null;
}

/**
 * Attaches each song's version refs with a single extra query, so listing N
 * songs costs 2 queries rather than N+1. Key and capo travel with the ref so
 * the library can show what a version is without opening it; sheetText never
 * enters a summary response.
 */
function withVersions(db: Database.Database, rows: SummaryRow[]): SongSummary[] {
  if (rows.length === 0) return [];

  const placeholders = rows.map(() => "?").join(",");
  const versionRows = db
    .prepare(
      `SELECT id, song_id, label, song_key, capo FROM song_versions
       WHERE song_id IN (${placeholders})
       ORDER BY song_id, position`
    )
    .all(...rows.map((r) => r.id)) as VersionRefRow[];

  const bySong = new Map<number, VersionRef[]>();
  for (const v of versionRows) {
    const ref: VersionRef = { id: v.id, label: v.label, songKey: v.song_key, capo: v.capo };
    const list = bySong.get(v.song_id);
    if (list) list.push(ref);
    else bySong.set(v.song_id, [ref]);
  }

  return rows.map((r) => ({ ...r, versions: bySong.get(r.id) ?? [] }));
}

export function songsRouter(db: Database.Database): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const rows = q
      ? (db
          .prepare(
            `SELECT s.id, s.title, s.artist, COUNT(sv.id) as versionCount
             FROM songs s LEFT JOIN song_versions sv ON sv.song_id = s.id
             WHERE s.title LIKE ? COLLATE NOCASE OR s.artist LIKE ? COLLATE NOCASE
             GROUP BY s.id ORDER BY s.title`
          )
          .all(`%${q}%`, `%${q}%`) as SummaryRow[])
      : (db
          .prepare(
            `SELECT s.id, s.title, s.artist, COUNT(sv.id) as versionCount
             FROM songs s LEFT JOIN song_versions sv ON sv.song_id = s.id
             GROUP BY s.id ORDER BY s.title`
          )
          .all() as SummaryRow[]);
    res.json(withVersions(db, rows));
  });

  router.post("/", (req, res) => {
    const errors = validateSongTitle(req.body?.title ?? "");
    if (Object.keys(errors).length > 0) {
      throw ApiError.validation("Invalid song.", errors);
    }
    const now = new Date().toISOString();
    const info = db
      .prepare("INSERT INTO songs (title, artist, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .run(req.body.title.trim(), req.body.artist ?? "", now, now);
    const song: Song = {
      id: Number(info.lastInsertRowid),
      title: req.body.title.trim(),
      artist: req.body.artist ?? "",
      versions: [],
    };
    res.status(201).json(song);
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM songs WHERE id = ?").get(req.params.id) as SongRow | undefined;
    if (!row) throw ApiError.notFound("Song not found.");

    const versionRows = db
      .prepare("SELECT * FROM song_versions WHERE song_id = ? ORDER BY position")
      .all(req.params.id) as VersionRow[];
    const versions: SongVersion[] = versionRows.map((vr) => rowToVersion(db, vr));

    const song: Song = { id: row.id, title: row.title, artist: row.artist, versions };
    res.json(song);
  });

  router.put("/:id", (req, res) => {
    const existing = db.prepare("SELECT id FROM songs WHERE id = ?").get(req.params.id);
    if (!existing) throw ApiError.notFound("Song not found.");

    const errors = validateSongTitle(req.body?.title ?? "");
    if (Object.keys(errors).length > 0) {
      throw ApiError.validation("Invalid song.", errors);
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE songs SET title = ?, artist = ?, updated_at = ? WHERE id = ?").run(
      req.body.title.trim(),
      req.body.artist ?? "",
      now,
      req.params.id
    );
    const row = db.prepare("SELECT * FROM songs WHERE id = ?").get(req.params.id) as SongRow;
    const versionCount = (
      db.prepare("SELECT COUNT(*) as c FROM song_versions WHERE song_id = ?").get(req.params.id) as {
        c: number;
      }
    ).c;
    const [summary] = withVersions(db, [
      { id: row.id, title: row.title, artist: row.artist, versionCount },
    ]);
    res.json(summary);
  });

  router.delete("/:id", (req, res) => {
    const existing = db.prepare("SELECT id FROM songs WHERE id = ?").get(req.params.id);
    if (!existing) throw ApiError.notFound("Song not found.");
    db.prepare("DELETE FROM songs WHERE id = ?").run(req.params.id); // cascades to versions and their chord links
    res.status(204).end();
  });

  return router;
}
