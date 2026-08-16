CREATE TABLE chords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (trim(name) != ''),
  frets TEXT NOT NULL,
  fingers TEXT,
  caption TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_chords_name ON chords(name);

CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (trim(title) != ''),
  artist TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_songs_title ON songs(title);

CREATE TABLE song_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (trim(label) != ''),
  position INTEGER NOT NULL DEFAULT 0,
  sheet_text TEXT NOT NULL DEFAULT '',
  song_key TEXT,
  capo INTEGER CHECK (capo IS NULL OR (capo >= 1 AND capo <= 12)),
  fmt_columns INTEGER NOT NULL DEFAULT 3 CHECK (fmt_columns BETWEEN 1 AND 4),
  fmt_body_size REAL NOT NULL DEFAULT 8.5 CHECK (fmt_body_size BETWEEN 6 AND 16),
  fmt_line_height REAL NOT NULL DEFAULT 1.3 CHECK (fmt_line_height BETWEEN 1.0 AND 2.0),
  fmt_margin_mm INTEGER NOT NULL DEFAULT 18 CHECK (fmt_margin_mm BETWEEN 0 AND 40),
  fmt_top_extra_mm INTEGER NOT NULL DEFAULT 12 CHECK (fmt_top_extra_mm BETWEEN 0 AND 40),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_song_versions_song_id ON song_versions(song_id, position);

CREATE TABLE song_version_chords (
  song_version_id INTEGER NOT NULL REFERENCES song_versions(id) ON DELETE CASCADE,
  chord_id INTEGER NOT NULL REFERENCES chords(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  PRIMARY KEY (song_version_id, position),
  UNIQUE (song_version_id, chord_id)
);

CREATE INDEX idx_song_version_chords_chord_id ON song_version_chords(chord_id);
