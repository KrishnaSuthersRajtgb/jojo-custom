import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Ruler, ChevronDown, X } from 'lucide-react';
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

export default function MeasurementSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide entirely on admin, auth, and payment pages to preserve pristine layout & alignment
  const isHiddenRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/payment';

  const storageKey = `jojo_measurements_${user?.username ?? 'guest'}`;
  const bodyTypeKey = `jojo_bodytype_${user?.username ?? 'guest'}`;

  const [values, setValues] = useState<Record<string, MeasurementValues>>(() => ({
    blouse: emptyValues(BLOUSE_FIELDS),
    chudi: emptyValues(CHUDI_FIELDS),
    pant: emptyValues(PANT_FIELDS),
  }));
  const [bodyType, setBodyType] = useState<BodyType | null>(null);

  // Overlay drawer state: closed by default on all screens so page content is perfectly centered
  const [collapsed, setCollapsed] = useState<boolean>(true);

  // Per-section (Blouse / Chudi / Pant) expand-collapse state
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

  const handleSelectBodyType = (type: BodyType) => {
    setBodyType(type);
    localStorage.setItem(bodyTypeKey, type);
    window.dispatchEvent(new Event(BODY_TYPE_UPDATED_EVENT));
  };

  if (isHiddenRoute) {
    return null;
  }

  return (
    <>
      {/* Haute Couture Floating Measurement Drawer Tab */}
      <button
        type="button"
        onClick={() => {
          setCollapsed((c) => !c);
        }}
        aria-label={collapsed ? 'Show measurements panel' : 'Hide measurements panel'}
        aria-expanded={!collapsed}
        className="fixed top-36 right-0 z-[65] bg-[#1B1512] hover:bg-[#5C1A32] text-[#F6F1E7] border-l border-y border-[#B8935A]/50 rounded-l-md shadow-2xl px-2 py-3.5 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 group"
      >
        <Ruler className="h-4 w-4 text-[#B8935A] group-hover:rotate-12 transition-transform" />
        <span className="text-[9px] font-semibold tracking-[0.22em] uppercase  text-[#E8DFC8]">
          Fittings
        </span>
      </button>

      {/* Dim backdrop when drawer is open */}
      {!collapsed && (
        <div
          onClick={() => {
            setCollapsed(true);
          }}
          aria-hidden="true"
          className="fixed inset-0 z-[68] bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Slide-out Overlay Drawer - Does NOT affect main page flex layout */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[340px] max-w-[90vw] bg-[#FAF7F2] shadow-2xl overflow-y-auto border-l border-[#5C1A32]/15 transition-transform duration-300 ease-in-out ${
          collapsed ? 'translate-x-full pointer-events-none' : 'translate-x-0 pointer-events-auto'
        }`}
      >
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 bg-[#FAF7F2]/95 backdrop-blur-md px-5 py-4 border-b border-[#5C1A32]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ruler className="h-4 w-4 text-[#5C1A32]" />
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#1B1512]">
              Couture Measurements
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-[#1B1512]/60 hover:text-[#5C1A32] rounded-full hover:bg-[#5C1A32]/5 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
