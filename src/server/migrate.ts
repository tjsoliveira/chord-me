import type Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Two directories up from src/server/migrate.ts (or dist-server/server/migrate.js)
// lands at the repository root either way.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

export function runMigrations(db: Database.Database, migrationsDir: string = MIGRATIONS_DIR): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`
  );

  const applied = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((row: any) => row.version as string)
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    const run = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
        file,
        new Date().toISOString()
      );
    });
    run();
  }
}
