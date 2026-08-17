import type {
  ApiErrorBody,
  Chord,
  ChordUsage,
  Song,
  SongSummary,
  SongVersionWithChords,
} from "../shared/types.js";

export class ApiClientError extends Error {
  code: string;
  fields?: Record<string, string>;
  usages?: ChordUsage[];

  constructor(body: ApiErrorBody) {
    super(body.error.message);
    this.code = body.error.code;
    this.fields = body.error.fields;
    this.usages = body.error.usages;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  if (!res.ok) {
    throw new ApiClientError(body as ApiErrorBody);
  }
  return body as T;
}

export const api = {
  // Songs
  listSongs: (q?: string) => request<SongSummary[]>(`/songs${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createSong: (title: string, artist: string) =>
    request<Song>("/songs", { method: "POST", body: JSON.stringify({ title, artist }) }),
  getSong: (id: number) => request<Song>(`/songs/${id}`),
  updateSong: (id: number, title: string, artist: string) =>
    request<SongSummary>(`/songs/${id}`, { method: "PUT", body: JSON.stringify({ title, artist }) }),
  deleteSong: (id: number) => request<void>(`/songs/${id}`, { method: "DELETE" }),

  // Versions
  createVersion: (
    songId: number,
    // The server already accepts and validates these; only the client type
    // was narrow, which made them unreachable from the UI.
    data: { label: string; songKey?: string | null; capo?: number | null }
  ) =>
    request<SongVersionWithChords>(`/songs/${songId}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getVersion: (id: number) => request<SongVersionWithChords>(`/versions/${id}`),
  updateVersion: (id: number, data: Record<string, unknown>) =>
    request<SongVersionWithChords>(`/versions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVersion: (id: number) => request<void>(`/versions/${id}`, { method: "DELETE" }),

  // Chords
  listChords: (q?: string) => request<Chord[]>(`/chords${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createChord: (data: { name: string; frets: string; fingers?: string; caption?: string }) =>
    request<Chord>("/chords", { method: "POST", body: JSON.stringify(data) }),
  getChord: (id: number) => request<Chord>(`/chords/${id}`),
  updateChord: (id: number, data: { name: string; frets: string; fingers?: string; caption?: string }) =>
    request<Chord>(`/chords/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChord: (id: number) => request<void>(`/chords/${id}`, { method: "DELETE" }),
  chordUsages: (id: number) => request<ChordUsage[]>(`/chords/${id}/usages`),
};
