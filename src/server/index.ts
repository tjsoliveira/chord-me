import express from "express";
import type { NextFunction, Request, Response } from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ApiErrorBody } from "../shared/types.js";
import { openDb } from "./db.js";
import { ApiError } from "./errors.js";
import { runMigrations } from "./migrate.js";
import { chordsRouter } from "./routes/chords.js";
import { songsRouter } from "./routes/songs.js";
import { versionsRouter } from "./routes/versions.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_PATH = join(REPO_ROOT, "data", "chord-me.db");
const PORT = 3001;
const HOST = "127.0.0.1";

export const db = openDb(DB_PATH);
runMigrations(db); // includes the starter chord catalog seed (migrations/002)

const app = express();
app.use(express.json());

app.use("/api/chords", chordsRouter(db));
app.use("/api/songs", songsRouter(db));
app.use("/api", versionsRouter(db));

const distDir = join(REPO_ROOT, "dist");
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

// Error middleware must have 4 params for Express to recognise it as such.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, fields: err.fields, usages: err.usages },
    };
    res.status(err.status).json(body);
    return;
  }
  console.error(err);
  const body: ApiErrorBody = {
    error: { code: "INTERNAL", message: "Unexpected server error." },
  };
  res.status(500).json(body);
});

app.listen(PORT, HOST, () => {
  console.log(`chord-me API listening on http://${HOST}:${PORT}`);
});
