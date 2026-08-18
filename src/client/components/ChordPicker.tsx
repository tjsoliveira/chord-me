import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { filterChords } from "../../shared/chordSearch.js";
import type { Chord } from "../../shared/types.js";
import { ChordDiagram } from "./ChordDiagram.js";

interface Props {
  allChords: Chord[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

/* Four 80px cells plus the grid's gaps and padding. Only used to decide which
   edge the panel hangs from - the CSS owns the real width and clamps it to the
   viewport. */
const PANEL_WIDTH = 384;

function isPrintable(e: React.KeyboardEvent) {
  return e.key.length === 1 && e.key !== " " && !e.metaKey && !e.ctrlKey && !e.altKey;
}

/**
 * Counts the cells sharing the first cell's offsetTop. Measured instead of
 * declared: the grid is auto-fill, so the column count is whatever the panel's
 * width produced, and a constant here would drift from the CSS.
 */
function columnsOf(grid: HTMLElement) {
  const cells = [...grid.children] as HTMLElement[];
  if (cells.length === 0) return 1;
  const top = cells[0].offsetTop;
  const wrapAt = cells.findIndex((el) => el.offsetTop > top);
  return wrapAt === -1 ? cells.length : wrapAt;
}

/**
 * Compact chip strip for the toolbar. Order matters: it is the order the
 * diagrams print in, so reordering stays a first-class action.
 *
 * Adding happens in a popover anchored to the button, not inline: the picker is
 * a grid of the actual shapes, which is how a player recognises a chord, and
 * the whole catalog of them has no business living in the toolbar strip.
 *
 * The grid shows the whole catalog and marks what is already on the sheet, so
 * clicking a cell toggles. Nothing is removed from the grid on a pick, which is
 * what keeps the cells from shifting under the pointer mid-session.
 */
export function ChordPicker({ allChords, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cellIndex, setCellIndex] = useState(0);
  const [alignRight, setAlignRight] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const byId = new Map(allChords.map((c) => [c.id, c]));
  const selected = selectedIds.map((id) => byId.get(id)).filter((c): c is Chord => !!c);
  const matches = filterChords(allChords, query);

  // Clamped here rather than synced in an effect: the match list shrinks under
  // the roving tabindex on every keystroke, and a stale index would leave no
  // cell reachable by Tab for a frame.
  const cellIdx = matches.length === 0 ? -1 : Math.min(cellIndex, matches.length - 1);

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

  function toggle(chord: Chord) {
    if (selectedIds.includes(chord.id)) remove(chord.id);
    else onChange([...selectedIds, chord.id]);
  }

  function openPanel() {
    setQuery("");
    setCellIndex(0);
    setOpen(true);
  }

  function closePanel(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  /* Which corner the panel hangs from. One measurement, one boolean, no
     positioning library - but re-measured on every chip change, not once on
     open: adding a chord widens the strip and pushes the trigger right, so a
     panel that fitted when it opened can stop fitting while it is still open.
     Layout effect, so the corner is decided before the panel is painted. */
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const width = panelRef.current?.offsetWidth ?? PANEL_WIDTH;
      setAlignRight(trigger.getBoundingClientRect().left + width > window.innerWidth - 8);
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function focusCell(index: number) {
    if (matches.length === 0) return;
    const clamped = Math.max(0, Math.min(index, matches.length - 1));
    setCellIndex(clamped);
    const cell = gridRef.current?.children[clamped] as HTMLElement | undefined;
    cell?.focus();
    cell?.scrollIntoView({ block: "nearest" });
  }

  // The search field claims three keys. Left and Right are left alone: in a
  // text field they belong to the caret.
  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // The first match that is not on the sheet yet, so a second Enter on the
      // same query cannot undo the first one. Removing stays a deliberate
      // click, on the cell or on the chip.
      const target = matches.find((c) => !selectedIds.includes(c.id));
      if (!target) return;
      onChange([...selectedIds, target.id]);
      setQuery("");
      setCellIndex(0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePanel(true);
    }
  }

  function onGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const cols = gridRef.current ? columnsOf(gridRef.current) : 1;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCell(cellIdx + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCell(cellIdx - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(cellIdx + cols);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // From the top row the cursor goes back to the search field: it is the
      // way out upward, and it is where typing continues anyway.
      if (cellIdx - cols < 0) searchRef.current?.focus();
      else focusCell(cellIdx - cols);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePanel(true);
    } else if (isPrintable(e)) {
      // Typing anywhere in the panel belongs to the search field, and the
      // character must survive the trip: focus moves first, then the state
      // changes, so the field never re-renders without it.
      e.preventDefault();
      searchRef.current?.focus();
      setQuery(query + e.key);
      setCellIndex(0);
    }
  }

  return (
    <div className="chipstrip">
      {selected.map((c, i) => (
        <span key={c.id} className="chip">
          <span className="chip-name">{c.name}</span>
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

      {selected.length === 0 && <span className="hint">nenhum acorde na folha</span>}

      <div
        className="chordpop"
        ref={rootRef}
        onBlur={(e) => {
          // Tab out of the panel closes it. relatedTarget is null when focus
          // leaves for something unfocusable, which is also a leave.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <button
          type="button"
          className="chordpop-trigger"
          ref={triggerRef}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => (open ? closePanel(false) : openPanel())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              openPanel();
            }
          }}
        >
          + acordes
        </button>

        {open && (
          <div
            className={alignRight ? "chordpop-panel chordpop-panel--right" : "chordpop-panel"}
            ref={panelRef}
            role="dialog"
            aria-label="Adicionar acordes"
            /* Keeping focus put is what lets a cell click land before any blur
               closes the panel, and lets the grid's scrollbar be dragged. The
               search field is exempt, or its caret could not be placed. */
            onMouseDown={(e) => {
              if (e.target !== searchRef.current) e.preventDefault();
            }}
          >
            <label htmlFor="chord-pop-search" className="sr-only">
              Buscar acorde
            </label>
            <input
              id="chord-pop-search"
              className="chordpop-search"
              type="text"
              value={query}
              placeholder="buscar por nome"
              autoComplete="off"
              spellCheck={false}
              ref={searchRef}
              onChange={(e) => {
                setQuery(e.target.value);
                setCellIndex(0);
              }}
              onKeyDown={onSearchKeyDown}
            />

            {matches.length > 0 ? (
              <div className="chordpop-grid" ref={gridRef} onKeyDown={onGridKeyDown}>
                {matches.map((c, i) => {
                  const onSheet = selectedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="chordpop-cell"
                      aria-pressed={onSheet}
                      aria-label={
                        onSheet ? `Remover ${c.name} da folha` : `Adicionar ${c.name} à folha`
                      }
                      tabIndex={i === cellIdx ? 0 : -1}
                      onFocus={() => setCellIndex(i)}
                      onClick={() => {
                        setCellIndex(i);
                        toggle(c);
                      }}
                    >
                      {/* capo={null}: the popover is a catalog view, and a capo
                          bar on every cell would give the rows of a dense grid
                          different heights. The capo lands on the paper. */}
                      <ChordDiagram chord={c} capo={null} />
                      {onSheet && (
                        <span className="chordpop-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="chordpop-empty" role="status">
                nenhum acorde encontrado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
