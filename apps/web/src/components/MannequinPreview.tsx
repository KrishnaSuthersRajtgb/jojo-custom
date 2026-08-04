interface MeasurementPoint {
  /** Label shown next to the dashed guide line, e.g. "Bust", "Waist", "Hip", "Seat". */
  label: string;
  /** The value currently typed into that field (already parsed to a number), if any. */
  value?: number;
  /** Typical reference value (in inches) used to scale the silhouette around. */
  baseline: number;
}

export type Neckline = 'round' | 'v' | 'sweetheart' | 'boat' | 'high';
export type SleeveStyle = 'sleeveless' | 'cap' | 'short' | 'elbow' | 'long' | 'puff' | 'bell';
export type Silhouette = 'fitted' | 'aline' | 'straight' | 'flared' | 'anarkali' | 'highlow';

interface MannequinPreviewProps {
  title?: string | undefined;
  bust?: MeasurementPoint | undefined;
  waist?: MeasurementPoint | undefined;
  hip?: MeasurementPoint | undefined;
  neckline?: Neckline | undefined;
  sleeveStyle?: SleeveStyle | undefined;
  silhouette?: Silhouette | undefined;
  styleLabel?: string | undefined;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function scaleFor(point?: MeasurementPoint): number {
  if (!point || point.value === undefined || Number.isNaN(point.value) || point.value <= 0) {
    return 1;
  }
  return clamp(point.value / point.baseline, 0.75, 1.35);
}

function necklinePath(type: Neckline, centerX: number): string {
  switch (type) {
    case 'v':
      return `M ${String(centerX - 20)} 142 L ${String(centerX)} 180 L ${String(centerX + 20)} 142`;
    case 'sweetheart':
      return `M ${String(centerX - 20)} 146 Q ${String(centerX - 10)} 158, ${String(centerX)} 150 Q ${String(centerX + 10)} 158, ${String(centerX + 20)} 146`;
    case 'boat':
      return `M ${String(centerX - 30)} 150 Q ${String(centerX)} 160, ${String(centerX + 30)} 150`;
    case 'high':
      return `M ${String(centerX - 13)} 136 L ${String(centerX + 13)} 136`;
    case 'round':
    default:
      return `M ${String(centerX - 20)} 148 Q ${String(centerX)} 168, ${String(centerX + 20)} 148`;
  }
}

function silhouetteParams(type: Silhouette | undefined) {
  switch (type) {
    case 'aline':
      return { hipMultiplier: 1.15, hemY: 430 };
    case 'straight':
      return { hipMultiplier: 0.82, hemY: 418 };
    case 'flared':
      return { hipMultiplier: 1.35, hemY: 432 };
    case 'anarkali':
      return { hipMultiplier: 1.3, hemY: 478 };
    case 'highlow':
      return { hipMultiplier: 1.2, hemY: 458 };
    case 'fitted':
    default:
      return { hipMultiplier: 1, hemY: 420 };
  }
}

const ARM_TOTAL = 170;

function sleeveLength(style: SleeveStyle | undefined): number {
  switch (style) {
    case 'sleeveless':
      return 0;
    case 'cap':
      return 32;
    case 'short':
      return 68;
    case 'elbow':
      return 108;
    case 'puff':
      return 62;
    case 'bell':
      return 150;
    case 'long':
      return ARM_TOTAL;
    default:
      return 68;
  }
}

export default function MannequinPreview({
  title,
  bust,
  waist,
  hip,
  neckline = 'round',
  sleeveStyle = 'short',
  silhouette = 'fitted',
  styleLabel,
}: MannequinPreviewProps) {
  const bustScale = scaleFor(bust);
  const waistScale = scaleFor(waist);
  const hipScale = scaleFor(hip);
  const { hipMultiplier, hemY } = silhouetteParams(silhouette);
  const kneeY = hemY + 80;
  const footY = hemY + 132;

  const centerX = 130;
  const shoulderHalf = 40;
  const bustHalf = 46 * bustScale;
  const waistHalf = 34 * waistScale;
  const hipHalf = 58 * hipScale * hipMultiplier;

  const shoulderY = 150;
  const bustY = 205;
  const waistY = 270;
  const hipY = 312;

  const bodyPath = `
    M ${String(centerX - shoulderHalf)} ${String(shoulderY)}
    C ${String(centerX - bustHalf)} ${String(shoulderY + 22)}, ${String(centerX - bustHalf)} ${String(bustY - 18)}, ${String(centerX - bustHalf)} ${String(bustY)}
    C ${String(centerX - bustHalf)} ${String(bustY + 24)}, ${String(centerX - waistHalf)} ${String(waistY - 16)}, ${String(centerX - waistHalf)} ${String(waistY)}
    L ${String(centerX - hipHalf)} ${String(hipY)}
    L ${String(centerX - hipHalf * 0.82)} ${String(hemY)}
    L ${String(centerX + hipHalf * 0.82)} ${String(hemY)}
    L ${String(centerX + hipHalf)} ${String(hipY)}
    L ${String(centerX + waistHalf)} ${String(waistY)}
    C ${String(centerX + waistHalf)} ${String(waistY - 16)}, ${String(centerX + bustHalf)} ${String(bustY + 24)}, ${String(centerX + bustHalf)} ${String(bustY)}
    C ${String(centerX + bustHalf)} ${String(bustY - 18)}, ${String(centerX + bustHalf)} ${String(shoulderY + 22)}, ${String(centerX + shoulderHalf)} ${String(shoulderY)}
    Z
  `;

  const rows: { key: string; y: number; point?: MeasurementPoint | undefined }[] = [
    { key: 'bust', y: bustY, point: bust },
    { key: 'waist', y: waistY, point: waist },
    { key: 'hip', y: hipY, point: hip },
  ];

  // Arm rendering: a skin-colored base arm, with a fabric-colored
  // overlay whose length depends on the selected sleeve style. Puff and
  // bell styles get an extra shape to suggest volume/flare.
  const sleeveLen = sleeveLength(sleeveStyle);
  const renderArm = (side: 'left' | 'right') => {
    const sign = side === 'left' ? -1 : 1;
    const x = side === 'left' ? centerX - shoulderHalf - 18 : centerX + shoulderHalf;
    const skinTop = shoulderY + 10;
    return (
      <g key={side}>
        {/* skin base */}
        <rect
          x={x}
          y={skinTop}
          width={18}
          height={ARM_TOTAL}
          rx={9}
          fill="#f0d3b8"
          stroke="#d9b896"
          strokeWidth={1}
        />
        {/* fabric sleeve overlay */}
        {sleeveLen > 0 && (
          <rect
            x={x - 1}
            y={skinTop}
            width={20}
            height={sleeveLen}
            rx={9}
            fill="#f6d8e0"
            stroke="#9d174d"
            strokeWidth={1}
          />
        )}
        {/* puff bulge near shoulder */}
        {sleeveStyle === 'puff' && (
          <ellipse
            cx={x + 9}
            cy={skinTop + 16}
            rx={16}
            ry={18}
            fill="#f6d8e0"
            stroke="#9d174d"
            strokeWidth={1}
          />
        )}
        {/* bell flare at cuff */}
        {sleeveStyle === 'bell' && (
          <path
            d={`M ${String(x - 4)} ${String(skinTop + sleeveLen - 6)}
                L ${String(x + 22)} ${String(skinTop + sleeveLen - 6)}
                L ${String(x + (sign < 0 ? 27 : -7))} ${String(skinTop + sleeveLen + 20)}
                L ${String(x - (sign < 0 ? -9 : 9))} ${String(skinTop + sleeveLen + 20)}
                Z`}
            fill="#f6d8e0"
            stroke="#9d174d"
            strokeWidth={1}
          />
        )}
        {/* cap shoulder flourish */}
        {sleeveStyle === 'cap' && (
          <ellipse
            cx={x + 9}
            cy={skinTop + 6}
            rx={17}
            ry={12}
            fill="#f6d8e0"
            stroke="#9d174d"
            strokeWidth={1}
          />
        )}
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-4">
      {title && (
        <h3 className="text-[11px] font-bold tracking-wide text-gray-500 text-center mb-3">
          {title.toUpperCase()}
        </h3>
      )}

      <svg viewBox={`0 0 260 ${String(footY + 30)}`} className="w-full h-auto">
        {/* Hair */}
        <ellipse cx={centerX} cy={78} rx={26} ry={20} fill="#6b4a35" />
        {/* Head */}
        <circle cx={centerX} cy={92} r={22} fill="#f0d3b8" stroke="#d9b896" strokeWidth={1} />
        {/* Neck */}
        <rect x={centerX - 8} y={112} width={16} height={20} fill="#f0d3b8" />

        {/* Arms (drawn before body so the body's shoulders overlap them cleanly) */}
        {renderArm('left')}
        {renderArm('right')}

        {/* Body / garment silhouette */}
        <path d={bodyPath} fill="#faf1ea" stroke="#9d174d" strokeWidth={1.5} />

        {/* Neckline — changes shape per selected style */}
        <path d={necklinePath(neckline, centerX)} fill="none" stroke="#9d174d" strokeWidth={2} />

        {/* Legs */}
        <rect
          x={centerX - 34}
          y={hemY}
          width={26}
          height={kneeY - hemY + 30}
          rx={10}
          fill="#f0d3b8"
        />
        <rect
          x={centerX + 8}
          y={hemY}
          width={26}
          height={kneeY - hemY + 30}
          rx={10}
          fill="#f0d3b8"
        />
        {/* Feet */}
        <ellipse cx={centerX - 21} cy={footY} rx={16} ry={7} fill="#c99a67" />
        <ellipse cx={centerX + 21} cy={footY} rx={16} ry={7} fill="#c99a67" />

        {/* Guide lines + labels */}
        {rows.map(({ key, y, point }) => {
          if (!point) return null;
          const half = key === 'bust' ? bustHalf : key === 'waist' ? waistHalf : hipHalf;
          return (
            <g key={key}>
              <line
                x1={30}
                y1={y}
                x2={centerX - half - 2}
                y2={y}
                stroke="#9d174d"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <line
                x1={centerX + half + 2}
                y1={y}
                x2={230}
                y2={y}
                stroke="#9d174d"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={26}
                y={y - 4}
                textAnchor="end"
                className="fill-fuchsia-800"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}
              >
                {point.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-[11px] text-center mt-2">
        {styleLabel ? (
          <span className="font-semibold text-fuchsia-800">{styleLabel}</span>
        ) : (
          <span className="text-gray-400">Select a style to preview</span>
        )}
      </p>
    </div>
  );
}
