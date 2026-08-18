import { parseSheet } from "../../shared/parseSheet.js";
import type { Chord, FormattingSettings } from "../../shared/types.js";
import { ChordDiagram } from "./ChordDiagram.js";

interface Props {
  title: string;
  artist: string;
  songKey: string | null;
  capo: number | null;
  chords: Chord[];
  sheetText: string;
  formatting: FormattingSettings;
}

/**
 * The single printable sheet. Preview and printout are these same DOM nodes —
 * there is no second render path (Constitution Principle II). Formatting
 * settings are applied as CSS custom properties so a settings change reflows
 * this exact element instead of remounting it.
 */
export function Sheet({ title, artist, songKey, capo, chords, sheetText, formatting }: Props) {
  const blocks = parseSheet(sheetText);
  const metaParts = [
    songKey ? `Tom ${songKey}` : "",
    capo ? `Capotraste na ${capo}ª casa` : "",
  ].filter(Boolean);

  /* At this count the shapes no longer fit on one line beside the title:
     62px each (DIAGRAM_WIDTH) plus a 10px gap against the ~68% of the width
     the strip was allowed. Rather than squeeze the title, the head stacks. */
  const STACK_SHAPES_FROM = 5;
  const stacked = chords.length >= STACK_SHAPES_FROM;

  const style = {
    "--columns": formatting.columns,
    "--body-size": formatting.bodySize,
    "--line-height": formatting.lineHeight,
    "--margin-mm": formatting.marginMm,
    "--top-extra-mm": formatting.topExtraMm,
  } as React.CSSProperties;

  return (
    <div className="sheet print-area" style={style}>
      <div className={stacked ? "sheet-head sheet-head--stacked" : "sheet-head"}>
        <div className="sheet-headline">
          <h2 className="sheet-title">{title}</h2>
          <p className="sheet-artist">{artist}</p>
          {metaParts.length > 0 && <p className="sheet-meta">{metaParts.join(" · ")}</p>}
        </div>
        {chords.length > 0 && (
          <div className="sheet-shapes">
            {chords.map((c) => (
              <ChordDiagram key={c.id} chord={c} capo={capo} />
            ))}
          </div>
        )}
      </div>
      <div className="sheet-body">
        {blocks.map((b, i) => {
          switch (b.kind) {
            case "blank":
              return (
                <div className="sheet-blk" key={i}>
                  <pre>&nbsp;</pre>
                </div>
              );
            case "section":
              return (
                <div className="sheet-blk" key={i}>
                  <pre className="s">{b.line}</pre>
                </div>
              );
            case "pair":
              return (
                <div className="sheet-blk" key={i}>
                  <pre className="c">{b.chordLine}</pre>
                  <pre>{b.lyricLine}</pre>
                </div>
              );
            case "chords":
              return (
                <div className="sheet-blk" key={i}>
                  <pre className="c">{b.line}</pre>
                </div>
              );
            case "lyrics":
              return (
                <div className="sheet-blk" key={i}>
                  <pre>{b.line}</pre>
                </div>
              );
          }
        })}
      </div>
    </div>
  );
}
