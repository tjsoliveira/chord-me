import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../src/server/migrate.js";

let dir: string;
let db: Database.Database;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "chord-me-test-"));
  db = new Database(join(dir, "test.db"));
  db.pragma("foreign_keys = ON");
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("runMigrations", () => {
  it("applies cleanly to a fresh database", () => {
    runMigrations(db);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: any) => r.name);
    expect(tables).toContain("chords");
    expect(tables).toContain("songs");
    expect(tables).toContain("song_versions");
    expect(tables).toContain("song_version_chords");
    expect(tables).toContain("schema_migrations");
  });

  it("is idempotent on a second run", () => {
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();
    const count = db.prepare("SELECT COUNT(*) as c FROM schema_migrations").get() as { c: number };
    expect(count.c).toBeGreaterThan(0);
  });

  it("leaves foreign key enforcement active", () => {
    runMigrations(db);
    // song_versions.song_id references songs(id); inserting with a
    // non-existent song_id must fail once foreign_keys is ON.
    expect(() =>
      db
        .prepare(
          "INSERT INTO song_versions (song_id, label, created_at, updated_at) VALUES (999, 'x', 'now', 'now')"
        )
        .run()
    ).toThrow();
  });

  it("enforces ON DELETE RESTRICT from song_version_chords to chords", () => {
    runMigrations(db);
    const now = new Date().toISOString();
    const chordId = db
      .prepare("INSERT INTO chords (name, frets, created_at, updated_at) VALUES ('C', 'x 3 2 0 1 0', ?, ?)")
      .run(now, now).lastInsertRowid;
    const songId = db
      .prepare("INSERT INTO songs (title, artist, created_at, updated_at) VALUES ('Song', '', ?, ?)")
      .run(now, now).lastInsertRowid;
    const versionId = db
      .prepare(
        "INSERT INTO song_versions (song_id, label, created_at, updated_at) VALUES (?, 'v1', ?, ?)"
      )
      .run(songId, now, now).lastInsertRowid;
    db.prepare(
      "INSERT INTO song_version_chords (song_version_id, chord_id, position) VALUES (?, ?, 0)"
    ).run(versionId, chordId);

    expect(() => db.prepare("DELETE FROM chords WHERE id = ?").run(chordId)).toThrow();
  });

  it("round-trips a version's sheet text and formatting settings byte-identically", () => {
    runMigrations(db);
    const now = new Date().toISOString();
    const songId = db
      .prepare("INSERT INTO songs (title, artist, created_at, updated_at) VALUES ('Song', 'Artist', ?, ?)")
      .run(now, now).lastInsertRowid;

    const sheetText = "D        G\n  Ousado amor\n\n[Refrão]\ttab and trailing spaces   \nEm A";
    const versionId = db
      .prepare(
        `INSERT INTO song_versions
          (song_id, label, sheet_text, song_key, capo,
           fmt_columns, fmt_body_size, fmt_line_height, fmt_margin_mm, fmt_top_extra_mm,
           created_at, updated_at)
         VALUES (?, 'Tom D', ?, 'D', 2, 2, 10.5, 1.5, 22, 6, ?, ?)`
      )
      .run(songId, sheetText, now, now).lastInsertRowid;

    const row = db.prepare("SELECT * FROM song_versions WHERE id = ?").get(versionId) as any;
    expect(row.sheet_text).toBe(sheetText);
    expect(row.song_key).toBe("D");
    expect(row.capo).toBe(2);
    expect(row.fmt_columns).toBe(2);
    expect(row.fmt_body_size).toBe(10.5);
    expect(row.fmt_line_height).toBe(1.5);
    expect(row.fmt_margin_mm).toBe(22);
    expect(row.fmt_top_extra_mm).toBe(6);
  });

  it("leaves a song with zero versions in place after its only version is deleted", () => {
    runMigrations(db);
    const now = new Date().toISOString();
    const songId = db
      .prepare("INSERT INTO songs (title, artist, created_at, updated_at) VALUES ('Song', '', ?, ?)")
      .run(now, now).lastInsertRowid;
    const versionId = db
      .prepare("INSERT INTO song_versions (song_id, label, created_at, updated_at) VALUES (?, 'v1', ?, ?)")
      .run(songId, now, now).lastInsertRowid;

    db.prepare("DELETE FROM song_versions WHERE id = ?").run(versionId);

    const song = db.prepare("SELECT * FROM songs WHERE id = ?").get(songId);
    expect(song).toBeDefined();
    const remainingVersions = db
      .prepare("SELECT COUNT(*) as c FROM song_versions WHERE song_id = ?")
      .get(songId) as { c: number };
    expect(remainingVersions.c).toBe(0);
  });
});
