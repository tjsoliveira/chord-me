import { DEFAULT_FORMATTING, type FormattingSettings } from "../../shared/types.js";

interface Props {
  value: FormattingSettings;
  onChange: (next: FormattingSettings) => void;
}

const COLUMNS = [1, 2, 3, 4];
const BODY_SIZE = [6, 7, 7.5, 8.5, 9.5, 10.5, 12, 14, 16];
const LINE_HEIGHT = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
const MARGIN = [0, 10, 14, 18, 22, 26, 32, 40];
const TOP_EXTRA = [0, 6, 12, 18, 24, 32, 40];

/**
 * Renders as a flat strip of compact controls for the toolbar, not a panel.
 * These live one row above the live preview so a change and its result are
 * visible at the same time.
 */
export function FormattingControls({ value, onChange }: Props) {
  function set<K extends keyof FormattingSettings>(key: K, v: FormattingSettings[K]) {
    onChange({ ...value, [key]: v });
  }

  const isDefault =
    value.columns === DEFAULT_FORMATTING.columns &&
    value.bodySize === DEFAULT_FORMATTING.bodySize &&
    value.lineHeight === DEFAULT_FORMATTING.lineHeight &&
    value.marginMm === DEFAULT_FORMATTING.marginMm &&
    value.topExtraMm === DEFAULT_FORMATTING.topExtraMm;

  return (
    <>
      <Select
        id="fmt-columns"
        label="Colunas"
        value={value.columns}
        options={COLUMNS}
        onChange={(v) => set("columns", v)}
      />
      <Select
        id="fmt-body"
        label="Corpo"
        value={value.bodySize}
        options={BODY_SIZE}
        onChange={(v) => set("bodySize", v)}
      />
      <Select
        id="fmt-line"
        label="Entrelinha"
        value={value.lineHeight}
        options={LINE_HEIGHT}
        onChange={(v) => set("lineHeight", v)}
      />
      <Select
        id="fmt-margin"
        label="Margem"
        value={value.marginMm}
        options={MARGIN}
        onChange={(v) => set("marginMm", v)}
      />
      <Select
        id="fmt-top"
        label="Topo"
        value={value.topExtraMm}
        options={TOP_EXTRA}
        onChange={(v) => set("topExtraMm", v)}
      />
      <button
        type="button"
        className="ghost"
        onClick={() => onChange({ ...DEFAULT_FORMATTING })}
        disabled={isDefault}
        title="Voltar à formatação padrão"
      >
        ↺ Padrão
      </button>
    </>
  );
}

interface SelectProps {
  id: string;
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}

function Select({ id, label, value, options, onChange }: SelectProps) {
  return (
    <div className="inline-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
