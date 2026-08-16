import { computeDiagram, DIAGRAM_WIDTH } from "../../shared/diagram.js";
import type { Chord } from "../../shared/types.js";

interface Props {
  chord: Chord;
  capo: number | null;
}

export function ChordDiagram({ chord, capo }: Props) {
  const g = computeDiagram(chord.frets, chord.fingers, capo);

  return (
    <div className="sheet-shape">
      <div className="nm">
        {chord.name}
        {capo ? "*" : ""}
      </div>
      <svg width={DIAGRAM_WIDTH} height={g.height} viewBox={`0 0 ${DIAGRAM_WIDTH} ${g.height}`}>
        {g.capoBar && (
          <>
            <rect
              x={g.capoBar.x}
              y={g.capoBar.y}
              width={g.capoBar.width}
              height={g.capoBar.height}
              rx={1.6}
              fill="#3d3833"
            />
            <text
              x={g.capoBar.x + g.capoBar.width / 2}
              y={g.capoBar.y + 5.4}
              fontSize={4.2}
              letterSpacing={1.1}
              textAnchor="middle"
              fill="#fff"
              fontFamily="ui-monospace,monospace"
            >
              CAPO
            </text>
            <text
              x={g.capoBar.fretLabelX}
              y={g.capoBar.y + 6}
              fontSize={6}
              textAnchor="end"
              fill="#1c1a17"
              fontWeight={700}
            >
              {capo}ª
            </text>
          </>
        )}

        {g.stringX.map((x, i) => (
          <line key={`s${i}`} x1={x} y1={g.top} x2={x} y2={g.bottom} stroke="#1c1a17" strokeWidth={0.6} />
        ))}

        {g.fretLines.map((f, i) => (
          <line
            key={`f${i}`}
            x1={g.stringX[0]}
            y1={f.y}
            x2={g.stringX[5]}
            y2={f.y}
            stroke="#1c1a17"
            strokeWidth={f.thick ? 1.9 : 0.6}
          />
        ))}

        {g.baseFretLabel && (
          <text x={g.baseFretLabel.x} y={g.baseFretLabel.y} fontSize={5.2} fill="#6f6862">
            {g.baseFretLabel.text}
          </text>
        )}

        {g.barre && (
          <line
            x1={g.barre.x1}
            y1={g.barre.y}
            x2={g.barre.x2}
            y2={g.barre.y}
            stroke="#1c1a17"
            strokeWidth={4.4}
            strokeLinecap="round"
          />
        )}

        {g.dots.map((d, i) => (
          <g key={`d${i}`}>
            <circle cx={d.x} cy={d.y} r={2.6} fill="#1c1a17" />
            {d.finger && (
              <text
                x={d.x}
                y={d.y + 1.6}
                fontSize={4.2}
                textAnchor="middle"
                fill="#fff"
                fontFamily="ui-monospace,monospace"
              >
                {d.finger}
              </text>
            )}
          </g>
        ))}

        {g.belowMarkers.map((m, i) => {
          const y = g.bottom + 6;
          if (m.type === "muted") {
            return (
              <text key={`m${i}`} x={m.x} y={y + 2} fontSize={6} textAnchor="middle" fill="var(--grey)">
                ×
              </text>
            );
          }
          if (m.type === "open") {
            return (
              <circle key={`m${i}`} cx={m.x} cy={y} r={2.1} fill="none" stroke="var(--grey)" strokeWidth={0.9} />
            );
          }
          return <circle key={`m${i}`} cx={m.x} cy={y} r={2.1} fill="var(--grey)" />;
        })}
      </svg>
      {chord.caption && <div className="cap">{chord.caption}</div>}
    </div>
  );
}
