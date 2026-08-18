import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api.js";
import { ChordPicker } from "../components/ChordPicker.js";
import { FormattingControls } from "../components/FormattingControls.js";
import { Sheet } from "../components/Sheet.js";
import { useDocumentTitle } from "../useDocumentTitle.js";
import type { Chord, FormattingSettings, Song, SongVersionWithChords } from "../../shared/types.js";

export function VersionPage() {
  const { versionId } = useParams();
  const [version, setVersion] = useState<SongVersionWithChords | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [allChords, setAllChords] = useState<Chord[]>([]);

  const [label, setLabel] = useState("");
  const [sheetText, setSheetText] = useState("");
  const [songKey, setSongKey] = useState("");
  const [capo, setCapo] = useState("");
  const [chordIds, setChordIds] = useState<number[]>([]);
  const [formatting, setFormatting] = useState<FormattingSettings | null>(null);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reads the live label, so the tab follows along while the field is edited.
  useDocumentTitle(song ? `${song.title} - ${label}` : null);

  useEffect(() => {
    api.listChords().then(setAllChords);
  }, []);

  useEffect(() => {
    api.getVersion(Number(versionId)).then((v) => {
      setVersion(v);
      setLabel(v.label);
      setSheetText(v.sheetText);
      setSongKey(v.songKey ?? "");
      setCapo(v.capo != null ? String(v.capo) : "");
      setChordIds(v.chordIds);
      setFormatting(v.formatting);
      setDirty(false);
      api.getSong(v.songId).then(setSong);
    });
  }, [versionId]);

  // One helper per field so every edit marks the version dirty; the status
  // line and the save button both read that single flag.
  function edited<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  const save = useCallback(async () => {
    if (!version || !formatting || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateVersion(version.id, {
        label,
        sheetText,
        songKey: songKey.trim() || null,
        capo: capo.trim() ? Number(capo) : null,
        chordIds,
        formatting,
      });
      setVersion(updated);
      setDirty(false);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }, [version, formatting, saving, label, sheetText, songKey, capo, chordIds]);

  // Cmd/Ctrl+S saves without leaving the keyboard, which is where this
  // workflow lives.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!version || !song || !formatting) {
    return <div className="page chrome">Carregando…</div>;
  }

  const selectedChords = chordIds
    .map((id) => allChords.find((c) => c.id === id))
    .filter((c): c is Chord => !!c);
  const capoNum = capo.trim() ? Number(capo) : null;
  const lineCount = sheetText === "" ? 0 : sheetText.split("\n").length;

  return (
    <div className="workspace">
      <div className="toolbar chrome">
        <div className="toolbar-line toolbar-line--primary">
          <Link to={`/songs/${song.id}`} className="backlink" style={{ margin: 0 }}>
            ← voltar
          </Link>
          <span className="toolbar-title">
            {song.title} - {label}
          </span>

          <div className="inline-field">
            <label htmlFor="v-label">Versão</label>
            <input
              id="v-label"
              value={label}
              onChange={(e) => edited(setLabel)(e.target.value)}
              size={14}
            />
          </div>
          <div className="inline-field">
            <label htmlFor="v-key">Tom</label>
            <input
              id="v-key"
              value={songKey}
              onChange={(e) => edited(setSongKey)(e.target.value)}
              size={4}
            />
          </div>
          <div className="inline-field">
            <label htmlFor="v-capo">Capo</label>
            <input
              id="v-capo"
              value={capo}
              onChange={(e) => edited(setCapo)(e.target.value.replace(/\D/g, ""))}
              size={3}
              placeholder="—"
            />
          </div>

          <div className="toolbar-spacer" />

          {error && <span className="field-error">{error}</span>}
          <button type="button" onClick={save} disabled={saving || !dirty}>
            {saving ? "Salvando…" : dirty ? "Salvar" : "Salvo"}
          </button>
          <button type="button" className="secondary" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>

        <div className="toolbar-line">
          <div className="toolbar-group">
            <FormattingControls value={formatting} onChange={edited(setFormatting)} />
          </div>
        </div>

        <div className="toolbar-line">
          <span className="toolbar-label">Acordes</span>
          <ChordPicker
            allChords={allChords}
            selectedIds={chordIds}
            onChange={edited(setChordIds)}
          />
        </div>
      </div>

      <div className="panes">
        <div className="editor-pane chrome">
          <label htmlFor="sheet-text" className="sr-only">
            Texto da cifra
          </label>
          <textarea
            id="sheet-text"
            className="editor-input"
            value={sheetText}
            onChange={(e) => edited(setSheetText)(e.target.value)}
            spellCheck={false}
            placeholder="Cole a cifra aqui — linhas de acorde acima das linhas de letra."
          />
          <div className="editor-status">
            <span>{lineCount} linhas</span>
            <span>{selectedChords.length} acordes</span>
            <span style={{ marginLeft: "auto" }}>
              {dirty ? "não salvo · ⌘S" : "salvo"}
            </span>
          </div>
        </div>

        <div className="paper-pane">
          <Sheet
            title={song.title}
            artist={song.artist}
            songKey={songKey.trim() || null}
            capo={capoNum}
            chords={selectedChords}
            sheetText={sheetText}
            formatting={formatting}
          />
        </div>
      </div>
    </div>
  );
}
