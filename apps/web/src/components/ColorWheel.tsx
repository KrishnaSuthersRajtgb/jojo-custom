import { useRef, useState, useCallback } from 'react';

interface ColorWheelProps {
  size?: number; // px, defaults to 220
  onSelect: (hex: string) => void;
  onClear?: () => void;
  selectedHex?: string | null;
}

// Converts HSL values to a #rrggbb hex string.
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function ColorWheel({
  size = 220,
  onSelect,
  onClear,
  selectedHex = null,
}: ColorWheelProps) {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [hovering, setHovering] = useState(false);

  const computeAndEmit = useCallback(
    (clientX: number, clientY: number) => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const radius = rect.width / 2;
      const dx = clientX - (rect.left + radius);
      const dy = clientY - (rect.top + radius);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Ignore positions outside the circle.
      if (distance > radius) return;

      // atan2 measures from the positive x-axis, clockwise on screen. Rotate
      // by +90deg so 0deg points up, matching the conic-gradient's start
      // angle, then normalize into 0-360.
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      const hue = angle;
      // Distance from center (0) to edge (1) drives saturation — center
      // reads white/desaturated, edge reads fully saturated, matching the
      // reference wheel's white-to-color fade.
      const saturation = Math.min(distance / radius, 1);
      const lightness = 0.55;

      const hex = hslToHex(hue, saturation, lightness);
      setMarkerPos({ x: dx + radius, y: dy + radius });
      onSelect(hex);
    },
    [onSelect],
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wheelRef}
        // Hover is the primary trigger — moving the mouse over the wheel
        // filters live. onClick is kept too, purely so touch/tap devices
        // (which have no hover) can still pick a color.
        onMouseMove={(e) => {
          setHovering(true);
          computeAndEmit(e.clientX, e.clientY);
        }}
        onMouseLeave={() => {
          setHovering(false);
        }}
        onClick={(e) => {
          computeAndEmit(e.clientX, e.clientY);
        }}
        role="button"
        tabIndex={0}
        aria-label="Hover to pick a custom color from the wheel"
        className="relative rounded-full cursor-crosshair select-none"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(from 0deg,
            #ff0000, #ff8000, #ffff00, #80ff00,
            #00ff00, #00ff80, #00ffff, #0080ff,
            #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)`,
          boxShadow: '0 6px 20px -8px rgba(27,21,18,0.45)',
        }}
      >
        {/* White-to-transparent radial fade — center desaturated, rim full
            color — matching the reference wheel. */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 68%)',
          }}
        />
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />

        {markerPos && (hovering || selectedHex) && (
          <span
            className="absolute h-3.5 w-3.5 rounded-full border-2 border-white shadow pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: markerPos.x,
              top: markerPos.y,
              backgroundColor: selectedHex ?? undefined,
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#4A413B] h-4">
        {selectedHex ? (
          <>
            <span
              className="h-4 w-4 rounded-full border border-black/10"
              style={{ backgroundColor: selectedHex }}
            />
            <span className="uppercase tracking-wide">{selectedHex}</span>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="ml-2 text-[#5C1A32] hover:underline"
              >
                Clear
              </button>
            )}
          </>
        ) : (
          <span className="text-[#4A413B]/40">Hover to preview a color</span>
        )}
      </div>
    </div>
  );
}
