import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api.js";
import { parseFretsInput } from "../../shared/frets.js";
import type { Chord, ChordUsage } from "../../shared/types.js";
import { ChordDiagram } from "../components/ChordDiagram.js";
import { useDocumentTitle } from "../useDocumentTitle.js";

const emptyForm = { id: null as number | null, name: "", frets: "", fingers: "", caption: "" };

export function ChordsPage() {
  useDocumentTitle("Acordes · chord-me");
  const [chords, setChords] = useState<Chord[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<{ name: string; usages: ChordUsage[] } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  function load(q = "") {
    api.listChords(q || undefined).then(setChords);
  }

  useEffect(() => {
    const t = setTimeout(() => load(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  function edit(c: Chord) {
    setForm({
      id: c.id,
      name: c.name,
      frets: c.frets.join(" "),
      fingers: c.fingers ?? "",
      caption: c.caption ?? "",
    });
    setFieldErrors({});
    setBlocked(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const payload = {
      name: form.name.trim(),
      frets: form.frets.trim(),
      fingers: form.fingers.trim() || undefined,
      caption: form.caption.trim() || undefined,
    };
    try {
      if (form.id != null) {
        await api.updateChord(form.id, payload);
      } else {
        await api.createChord(payload);
      }
      setForm(emptyForm);
      load(query);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setFieldErrors(err.fields);
    }
  }

  async function remove(c: Chord) {
    setBlocked(null);
    try {
      await api.deleteChord(c.id);
      setConfirmingId(null);
      load(query);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "CHORD_IN_USE") {
        setConfirmingId(null);
        setBlocked({ name: c.name, usages: err.usages ?? [] });
      }
    }
  }

  const parsed = parseFretsInput(form.frets || "x x x x x x");
  const preview: Chord | null = parsed.ok
    ? {
        id: -1,
        name: form.name || "?",
        frets: parsed.frets,
        fingers: form.fingers || null,
        caption: form.caption || null,
      }
    : null;

  return (
    <div className="catalog chrome">
      <div className="catalog-main">
        <div className="page-head">
          <h1 className="page-title">Acordes</h1>
          <span className="page-count">
            {chords.length} {chords.length === 1 ? "forma" : "formas"}
          </span>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="chord-search">Buscar</label>
          <input
            id="chord-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do acorde"
          />
        </div>

        {blocked && (
          <div className="empty" style={{ borderStyle: "solid", textAlign: "left" }}>
            <div className="empty-title">
              "{blocked.name}" está em uso e não pode ser excluído
            </div>
            <ul className="empty-hint" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {blocked.usages.map((u) => (
                <li key={u.versionId}>
                  <Link to={`/versions/${u.versionId}`}>
                    {u.songTitle} — {u.versionLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {chords.length > 0 && (
          <div className="chordgrid">
            {chords.map((c) => (
              <div key={c.id} className="chordcell">
                <ChordDiagram chord={c} capo={null} />
                <div className="chordcell-actions">
                  {confirmingId === c.id ? (
                    <>
                      <button type="button" onClick={() => remove(c)}>
                        Excluir?
                      </button>
                      <button type="button" onClick={() => setConfirmingId(null)}>
                        Não
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => edit(c)} aria-label={`Editar ${c.name}`}>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(c.id)}
                        aria-label={`Excluir ${c.name}`}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {chords.length === 0 && (
          <div className="empty">
            <div className="empty-title">
              {query ? `Nenhum acorde com "${query}"` : "Catálogo vazio"}
            </div>
            <p className="empty-hint">
              Formas cadastradas aqui ficam disponíveis para qualquer versão de qualquer música.
            </p>
          </div>
        )}
      </div>

      {/* Sticky beside the grid, not below it: describing a shape and comparing
          it against the stored ones is one task, so both stay on screen. */}
      <form className="catalog-panel" onSubmit={submit}>
        <h2 className="catalog-panel-title">
          {form.id != null ? `Editando ${form.name || "acorde"}` : "Criação de acorde"}
        </h2>

        <div className="field">
          <label htmlFor="chord-name">Nome</label>
          <input
            id="chord-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="chord-frets">Casas</label>
          <input
            id="chord-frets"
            value={form.frets}
            onChange={(e) => setForm({ ...form, frets: e.target.value })}
            placeholder="x02220 ou x 0 2 2 2 0"
            aria-invalid={!!fieldErrors.frets}
          />
          {fieldErrors.frets && <span className="field-error">{fieldErrors.frets}</span>}
        </div>
        <div className="field">
          <label htmlFor="chord-fingers">Dedos</label>
          <input
            id="chord-fingers"
            value={form.fingers}
            onChange={(e) => setForm({ ...form, fingers: e.target.value })}
            placeholder="__123_"
            aria-invalid={!!fieldErrors.fingers}
          />
          {fieldErrors.fingers && <span className="field-error">{fieldErrors.fingers}</span>}
        </div>
        <div className="field">
          <label htmlFor="chord-caption">Legenda</label>
          <input
            id="chord-caption"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
        </div>

        {preview && (
          <div className="field">
            <label>Prévia</label>
            <div className="chord-preview" style={{ alignSelf: "center" }}>
              <ChordDiagram chord={preview} capo={null} />
            </div>
          </div>
        )}

        <div className="row">
          <button type="submit" style={{ flex: 1 }}>
            {form.id != null ? "Salvar acorde" : "Criar acorde"}
          </button>
          {form.id != null && (
            <button type="button" className="secondary" onClick={() => setForm(emptyForm)}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
