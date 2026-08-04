import { useState, useEffect } from 'react';
import { Ruler, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BODY_TYPE_UPDATED_EVENT } from './BodyTypeSelector';
import {
  BLOUSE_FIELDS,
  CHUDI_FIELDS,
  PANT_FIELDS,
  MEASUREMENT_SECTIONS,
  emptyValues,
} from '../config/measurementFields';

// Same tokens as Home.tsx / Fabrics.tsx — ink / wine / brass / bone,
// Fraunces + Inter. See Home.tsx for the full token comment and the
// Google Fonts link to add once to index.html.
const serifLabel = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

type MeasurementValues = Record<string, string>;

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

function BodyTypeIcon({ type, active }: { type: BodyType; active: boolean }) {
  const stroke = active ? '#5C1A32' : '#9ca3af';
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
        <svg viewBox="0 0 48 56" className="h-8 w-8">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M8 20 L40 20 L28 44 L20 44 Z" {...common} />
        </svg>
      );
    case 'column':
      return (
        <svg viewBox="0 0 48 56" className="h-8 w-8">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M15 20 L33 20 L33 44 L15 44 Z" {...common} />
        </svg>
      );
    case 'rectangle':
      return (
        <svg viewBox="0 0 48 56" className="h-8 w-8">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M14 20 L34 20 L31 44 L17 44 Z" {...common} />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 48 56" className="h-8 w-8">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M16 20 C10 26 10 38 16 44 L32 44 C38 38 38 26 32 20 Z" {...common} />
        </svg>
      );
    case 'pear':
      return (
        <svg viewBox="0 0 48 56" className="h-8 w-8">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M19 20 L29 20 L36 44 L12 44 Z" {...common} />
        </svg>
      );
    case 'hourglass':
      return (
        <svg viewBox="0 0 48 56" className="h-8 w-8">
          <circle cx="24" cy="8" r="5" {...common} />
          <path d="M14 20 L34 20 L24 32 L34 44 L14 44 L24 32 Z" {...common} />
        </svg>
      );
    default:
      return null;
  }
}

// Fired by Measurements.tsx (and now ProductStyle.tsx) after a save, so
// this sidebar refreshes immediately even though it lives outside those
// pages' component trees.
export const MEASUREMENTS_UPDATED_EVENT = 'jojo-measurements-updated';

// Tailwind's lg breakpoint (1024px) — used to pick the initial collapse
// state per device: open by default on desktop (matches prior
// behavior), closed by default on mobile (opens as an overlay drawer
// when tapped, like a typical mobile panel).
const LG_BREAKPOINT = 1024;

export default function MeasurementSidebar() {
  const { user } = useAuth();
  const storageKey = `jojo_measurements_${user?.username ?? 'guest'}`;
  // Same key BodyTypeSelector.tsx reads/writes — selecting here or on
  // the Measurements page keeps both in sync via BODY_TYPE_UPDATED_EVENT.
  const bodyTypeKey = `jojo_bodytype_${user?.username ?? 'guest'}`;

  const [values, setValues] = useState<Record<string, MeasurementValues>>(() => ({
    blouse: emptyValues(BLOUSE_FIELDS),
    chudi: emptyValues(CHUDI_FIELDS),
    pant: emptyValues(PANT_FIELDS),
  }));
  const [bodyType, setBodyType] = useState<BodyType | null>(null);

  // Whole-panel collapse. On lg+ this behaves as before: an in-flow
  // sticky column that animates width. Below lg it now renders as a
  // fixed overlay drawer (with a backdrop) that slides in from the
  // right, so opening it doesn't push the page content down.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < LG_BREAKPOINT;
  });

  // Per-section (Blouse / Chudi / Pant) expand-collapse state, toggled
  // via the down/up chevron on each section's header. All start open so
  // existing behavior — everything visible — is unchanged by default.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MEASUREMENT_SECTIONS.map((s) => [s.storageSuffix, true])),
  );

  const toggleSection = (storageSuffix: string) => {
    setOpenSections((prev) => ({ ...prev, [storageSuffix]: !prev[storageSuffix] }));
  };

  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          setValues(JSON.parse(raw) as Record<string, MeasurementValues>);
          return;
        } catch {
          // fall through to reset below
        }
      }
      setValues({
        blouse: emptyValues(BLOUSE_FIELDS),
        chudi: emptyValues(CHUDI_FIELDS),
        pant: emptyValues(PANT_FIELDS),
      });
    };

    load();
    window.addEventListener(MEASUREMENTS_UPDATED_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(MEASUREMENTS_UPDATED_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [storageKey]);

  useEffect(() => {
    const loadBodyType = () => {
      const raw = localStorage.getItem(bodyTypeKey);
      if (raw && BODY_TYPES.some((b) => b.key === raw)) {
        setBodyType(raw as BodyType);
      } else {
        setBodyType(null);
      }
    };

    loadBodyType();
    window.addEventListener(BODY_TYPE_UPDATED_EVENT, loadBodyType);
    window.addEventListener('storage', loadBodyType);
    return () => {
      window.removeEventListener(BODY_TYPE_UPDATED_EVENT, loadBodyType);
      window.removeEventListener('storage', loadBodyType);
    };
  }, [bodyTypeKey]);

  // Same write pattern as BodyTypeSelector.tsx's handleSelect: persist,
  // update local state, and notify any other listeners (including
  // BodyTypeSelector itself if it's mounted elsewhere).
  const handleSelectBodyType = (type: BodyType) => {
    setBodyType(type);
    localStorage.setItem(bodyTypeKey, type);
    window.dispatchEvent(new Event(BODY_TYPE_UPDATED_EVENT));
  };

  return (
    <>
      {/* Toggle handle — always visible, fixed so it stays put while
          scrolling. On lg+ it tracks the panel's left edge (width-based
          collapse); below lg it sits near the screen edge and opens the
          overlay drawer instead. */}
      <button
        type="button"
        onClick={() => {
          setCollapsed((c) => !c);
        }}
        aria-label={collapsed ? 'Show measurements panel' : 'Hide measurements panel'}
        aria-expanded={!collapsed}
        // z-[65] — above Navbar.tsx's z-[60] so this stays clickable on
        // desktop regardless of stacking order; below its dropdown's
        // z-[70] (a dropdown, when open, should still cover this).
        className={`flex fixed top-24 z-[65] h-8 w-8 items-center justify-center rounded-full bg-[#F6F1E7] border border-[#5C1A32]/25 shadow-md text-[#5C1A32] hover:bg-[#5C1A32]/5 transition-[right] duration-300 right-2 pointer-events-auto ${
          !collapsed ? 'lg:right-[calc(320px-12px)]' : 'lg:right-2'
        }`}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Backdrop — mobile/tablet only, shown while the drawer is open.
          Tapping it closes the panel, same as the arrow. */}
      {!collapsed && (
        <div
          onClick={() => {
            setCollapsed(true);
          }}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`bg-[#F6F1E7] overflow-y-auto transition-transform duration-300 ease-in-out
          fixed top-16 right-0 bottom-0 z-40 w-[85%] max-w-sm shadow-xl
          ${collapsed ? 'translate-x-full' : 'translate-x-0'}
          lg:static lg:z-auto lg:shadow-none lg:translate-x-0 lg:top-0 lg:right-auto lg:bottom-auto
          lg:max-w-none lg:shrink-0 lg:sticky lg:h-screen lg:overflow-x-hidden
          lg:transition-[width] lg:duration-300
          ${collapsed ? 'lg:w-0 lg:border-l-0' : 'lg:w-[320px] lg:border-l border-[#5C1A32]/12'}
        `}
      >
        <div className="w-full lg:w-[320px] px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="h-4 w-4 text-[#5C1A32]" />
            <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1B1512]">
              Your Measurements
            </h3>
          </div>

          {/* Body type — selectable here too, not just on the
              Measurements page. Writes to the same storage key and
              fires the same event as BodyTypeSelector.tsx. */}
          <div className="bg-white border border-[#5C1A32]/12 p-4 mb-4">
            <h4 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#4A413B]/70 mb-3">
              Body Type
            </h4>
            <div className="flex flex-wrap gap-2">
              {BODY_TYPES.map((bt) => {
                const active = bodyType === bt.key;
                return (
                  <button
                    key={bt.key}
                    type="button"
                    onClick={() => {
                      handleSelectBodyType(bt.key);
                    }}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 w-[72px] py-1.5 transition-colors ${
                      active ? 'bg-[#5C1A32]/8' : 'hover:bg-[#5C1A32]/5'
                    }`}
                  >
                    <BodyTypeIcon type={bt.key} active={active} />
                    <span
                      className={`text-[9px] uppercase tracking-wide text-center leading-tight ${
                        active ? 'text-[#5C1A32] font-semibold' : 'text-[#4A413B]/60'
                      }`}
                    >
                      {bt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {MEASUREMENT_SECTIONS.map((section) => {
              const sectionValues = values[section.storageSuffix] ?? {};
              const isOpen = openSections[section.storageSuffix] ?? true;

              return (
                <div
                  key={section.storageSuffix}
                  className="bg-white border border-[#5C1A32]/12 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleSection(section.storageSuffix);
                    }}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-[#5C1A32]/10 text-left"
                  >
                    <h4 className="text-sm text-[#1B1512]" style={serifLabel}>
                      {section.title}
                    </h4>
                    <ChevronDown
                      className={`h-4 w-4 text-[#4A413B]/40 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 space-y-3">
                      {section.fields.map((field, idx) => {
                        const val = sectionValues[field.key];
                        const display = val && val.trim() !== '' ? val : '0.0';
                        return (
                          <div key={field.key} className="flex items-center gap-3">
                            <span className="w-5 text-xs font-semibold text-[#B8935A]">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-sm text-[#2A211D]">{field.label}</span>
                            <div className="flex items-center gap-1">
                              <span
                                className={`w-14 border border-[#5C1A32]/20 px-2 py-1.5 text-sm text-center ${
                                  val && val.trim() !== ''
                                    ? 'text-[#1B1512] font-medium'
                                    : 'text-[#4A413B]/30'
                                }`}
                              >
                                {display}
                              </span>
                              <span className="text-xs text-[#4A413B]/50">in</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
