import type { MuscleKey } from "@/lib/muscles";

const BODY = "#cfd4da";
const MUSCLE = "#b7bdc5";
const ACTIVE = "#e1282e";

// Stylized front + back figure with highlightable muscle groups, modelled on
// the streetbarbell.com "muscles in use" illustration.
function Silhouette() {
  return (
    <g fill={BODY}>
      <circle cx="120" cy="36" r="16" />
      <rect x="112" y="48" width="16" height="16" rx="5" />
      <path d="M86 66 Q120 57 154 66 L149 168 Q120 178 91 168 Z" />
      <path d="M91 168 Q120 178 149 168 L152 206 Q120 219 88 206 Z" />
      <rect x="62" y="70" width="17" height="50" rx="8" transform="rotate(13 70 95)" />
      <rect x="55" y="118" width="14" height="54" rx="7" transform="rotate(9 62 145)" />
      <ellipse cx="56" cy="180" rx="7" ry="9" />
      <rect x="161" y="70" width="17" height="50" rx="8" transform="rotate(-13 170 95)" />
      <rect x="171" y="118" width="14" height="54" rx="7" transform="rotate(-9 178 145)" />
      <ellipse cx="184" cy="180" rx="7" ry="9" />
      <rect x="93" y="206" width="25" height="72" rx="12" />
      <rect x="122" y="206" width="25" height="72" rx="12" />
      <rect x="96" y="272" width="20" height="64" rx="9" />
      <rect x="124" y="272" width="20" height="64" rx="9" />
      <ellipse cx="105" cy="342" rx="12" ry="6" />
      <ellipse cx="135" cy="342" rx="12" ry="6" />
    </g>
  );
}

export function MuscleMap({ highlighted, className }: { highlighted: MuscleKey[]; className?: string }) {
  const active = new Set(highlighted);
  const fill = (key: MuscleKey) => (active.has(key) ? ACTIVE : MUSCLE);
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Muscles in use">
      {/* front view */}
      <g>
        <Silhouette />
        <ellipse cx="106" cy="61" rx="7" ry="6" fill={fill("neck")} />
        <ellipse cx="134" cy="61" rx="7" ry="6" fill={fill("neck")} />
        <ellipse cx="90" cy="77" rx="10" ry="9" fill={fill("shoulders")} />
        <ellipse cx="150" cy="77" rx="10" ry="9" fill={fill("shoulders")} />
        <ellipse cx="105" cy="96" rx="13" ry="13" fill={fill("chest")} />
        <ellipse cx="135" cy="96" rx="13" ry="13" fill={fill("chest")} />
        <ellipse cx="76" cy="106" rx="7" ry="14" fill={fill("biceps")} transform="rotate(13 76 106)" />
        <ellipse cx="164" cy="106" rx="7" ry="14" fill={fill("biceps")} transform="rotate(-13 164 106)" />
        <ellipse cx="65" cy="146" rx="6" ry="17" fill={fill("forearms")} transform="rotate(9 65 146)" />
        <ellipse cx="175" cy="146" rx="6" ry="17" fill={fill("forearms")} transform="rotate(-9 175 146)" />
        <rect x="108" y="114" width="24" height="50" rx="9" fill={fill("abs")} />
        <ellipse cx="99" cy="134" rx="6" ry="20" fill={fill("obliques")} />
        <ellipse cx="141" cy="134" rx="6" ry="20" fill={fill("obliques")} />
        <ellipse cx="106" cy="238" rx="10" ry="30" fill={fill("quads")} />
        <ellipse cx="134" cy="238" rx="10" ry="30" fill={fill("quads")} />
        <ellipse cx="117" cy="224" rx="4" ry="17" fill={fill("adductors")} />
        <ellipse cx="123" cy="224" rx="4" ry="17" fill={fill("adductors")} />
      </g>
      {/* back view */}
      <g transform="translate(240 0)">
        <Silhouette />
        <path d="M108 56 L132 56 L146 82 L94 82 Z" fill={fill("neck")} />
        <ellipse cx="90" cy="77" rx="10" ry="9" fill={fill("shoulders")} />
        <ellipse cx="150" cy="77" rx="10" ry="9" fill={fill("shoulders")} />
        <ellipse cx="76" cy="106" rx="7" ry="14" fill={fill("triceps")} transform="rotate(13 76 106)" />
        <ellipse cx="164" cy="106" rx="7" ry="14" fill={fill("triceps")} transform="rotate(-13 164 106)" />
        <ellipse cx="65" cy="146" rx="6" ry="17" fill={fill("forearms")} transform="rotate(9 65 146)" />
        <ellipse cx="175" cy="146" rx="6" ry="17" fill={fill("forearms")} transform="rotate(-9 175 146)" />
        <path d="M96 88 Q120 96 144 88 L136 128 Q120 136 104 128 Z" fill={fill("back")} />
        <rect x="107" y="132" width="26" height="24" rx="7" fill={fill("lowerBack")} />
        <ellipse cx="107" cy="182" rx="12" ry="14" fill={fill("glutes")} />
        <ellipse cx="133" cy="182" rx="12" ry="14" fill={fill("glutes")} />
        <ellipse cx="106" cy="240" rx="10" ry="30" fill={fill("hamstrings")} />
        <ellipse cx="134" cy="240" rx="10" ry="30" fill={fill("hamstrings")} />
        <ellipse cx="106" cy="302" rx="8" ry="22" fill={fill("calves")} />
        <ellipse cx="134" cy="302" rx="8" ry="22" fill={fill("calves")} />
      </g>
    </svg>
  );
}
