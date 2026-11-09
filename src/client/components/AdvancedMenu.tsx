import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * The toolbar's "Avançado" button and the popup it opens. Escape closes it
 * and hands focus back to the button; a click outside just closes it. The
 * contents mount fresh on every open, so they start empty each time.
 */
export function AdvancedMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // The button usually ends the toolbar's first line, but a narrow window
  // wraps it to the left edge. Hang the popup from whichever corner keeps it
  // on screen, decided before it is painted.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      setAlignRight(trigger.getBoundingClientRect().left + panel.offsetWidth > window.innerWidth - 8);
    }
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  return (
    <div
      className="chordpop"
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        type="button"
        className="ghost"
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        Avançado {open ? "▴" : "▾"}
      </button>

      {open && (
        <div
          className={`chordpop-panel advanced-panel${alignRight ? " chordpop-panel--right" : ""}`}
          ref={panelRef}
          role="dialog"
          aria-label="Ferramentas avançadas"
        >
          {children}
        </div>
      )}
    </div>
  );
}
