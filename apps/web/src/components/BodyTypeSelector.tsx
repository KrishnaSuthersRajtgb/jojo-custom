import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

type BodyType = 'invertedTriangle' | 'column' | 'rectangle' | 'apple' | 'pear' | 'hourglass';

interface BodyTypeDef {
  key: BodyType;
  label: string;
}

const BODY_TYPES: BodyTypeDef[] = [
  { key: 'invertedTriangle', label: 'The Inverted Triangle' },
  { key: 'column', label: 'The Column' },
  { key: 'rectangle', label: 'The Rectangle' },
  { key: 'apple', label: 'The Apple' },
  { key: 'pear', label: 'The Pear' },
  { key: 'hourglass', label: 'The Hour Glass' },
];

// Simple line-art silhouettes approximating each body shape.
function BodyTypeIcon({ type, active }: { type: BodyType; active: boolean }) {
  const stroke = active ? '#9d174d' : '#9ca3af';
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'invertedTriangle':
      return (
        <svg viewBox="0 0 48 56" className="h-10 w-10">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M8 20 L40 20 L28 44 L20 44 Z" {...common} />
        </svg>
      );
    case 'column':
      return (
        <svg viewBox="0 0 48 56" className="h-10 w-10">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M15 20 L33 20 L33 44 L15 44 Z" {...common} />
        </svg>
      );
    case 'rectangle':
      return (
        <svg viewBox="0 0 48 56" className="h-10 w-10">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M14 20 L34 20 L31 44 L17 44 Z" {...common} />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 48 56" className="h-10 w-10">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M16 20 C10 26 10 38 16 44 L32 44 C38 38 38 26 32 20 Z" {...common} />
        </svg>
      );
    case 'pear':
      return (
        <svg viewBox="0 0 48 56" className="h-10 w-10">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M19 20 L29 20 L36 44 L12 44 Z" {...common} />
        </svg>
      );
    case 'hourglass':
      return (
        <svg viewBox="0 0 48 56" className="h-10 w-10">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M14 20 L34 20 L24 32 L34 44 L14 44 L24 32 Z" {...common} />
        </svg>
      );
    default:
      return null;
  }
}

// Fired whenever the body type changes, so the global sidebar (and anything
// else listening) can refresh immediately without a page reload.
export const BODY_TYPE_UPDATED_EVENT = 'jojo-bodytype-updated';

export default function BodyTypeSelector() {
  const { user } = useAuth();
  const storageKey = `jojo_bodytype_${user?.username ?? 'guest'}`;

  const [selected, setSelected] = useState<BodyType | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw && BODY_TYPES.some((b) => b.key === raw)) {
      setSelected(raw as BodyType);
    } else {
      setSelected(null);
    }
  }, [storageKey]);

  const handleSelect = (type: BodyType) => {
    setSelected(type);
    localStorage.setItem(storageKey, type);
    window.dispatchEvent(new Event(BODY_TYPE_UPDATED_EVENT));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <h2 className="text-xs font-bold tracking-wide text-gray-800 mb-4">SELECT YOUR BODY TYPE</h2>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        {BODY_TYPES.map((bt) => {
          const active = selected === bt.key;
          return (
            <button
              key={bt.key}
              type="button"
              onClick={() => {
                handleSelect(bt.key);
              }}
              className={`flex flex-col items-center gap-1.5 w-20 rounded-lg py-1 transition-colors ${
                active ? 'bg-rose-50' : 'hover:bg-gray-50'
              }`}
            >
              <BodyTypeIcon type={bt.key} active={active} />
              <span
                className={`text-[10px] uppercase tracking-wide text-center leading-tight ${
                  active ? 'text-fuchsia-800 font-semibold' : 'text-gray-500'
                }`}
              >
                {bt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
