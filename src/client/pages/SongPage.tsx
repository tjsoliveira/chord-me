import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useDocumentTitle } from "../useDocumentTitle.js";
import type { Song } from "../../shared/types.js";

type Confirming = { kind: "song" } | { kind: "version"; id: number } | null;

export function SongPage() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [confirming, setConfirming] = useState<Confirming>(null);

  useDocumentTitle(song ? `${song.title} · chord-me` : null);

  function load() {
    api.getSong(Number(songId)).then((s) => {
      setSong(s);
      setTitle(s.title);
      setArtist(s.artist);
    });
  }

  useEffect(load, [songId]);

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!song) return;
    await api.updateSong(song.id, title.trim(), artist.trim());
    load();
  }

  async function addVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!song || !newLabel.trim()) return;
    const version = await api.createVersion(song.id, { label: newLabel.trim() });
    navigate(`/versions/${version.id}`);
  }

  async function deleteVersion(id: number) {
    await api.deleteVersion(id);
    setConfirming(null);
    load();
  }

  async function deleteSong() {
    if (!song) return;
    await api.deleteSong(song.id);
    navigate("/");
  }

  if (!song) return <div className="page chrome">Carregando…</div>;

  const versions = song.versions.slice().sort((a, b) => a.position - b.position);

  return (
    <div className="page chrome">
      <Link to="/" className="backlink">
        ← Músicas
      </Link>

      <form onSubmit={saveMeta}>
        <div className="row row--controls" style={{ marginBottom: 24 }}>
          <div className="field" style={{ flex: 2, minWidth: 180 }}>
            <label htmlFor="song-title">Título</label>
            <input
              id="song-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label htmlFor="song-artist">Artista</label>
            <input id="song-artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
          </div>
          <button type="submit">Salvar</button>
          {confirming?.kind === "song" ? (
            <span className="confirm">
              Excluir com todas as versões?
              <button type="button" className="danger-solid" onClick={deleteSong}>
                Confirmar
              </button>
              <button type="button" className="ghost" onClick={() => setConfirming(null)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="danger"
              onClick={() => setConfirming({ kind: "song" })}
            >
              Excluir música
            </button>
          )}
        </div>
      </form>

      <div className="page-head">
        <h2 className="page-title" style={{ fontSize: "1.125rem" }}>
          Versões
        </h2>
        <span className="page-count">
          {versions.length} {versions.length === 1 ? "versão" : "versões"}
        </span>
      </div>

      {versions.length > 0 && (
        <ul className="rowlist">
          {versions.map((v) => (
            <li key={v.id} className="rowitem">
              <Link to={`/versions/${v.id}`} className="rowitem-link">
                <div className="rowitem-name">
                  {song.title} - {v.label}
                </div>
                <div className="rowitem-meta">
                  {v.songKey ? `Tom ${v.songKey}` : "sem tom"}
                  {v.capo ? ` · capo ${v.capo}ª` : ""}
                  {v.chordIds.length > 0 ? ` · ${v.chordIds.length} diagramas` : ""}
                </div>
              </Link>
              <div className="rowitem-actions">
                {confirming?.kind === "version" && confirming.id === v.id ? (
                  <span className="confirm">
                    Excluir versão?
                    <button
                      type="button"
                      className="danger-solid"
                      onClick={() => deleteVersion(v.id)}
                    >
                      Confirmar
                    </button>
                    <button type="button" className="ghost" onClick={() => setConfirming(null)}>
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setConfirming({ kind: "version", id: v.id })}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {versions.length === 0 && (
        <div className="empty">
          <div className="empty-title">Nenhuma versão ainda</div>
          <p className="empty-hint">
            Uma versão guarda a cifra, o tom, o capotraste e a formatação de impressão. Crie
            várias para a mesma música quando quiser tons ou arranjos diferentes.
          </p>
        </div>
      )}

      <form className="createbar" onSubmit={addVersion}>
        <div className="field">
          <label htmlFor="new-version">Rótulo da versão</label>
          <input
            id="new-version"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Tom D, ao vivo, violão…"
            required
          />
        </div>
        <button type="submit" disabled={!newLabel.trim()}>
          Adicionar versão
        </button>
      </form>
    </div>
  );
}
