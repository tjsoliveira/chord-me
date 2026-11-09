import { useState, type ChangeEvent, type FormEvent } from "react";
import { isChordLine } from "../../shared/parseSheet.js";
import { replaceChord } from "../../shared/replaceChord.js";

interface Props {
  sheetText: string;
  onReplace: (next: string) => void;
}

/**
 * Swaps one chord for another across the whole sheet. The result goes
 * through the editor like any edit, so it is unsaved until the user saves.
 * It lives in a popup opened on demand, so it takes focus on arrival.
 */
export function ReplaceChordForm({ sheetText, onReplace }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [feedback, setFeedback] = useState<{
    text: string;
    kind: "done" | "absent" | "invalid";
  } | null>(null);

  const oldName = from.trim();
  const newName = to.trim();
  const ready = oldName !== "" && newName !== "" && oldName !== newName;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;

    // A name the parser does not read as a chord would turn its line into
    // lyrics on the sheet.
    if (/\s/.test(newName) || !isChordLine(newName)) {
      setFeedback({ text: `"${newName}" não é um nome de acorde.`, kind: "invalid" });
      return;
    }

    const result = replaceChord(sheetText, oldName, newName);
    if (result.count === 0) {
      setFeedback({ text: `Nenhum ${oldName} na cifra.`, kind: "absent" });
      return;
    }

    onReplace(result.text);
    setFeedback({
      text: result.count === 1 ? "1 troca" : `${result.count} trocas`,
      kind: "done",
    });
  }

  function typed(setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setFeedback(null);
    };
  }

  return (
    <form className="advanced-form" onSubmit={submit}>
      <span className="toolbar-label">Substituir acorde</span>

      <div className="advanced-form-row">
        <div className="inline-field">
          <label htmlFor="rc-from">Trocar</label>
          <input
            id="rc-from"
            autoFocus
            value={from}
            onChange={typed(setFrom)}
            size={6}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />
        </div>
        <div className="inline-field">
          <label htmlFor="rc-to">por</label>
          <input
            id="rc-to"
            value={to}
            onChange={typed(setTo)}
            size={6}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-invalid={feedback?.kind === "invalid" || undefined}
          />
        </div>
      </div>

      <div className="advanced-form-row">
        <button type="submit" className="secondary" disabled={!ready}>
          Trocar em tudo
        </button>
        {feedback && (
          <span className={feedback.kind === "done" ? "hint" : "field-error"} role="status">
            {feedback.text}
          </span>
        )}
      </div>
    </form>
  );
}
