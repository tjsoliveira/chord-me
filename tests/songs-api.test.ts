import Database from "better-sqlite3";
import express from "express";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../src/server/migrate.js";
import { songsRouter } from "../src/server/routes/songs.js";
import type { SongSummary } from "../src/shared/types.js";

/**
 * Covers the summary response shape rather than the UI that reads it: the
 * library needs each version's key and capo (FR-014), and VersionRef exists
 * to keep sheetText out of this payload. Both are silent failures — a missing
 * capo just looks like an unset one, and a leaked sheetText is invisible until
 * the library is slow.
 *
 * Uses a bare Express instance over an ephemeral port instead of a request
 * helper, so no dependency is added for one test (Constitution Principle III).
 */

let dir: string;
let db: Database.Database;
let server: Server;
let baseUrl: string;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "chord-me-songs-api-"));
  db = new Database(join(dir, "test.db"));
  db.pragma("foreign_keys = ON");
  runMigrations(db);

  const app = express();
  app.use(express.json());
  app.use("/api/songs", songsRouter(db));

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

function insertSong(title: string, artist: string): number {
  const now = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO songs (title, artist, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .run(title, artist, now, now);
  return Number(info.lastInsertRowid);
}

function insertVersion(
  songId: number,
  label: string,
  position: number,
  songKey: string | null,
  capo: number | null,
  sheetText = ""
): number {
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO song_versions
       (song_id, label, position, sheet_text, song_key, capo,
        fmt_columns, fmt_body_size, fmt_line_height, fmt_margin_mm, fmt_top_extra_mm,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 3, 8.5, 1.3, 18, 12, ?, ?)`
    )
    .run(songId, label, position, sheetText, songKey, capo, now, now);
  return Number(info.lastInsertRowid);
}

async function listSongs(): Promise<SongSummary[]> {
  const res = await fetch(`${baseUrl}/api/songs`);
  expect(res.status).toBe(200);
  return (await res.json()) as SongSummary[];
}

describe("GET /api/songs version refs", () => {
  it("carries each version's key and capo", async () => {
    const songId = insertSong("Isaías 9", "Rodolfo Abrantes");
    insertVersion(songId, "Original", 0, "G", 2);
    insertVersion(songId, "Acústico", 1, "E", null);

    const [song] = await listSongs();
    expect(song.versions).toEqual([
      { id: expect.any(Number), label: "Original", songKey: "G", capo: 2 },
      { id: expect.any(Number), label: "Acústico", songKey: "E", capo: null },
    ]);
  });

  it("represents 'no capo' as null, the only encoding the schema allows", async () => {
    // migrations/001: CHECK (capo IS NULL OR (capo >= 1 AND capo <= 12)).
    // Capo 0 is not a distinct state — it is the absence of a capo — so the
    // mockup's "Capo 0" label describes something the domain cannot store.
    const songId = insertSong("Ousado Amor", "");
    insertVersion(songId, "sem capo", 0, "D", null);
    insertVersion(songId, "com capo", 1, "D", 1);

    const [song] = await listSongs();
    expect(song.versions[0].capo).toBeNull();
    expect(song.versions[1].capo).toBe(1);

    expect(() => insertVersion(songId, "capo zero", 2, "D", 0)).toThrow(/CHECK constraint/);
  });

  it("reports an unset key as null rather than an empty string", async () => {
    const songId = insertSong("Caminho no Deserto", "Diante do Trono");
    insertVersion(songId, "rascunho", 0, null, null);

    const [song] = await listSongs();
    expect(song.versions[0].songKey).toBeNull();
  });

  it("never includes sheetText in a summary response", async () => {
    const songId = insertSong("Isaías 9", "Rodolfo Abrantes");
    insertVersion(songId, "Original", 0, "G", 2, "[Intro]\nG  D  Em  C\n");

    const body = await listSongs();
    expect(JSON.stringify(body)).not.toContain("[Intro]");
    for (const v of body[0].versions) {
      expect(v).not.toHaveProperty("sheetText");
    }
  });

  it("returns versions ordered by position, and an empty array when there are none", async () => {
    const withVersions = insertSong("Com versões", "");
    insertVersion(withVersions, "segunda", 1, "A", null);
    insertVersion(withVersions, "primeira", 0, "B", null);
    insertSong("Sem versões", "");

    const songs = await listSongs();
    const a = songs.find((s) => s.title === "Com versões")!;
    const b = songs.find((s) => s.title === "Sem versões")!;
    expect(a.versions.map((v) => v.label)).toEqual(["primeira", "segunda"]);
    expect(b.versions).toEqual([]);
  });
});
