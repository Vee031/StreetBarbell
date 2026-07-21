"use client";

import { useState } from "react";
import { BASE_PATHS, FIGURE_VIEWBOX, MUSCLE_SHAPES, groupShapeIndices } from "@/lib/muscle-figure";
import { muscleKeys, muscleLabels, type MuscleKey } from "@/lib/muscles";

// Interactive figure for /system/catalog: click any region on the body to toggle
// it red, or use the group buttons as shortcuts. The current selection is carried
// to the server action through a hidden "muscleShapes" input (comma-joined indices).
export function MuscleEditor({ initial, autoDetected }: { initial: number[]; autoDetected: number[] }) {
  const [active, setActive] = useState<Set<number>>(() => new Set(initial));

  const replace = (next: Set<number>) => setActive(next);
  const toggleShape = (index: number) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  const toggleGroup = (key: MuscleKey) => {
    const indices = groupShapeIndices(key);
    const allOn = indices.length > 0 && indices.every((i) => active.has(i));
    const next = new Set(active);
    indices.forEach((i) => (allOn ? next.delete(i) : next.add(i)));
    replace(next);
  };

  const groupState = (key: MuscleKey) => {
    const indices = groupShapeIndices(key);
    const on = indices.filter((i) => active.has(i)).length;
    if (on === 0) return "";
    return on === indices.length ? "on" : "partial";
  };

  return (
    <div className="muscle-editor">
      <input type="hidden" name="muscleShapes" value={[...active].sort((a, b) => a - b).join(",")} />

      <svg viewBox={FIGURE_VIEWBOX} className="muscle-map muscle-map-editable">
        {BASE_PATHS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} fillRule={p.eo ? "evenodd" : undefined} stroke={p.stroke} strokeWidth={p.width} />
        ))}
        {MUSCLE_SHAPES.map((shape, i) => (
          <path
            key={`m${i}`}
            d={shape.d}
            className={active.has(i) ? "muscle-hit on" : "muscle-hit"}
            onClick={() => toggleShape(i)}
          >
            <title>{muscleLabels[shape.group].en}</title>
          </path>
        ))}
      </svg>

      <p className="sys-note">Click a region on the figure to switch its red highlight on or off. Use the buttons for whole muscle groups.</p>

      <div className="muscle-group-buttons">
        {muscleKeys.map((key) => (
          <button type="button" key={key} className={`muscle-group-btn ${groupState(key)}`} onClick={() => toggleGroup(key)}>
            {muscleLabels[key].en}
          </button>
        ))}
      </div>

      <div className="muscle-editor-actions">
        <button type="button" className="muscle-plain-btn" onClick={() => replace(new Set(autoDetected))}>Reset to auto-detected</button>
        <button type="button" className="muscle-plain-btn" onClick={() => replace(new Set())}>Clear all</button>
      </div>
    </div>
  );
}
