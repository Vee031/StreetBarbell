import { BASE_PATHS, FIGURE_VIEWBOX, MUSCLE_SHAPES } from "@/lib/muscle-figure";

const ACTIVE = "#ee2a24";

// Read-only figure for the public product page. Renders the official catalog
// artwork with the given highlight regions (indices into MUSCLE_SHAPES) in red.
export function MuscleMap({ activeShapes, className }: { activeShapes: number[]; className?: string }) {
  const active = new Set(activeShapes);
  return (
    <svg viewBox={FIGURE_VIEWBOX} className={className} role="img" aria-label="Muscles in use">
      {BASE_PATHS.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill}
          fillRule={p.eo ? "evenodd" : undefined}
          stroke={p.stroke}
          strokeWidth={p.width}
        />
      ))}
      {MUSCLE_SHAPES.map((shape, i) => (active.has(i) ? <path key={`m${i}`} d={shape.d} fill={ACTIVE} /> : null))}
    </svg>
  );
}
