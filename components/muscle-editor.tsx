"use client";

import { useState } from "react";
import { MuscleMap } from "./muscle-map";
import { muscleKeys, muscleLabels, type MuscleKey } from "@/lib/muscles";

// Checkbox grid + live preview used inside the /system/catalog editor form.
// The checkboxes are real form inputs (name="muscles") read by the server action.
export function MuscleEditor({ initial }: { initial: MuscleKey[] }) {
  const [selected, setSelected] = useState<MuscleKey[]>(initial);
  const toggle = (key: MuscleKey) =>
    setSelected((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  return (
    <>
      <div className="muscle-check-grid">
        {muscleKeys.map((key) => (
          <label key={key}>
            <input type="checkbox" name="muscles" value={key} checked={selected.includes(key)} onChange={() => toggle(key)} />
            {muscleLabels[key].en}
          </label>
        ))}
      </div>
      <MuscleMap highlighted={selected} className="muscle-map" />
    </>
  );
}
