import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiClientError } from "../api.js";
import { useDocumentTitle } from "../useDocumentTitle.js";
import {
  filterSongs,
  hasExactTitle,
  initialOf,
  latestVersion,
  recentVersions,
  shortDate,
  sortSongs,
  versionDetails,
} from "../../shared/library.js";
import type { SongSummary } from "../../shared/types.js";

/** Roughly one service's worth of songs: what is being prepared right now. */
const RECENT_LIMIT = 5;

export function LibraryPage() {
  useDocumentTitle("chord-me");
  const navigate = useNavigate();

  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");

  const [artist, setArtist] = useState("");
  const [label, setLabel] = useState("");
  const [songKey, setSongKey] = useState("");
  const [capo, setCapo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  // While the query matches stored songs, creating is the less likely intent,
  // so the panel waits behind a one-line offer until asked for.
  const [createOpen, setCreateOpen] = useState(false);
  const artistRef = useRef<HTMLInputElement>(null);

  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  // The whole library in one fetch: one user's repertoire is small, and
  // filtering locally is what lets the field know, per keystroke, whether
  // the title already exists.
  function load() {
    api.listSongs().then((list) => {
      setSongs(sortSongs(list));
      setLoaded(true);
    });
  }

  useEffect(load, []);

  const title = query.trim();
  const searching = title !== "";
  const results = useMemo(() => filterSongs(songs, query), [songs, query]);
  // Below this many songs the recents would just repeat the whole list.
  const recents = useMemo(
    () => (songs.length > RECENT_LIMIT ? recentVersions(songs, RECENT_LIMIT) : []),
    [songs]
  );
  const canCreate = loaded && searching && !hasExactTitle(songs, query);
  const showPanel = canCreate && (results.length === 0 || createOpen);

  useEffect(() => {
    if (createOpen) artistRef.current?.focus();
  }, [createOpen]);

  function openSong(song: SongSummary) {
    const v = latestVersion(song);
    navigate(v ? `/versions/${v.id}` : `/songs/${song.id}`);
  }

  // Enter in the search field opens the top result when there is one, and
  // only creates when nothing matches. Typing part of a stored title and
  // pressing Enter must never produce a duplicate.
  function onQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    if (searching && results.length > 0) {
      e.preventDefault();
      openSong(results[0]);
    }
  }

  async function createSong(e: React.FormEvent) {
    e.preventDefault();
    if (!showPanel || creating) return;

    const capoNum = capo ? Number(capo) : null;
    if (capoNum !== null && (capoNum < 1 || capoNum > 12)) {
      setErrors({ capo: "De 1 a 12." });
      return;
    }

    setErrors({});
    setCreating(true);
    try {
      const song = await api.createSong(title, artist.trim(), {
        label: label.trim(),
        songKey: songKey.trim() || null,
        capo: capoNum,
      });
      const v = song.versions[0];
      navigate(v ? `/versions/${v.id}` : `/songs/${song.id}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else setErrors({ form: "Falha ao criar a música." });
      setCreating(false);
    }
  }

  async function deleteSong(id: number) {
    await api.deleteSong(id);
    setConfirmingId(null);
    load();
  }

  return (
    <div className="page chrome library">
      <div className="page-head">
        <h1 className="page-title">Músicas</h1>
        {loaded && (
          <span className="page-count">
            {searching
              ? `${results.length} de ${songs.length}`
              : `${songs.length} ${songs.length === 1 ? "música" : "músicas"}`}
          </span>
        )}
      </div>

      <form className={`lib-entry${canCreate ? " has-create" : ""}`} onSubmit={createSong} noValidate>
        <div className="field">
          <label htmlFor="song-query">Buscar ou criar</label>
          <input
            id="song-query"
            className="lib-query"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() === "") setCreateOpen(false);
              setConfirmingId(null);
            }}
            onKeyDown={onQueryKeyDown}
            placeholder="Título ou artista"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            aria-describedby={searching && results.length > 0 ? "song-query-enter" : undefined}
          />
          {searching && results.length > 0 && (
            <span id="song-query-enter" className="sr-only">
              Enter abre {results[0].title}
            </span>
          )}
        </div>

        {canCreate && !showPanel && (
          <div className="lib-create lib-create--offer">
            <button type="button" className="ghost lib-create-offer" onClick={() => setCreateOpen(true)}>
              Criar <span className="lib-create-title">“{title}”</span> como música nova
            </button>
          </div>
        )}

        {showPanel && (
          <div className="lib-create" role="group" aria-label={`Nova música: ${title}`}>
            <div className="field lib-create-artist">
              <label htmlFor="new-artist">Artista</label>
              <input
                id="new-artist"
                ref={artistRef}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
            <div className="field lib-create-label">
              <label htmlFor="new-label">Versão</label>
              <input
                id="new-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Principal"
                aria-invalid={!!errors.label}
              />
              {errors.label && <span className="field-error">{errors.label}</span>}
            </div>
            <div className="field lib-create-key">
              <label htmlFor="new-key">Tom</label>
              <input
                id="new-key"
                value={songKey}
                onChange={(e) => setSongKey(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="field lib-create-capo">
              <label htmlFor="new-capo">Capo</label>
              <input
                id="new-capo"
                value={capo}
                onChange={(e) => {
                  setCapo(e.target.value.replace(/\D/g, ""));
                  setErrors(({ capo: _, ...rest }) => rest);
                }}
                placeholder="—"
                inputMode="numeric"
                aria-invalid={!!errors.capo}
                aria-describedby={errors.capo ? "new-capo-error" : undefined}
              />
              {errors.capo && (
                <span id="new-capo-error" className="field-error">
                  {errors.capo}
                </span>
              )}
            </div>
            <button type="submit" className="lib-create-submit" disabled={creating}>
              {creating ? (
                "Criando…"
              ) : (
                <>
                  Criar <span className="lib-create-title">“{title}”</span>
                </>
              )}
            </button>
            {(errors.form || errors.title) && (
              <span className="field-error lib-create-error" role="alert">
                {errors.form ?? errors.title}
              </span>
            )}
          </div>
        )}
      </form>

      {!searching && recents.length > 0 && (
        <section className="lib-section" aria-labelledby="lib-recent">
          <h2 id="lib-recent" className="lib-section-head">
            Recentes
          </h2>
          <ul className="lib-list">
            {recents.map(({ song, version }) => (
              <li key={version.id}>
                <Link to={`/versions/${version.id}`} className="recent-row">
                  <span className="recent-title">{song.title}</span>
                  <span className="recent-artist">{song.artist}</span>
                  <span className="recent-version">
                    {[version.label, ...versionDetails(version)].join(" · ")}
                  </span>
                  <time className="recent-date" dateTime={version.updatedAt}>
                    {shortDate(version.updatedAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section className="lib-section" aria-labelledby="lib-all">
          <h2 id="lib-all" className={searching ? "sr-only" : "lib-section-head"}>
            {searching ? "Resultados" : "Todas"}
          </h2>
          <ul className="lib-list">
            {results.map((s, i) => {
              const letter = initialOf(s.title);
              const firstOfLetter = i === 0 || initialOf(results[i - 1].title) !== letter;
              const enterTarget = searching && i === 0;
              const confirming = confirmingId === s.id;
              return (
                <li key={s.id} className={`songrow${confirming ? " is-confirming" : ""}`}>
                  {/* The index letter while browsing; while searching, the
                      mark of the row that Enter opens. Results are ranked,
                      not alphabetical, so letters would mislead there. */}
                  <span
                    className={`songrow-gutter${enterTarget ? " is-enter" : ""}`}
                    aria-hidden="true"
                  >
                    {enterTarget ? "↵" : !searching && firstOfLetter ? letter : ""}
                  </span>
                  <Link to={`/songs/${s.id}`} className="songrow-title">
                    {s.title}
                  </Link>

                  {confirming ? (
                    <span className="confirm songrow-confirm">
                      Excluir com todas as versões?
                      <button type="button" className="danger-solid" onClick={() => deleteSong(s.id)}>
                        Confirmar
                      </button>
                      <button type="button" className="ghost" onClick={() => setConfirmingId(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <>
                      <span className="songrow-artist">{s.artist}</span>
                      <div className="songrow-versions">
                        {s.versions.length > 0 ? (
                          s.versions.map((v) => {
                            const details = versionDetails(v);
                            return (
                              <Link key={v.id} to={`/versions/${v.id}`} className="vchip">
                                <span className="vchip-label">{v.label}</span>
                                {details.length > 0 && (
                                  <span className="vchip-meta">{details.join(" · ")}</span>
                                )}
                              </Link>
                            );
                          })
                        ) : (
                          <span className="songrow-none">sem versão</span>
                        )}
                      </div>
                      <div className="songrow-actions">
                        <button
                          type="button"
                          className="danger"
                          onClick={() => setConfirmingId(s.id)}
                          aria-label={`Excluir ${s.title}`}
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {loaded && searching && results.length === 0 && (
        <p className="lib-noresult">Nenhuma música com “{title}” no título ou no artista.</p>
      )}

      {loaded && songs.length === 0 && !searching && (
        <div className="empty">
          <div className="empty-title">Nenhuma música ainda</div>
          <p className="empty-hint">
            Digite um título no campo acima para criar a primeira. Ela abre direto no editor, pronta
            para colar a cifra.
          </p>
        </div>
      )}
    </div>
  );
}
