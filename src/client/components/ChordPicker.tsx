import { formatFretsCanonical } from "../../shared/frets.js";
import type { Chord } from "../../shared/types.js";

interface Props {
  allChords: Chord[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Compact chip strip for the toolbar. Order matters: it is the order the
 * diagrams print in, so reordering stays a first-class action.
 *
 * Chips show the fret pattern next to the name because two catalog entries may
 * share a name with different voicings, and the name alone cannot tell them
 * apart.
 */
export function ChordPicker({ allChords, selectedIds, onChange }: Props) {
  const byId = new Map(allChords.map((c) => [c.id, c]));
  const selected = selectedIds.map((id) => byId.get(id)).filter((c): c is Chord => !!c);
  const available = allChords.filter((c) => !selectedIds.includes(c.id));

  function remove(id: number) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...selectedIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="chipstrip">
      {selected.map((c, i) => (
        <span key={c.id} className="chip">
          <span className="chip-name">{c.name}</span>
          <span className="chip-frets">{formatFretsCanonical(c.frets)}</span>
          <button
            type="button"
            onClick={() => move(i, -1)}
            disabled={i === 0}
            title="Mover para a esquerda"
            aria-label={`Mover ${c.name} para a esquerda`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => move(i, 1)}
            disabled={i === selected.length - 1}
            title="Mover para a direita"
            aria-label={`Mover ${c.name} para a direita`}
          >
            →
          </button>
          <button
            type="button"
            onClick={() => remove(c.id)}
            title="Remover da folha"
            aria-label={`Remover ${c.name}`}
          >
            ×
          </button>
        </span>
      ))}

      {selected.length === 0 && <span className="hint">nenhum diagrama na folha</span>}

      <div className="inline-field">
        <label htmlFor="chord-add" className="sr-only">
          Adicionar diagrama
        </label>
        <select
          id="chord-add"
          value=""
          onChange={(e) => e.target.value && onChange([...selectedIds, Number(e.target.value)])}
          disabled={available.length === 0}
        >
          <option value="">+ adicionar</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {formatFretsCanonical(c.frets)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
