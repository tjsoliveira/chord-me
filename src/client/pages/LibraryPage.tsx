import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useDocumentTitle } from "../useDocumentTitle.js";
import type { SongSummary } from "../../shared/types.js";

export function LibraryPage() {
  useDocumentTitle("chord-me");

  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const navigate = useNavigate();

  function load(q: string) {
    api.listSongs(q || undefined).then(setSongs);
  }

  useEffect(() => {
    const t = setTimeout(() => load(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  async function createSong(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const song = await api.createSong(title.trim(), artist.trim());
    setTitle("");
    setArtist("");
    navigate(`/songs/${song.id}`);
  }

  async function deleteSong(id: number) {
    await api.deleteSong(id);
    setConfirmingId(null);
    load(query);
  }

  const searching = query.trim().length > 0;

  return (
    <div className="page chrome">
      <div className="page-head">
        <h1 className="page-title">Músicas</h1>
        <span className="page-count">
          {songs.length} {songs.length === 1 ? "música" : "músicas"}
        </span>
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <label htmlFor="song-search">Buscar</label>
        <input
          id="song-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título ou artista"
        />
      </div>

      {songs.length > 0 && (
        <ul className="rowlist">
          {songs.map((s) => (
            <li key={s.id}>
              <div className={`rowitem${s.versions.length > 0 ? " rowitem--grouped" : ""}`}>
                <Link to={`/songs/${s.id}`} className="rowitem-link">
                  <div className="rowitem-name">{s.title}</div>
                  <div className="rowitem-meta">
                    {s.artist || "sem artista"} · {s.versionCount}{" "}
                    {s.versionCount === 1 ? "versão" : "versões"}
                  </div>
                </Link>
                <div className="rowitem-actions">
                  {confirmingId === s.id ? (
                    <span className="confirm">
                      Excluir com todas as versões?
                      <button
                        type="button"
                        className="danger-solid"
                        onClick={() => deleteSong(s.id)}
                      >
                        Confirmar
                      </button>
                      <button type="button" className="ghost" onClick={() => setConfirmingId(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="danger" onClick={() => setConfirmingId(s.id)}>
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              {s.versions.length > 0 && (
                <ul className="subrows">
                  {s.versions.map((v) => (
                    <li key={v.id} className="subrow">
                      <Link to={`/versions/${v.id}`} className="subrow-link">
                        {s.title} - {v.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {songs.length === 0 && (
        <div className="empty">
          {searching ? (
            <>
              <div className="empty-title">Nada encontrado para "{query}"</div>
              <p className="empty-hint">A busca olha título e artista.</p>
            </>
          ) : (
            <>
              <div className="empty-title">Nenhuma música ainda</div>
              <p className="empty-hint">
                Crie uma abaixo. Depois adicione uma versão, cole a cifra e a folha fica pronta
                para imprimir.
              </p>
            </>
          )}
        </div>
      )}

      <form className="createbar" onSubmit={createSong}>
        <div className="field">
          <label htmlFor="new-title">Título</label>
          <input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="new-artist">Artista</label>
          <input id="new-artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>
        <button type="submit" disabled={!title.trim()}>
          Criar música
        </button>
      </form>
    </div>
  );
}
