import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Check, Ruler, ImagePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MEASUREMENTS_UPDATED_EVENT } from '../components/MeasurementSidebar';
import MannequinPreview, {
  type Neckline,
  type SleeveStyle,
  type Silhouette,
} from '../components/MannequinPreview';
import { MEASUREMENT_SECTIONS, PRODUCT_TO_SECTION, emptyValues } from '../config/measurementFields';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx / CustomOutfit.tsx)
//   ink      #1B1512  headings, primary text, selected-option fills
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / rose)
//   brass    #B8935A  secondary accent — small icons
//   bone     #F6F1E7  page background
// Display face: Fraunces, for page/section titles.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

// Reference photo constraints — kept conservative since this gets stored
// as a base64 string in localStorage alongside measurements.
const MAX_REFERENCE_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface StyleSubOption {
  id: string;
  label: string;
}

interface StyleOption {
  id: string;
  label: string;
  subOptions?: StyleSubOption[];
}

interface StyleSection {
  id: string;
  label: string;
  options: StyleOption[];
}

interface ProductStyleConfig {
  name: string;
  sections: StyleSection[];
}

interface SectionSelection {
  optionId: string;
  subOptionId: string | null;
}

// Fabric details forwarded from FabricDetail.tsx -> CustomOutfit.tsx.
// Carried through here untouched and passed on to Accessories/Summary.
interface IncomingFabric {
  fabricId: string;
  fabricName: string;
  fabricTone: string;
  fabricHex: string;
  pricePerMeter: number;
  garment: string;
  garmentLabel: string;
  meters: number;
  fabricTotal: number;
}

interface IncomingStyleState {
  productName?: string;
  fabric?: IncomingFabric;
}

// A client-uploaded photo (e.g. a style they saw elsewhere) that gets
// carried through Accessories/Summary so the stitching employee has a
// visual reference alongside the measurements and style selections.
interface ReferenceImage {
  dataUrl: string;
  fileName: string;
}

// Add each product's style sections here as you send them over.
// A product can have one section (e.g. Blouse Style) or several
// independent sections (e.g. Chudidhar needs Kurta Type + Sleeve Design).
const PRODUCT_STYLES: Record<string, ProductStyleConfig> = {
  blouse: {
    name: 'Blouse',
    sections: [
      {
        id: 'style',
        label: 'Blouse Style',
        options: [
          {
            id: 'darted',
            label: 'Darted Blouse',
            subOptions: [
              { id: '2-dart', label: '2 Dart Blouse' },
              { id: '3-dart', label: '3 Dart Blouse' },
              { id: '4-dart', label: '4 Dart Blouse' },
            ],
          },
          { id: 'princess-cut', label: 'Princess Cut Blouse' },
          { id: 'katori-cut', label: 'Katori Cut Blouse' },
          { id: 'customized', label: 'Customized Design' },
        ],
      },
    ],
  },
  chudidhar: {
    name: 'Chudidhar',
    sections: [
      {
        id: 'kurta-type',
        label: 'Kurta Type',
        options: [
          { id: 'a-line', label: 'A-Line Kurta' },
          { id: 'straight-cut', label: 'Straight Cut Kurta' },
          { id: 'anarkali', label: 'Anarkali Kurta' },
          { id: 'c-cut', label: 'C-Cut Kurta' },
          { id: 'flared', label: 'Flared Kurta' },
          { id: 'high-low', label: 'High-Low Kurta' },
          { id: 'tail-cut', label: 'Tail Cut Kurta' },
          { id: 'shirt-style', label: 'Shirt Style Kurta' },
          { id: 'pakistani', label: 'Pakistani Kurta' },
          { id: 'angrakha', label: 'Angrakha Kurta' },
          { id: 'floor-length', label: 'Floor-Length Kurta' },
          { id: 'indo-western', label: 'Indo-Western Kurta' },
        ],
      },
      {
        id: 'sleeve-design',
        label: 'Sleeve Design',
        options: [
          { id: 'butterfly', label: 'Butterfly Sleeve' },
          { id: 'pleated', label: 'Pleated Sleeve' },
          { id: 'split', label: 'Split Sleeve' },
          { id: 'sheer-puff', label: 'Sheer Puff Sleeve' },
          { id: 'blouson', label: 'Blouson Sleeve' },
          { id: 'tie', label: 'Tie Sleeve' },
          { id: 'double-flounce', label: 'Double Flounce Sleeve' },
          { id: 'tulip', label: 'Tulip Sleeve' },
          { id: 'lantern', label: 'Lantern Sleeve' },
          { id: 'ruched', label: 'Ruched Sleeve' },
          { id: 'cape', label: 'Cape Sleeve' },
          { id: 'leg-of-mutton', label: 'Leg-of-Mutton Sleeve' },
          { id: 'slit-bell', label: 'Slit Bell Sleeve' },
          { id: 'eyelet', label: 'Eyelet Sleeve' },
          { id: 'cut-out', label: 'Cut-Out Sleeve' },
          { id: 'smocked', label: 'Smocked Sleeve' },
          { id: 'tiered', label: 'Tiered Sleeve' },
          { id: 'trumpet', label: 'Trumpet Sleeve' },
        ],
      },
    ],
  },
  frocks: {
    name: 'Frocks',
    sections: [
      {
        id: 'style',
        label: 'Style',
        options: [{ id: 'customized', label: 'Customized Design' }],
      },
    ],
  },
  lehanga: {
    name: 'Lehanga',
    sections: [
      {
        id: 'style',
        label: 'Style',
        options: [{ id: 'customized', label: 'Customized Design' }],
      },
    ],
  },
  'ready-to-wear-saree': {
    name: 'Ready to Wear Saree',
    sections: [
      {
        id: 'style',
        label: 'Style',
        options: [{ id: 'customized', label: 'Customized Design' }],
      },
    ],
  },
  pant: {
    name: 'Pant',
    sections: [
      {
        id: 'pant-style',
        label: 'Pant Style',
        options: [
          { id: 'churidar-salwaar', label: 'Churidar Salwaar' },
          { id: 'patiala-salwaar', label: 'Patiala Salwaar' },
          { id: 'afghani-salwaar', label: 'Afghani Salwaar' },
          { id: 'dhoti-salwaar', label: 'Dhoti Salwaar' },
          { id: 'tulip-salwaar', label: 'Tulip Salwaar' },
          { id: 'palazzo-salwaar', label: 'Palazzo Salwaar' },
          { id: 'sharara', label: 'Sharara' },
          { id: 'gharara', label: 'Gharara' },
          { id: 'straight-cut-salwaar', label: 'Straight-Cut Salwaar' },
          { id: 'harem-salwaar', label: 'Harem Salwaar' },
          { id: 'balloon-salwaar', label: 'Balloon Salwaar' },
          { id: 'parallel-salwaar', label: 'Parallel Salwaar' },
        ],
      },
    ],
  },
  'over-coat': {
    name: 'Over Coat',
    sections: [
      {
        id: 'style',
        label: 'Style',
        options: [{ id: 'customized', label: 'Customized Design' }],
      },
    ],
  },
};

// Picks which measurement fields feed the Bust/Waist/Hip guide lines on
// MannequinPreview for the product currently being customized. Positions
// are visual slots (upper/mid/lower body) — labels reflect what's
// actually meaningful for that garment (e.g. pant uses Seat/Hip instead
// of Bust/Waist).
function buildPreviewMeasurements(
  storageSuffix: string | undefined,
  values: Record<string, string>,
) {
  const num = (key: string): number | undefined => {
    const raw = values[key];
    if (raw === undefined || raw === '') return undefined;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  switch (storageSuffix) {
    case 'blouse':
      return {
        bust: { label: 'Bust', value: num('upperChest'), baseline: 34 },
        waist: { label: 'Waist', value: num('waistRound'), baseline: 28 },
      };
    case 'chudi':
      return {
        bust: { label: 'Bust', value: num('chest'), baseline: 34 },
        waist: { label: 'Waist', value: num('waistRound'), baseline: 28 },
        hip: { label: 'Hip', value: num('seatLoose'), baseline: 40 },
      };
    case 'pant':
      return {
        waist: { label: 'Seat', value: num('seatRound'), baseline: 40 },
        hip: { label: 'Hip', value: num('hipRound'), baseline: 38 },
      };
    default:
      return {};
  }
}

// --- Style -> mannequin visual mappings ---------------------------------
// Every selectable option in every section maps to a distinct neckline,
// sleeve style, and/or silhouette so the preview reacts to whichever
// choice is made, not just to measurements.

type BlouseStyleVisual = { neckline: Neckline; sleeveStyle: SleeveStyle };

const BLOUSE_STYLE_VISUALS: Record<string, BlouseStyleVisual> = {
  darted: { neckline: 'round', sleeveStyle: 'cap' },
  'princess-cut': { neckline: 'sweetheart', sleeveStyle: 'cap' },
  'katori-cut': { neckline: 'boat', sleeveStyle: 'sleeveless' },
  customized: { neckline: 'v', sleeveStyle: 'short' },
};

const CHUDI_KURTA_SILHOUETTES: Record<string, Silhouette> = {
  'a-line': 'aline',
  'straight-cut': 'straight',
  anarkali: 'anarkali',
  'c-cut': 'aline',
  flared: 'flared',
  'high-low': 'highlow',
  'tail-cut': 'highlow',
  'shirt-style': 'straight',
  pakistani: 'anarkali',
  angrakha: 'aline',
  'floor-length': 'anarkali',
  'indo-western': 'flared',
};

const CHUDI_SLEEVE_VISUALS: Record<string, SleeveStyle> = {
  butterfly: 'bell',
  pleated: 'puff',
  split: 'short',
  'sheer-puff': 'puff',
  blouson: 'puff',
  tie: 'short',
  'double-flounce': 'bell',
  tulip: 'bell',
  lantern: 'puff',
  ruched: 'short',
  cape: 'cap',
  'leg-of-mutton': 'puff',
  'slit-bell': 'bell',
  eyelet: 'short',
  'cut-out': 'short',
  smocked: 'puff',
  tiered: 'bell',
  trumpet: 'bell',
};

interface StyleVisual {
  neckline?: Neckline | undefined;
  sleeveStyle?: SleeveStyle | undefined;
  silhouette?: Silhouette | undefined;
  styleLabel?: string | undefined;
}

function buildStyleVisual(
  productId: string | undefined,
  config: ProductStyleConfig | undefined,
  selections: Record<string, SectionSelection>,
): StyleVisual {
  if (!productId || !config) return {};

  if (productId === 'blouse') {
    const sel = selections['style'];
    if (!sel) return {};
    const option = config.sections[0]?.options.find((o) => o.id === sel.optionId);
    const subOption = option?.subOptions?.find((s) => s.id === sel.subOptionId);
    const visual = sel.optionId ? BLOUSE_STYLE_VISUALS[sel.optionId] : undefined;
    return {
      ...visual,
      styleLabel: subOption?.label ?? option?.label,
    };
  }

  if (productId === 'chudidhar') {
    const kurtaSel = selections['kurta-type'];
    const sleeveSel = selections['sleeve-design'];
    const kurtaSection = config.sections.find((s) => s.id === 'kurta-type');
    const sleeveSection = config.sections.find((s) => s.id === 'sleeve-design');
    const kurtaLabel = kurtaSection?.options.find((o) => o.id === kurtaSel?.optionId)?.label;
    const sleeveLabel = sleeveSection?.options.find((o) => o.id === sleeveSel?.optionId)?.label;
    const styleLabel = [kurtaLabel, sleeveLabel].filter(Boolean).join(' · ') || undefined;

    return {
      silhouette: kurtaSel ? CHUDI_KURTA_SILHOUETTES[kurtaSel.optionId] : undefined,
      sleeveStyle: sleeveSel ? CHUDI_SLEEVE_VISUALS[sleeveSel.optionId] : undefined,
      styleLabel,
    };
  }

  return {};
}

export default function ProductStyle() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fabric = (location.state as IncomingStyleState | null)?.fabric ?? null;

  const config = productId ? PRODUCT_STYLES[productId] : undefined;
  const measurementSuffix = productId ? PRODUCT_TO_SECTION[productId] : undefined;
  const measurementSection = measurementSuffix
    ? MEASUREMENT_SECTIONS.find((s) => s.storageSuffix === measurementSuffix)
    : undefined;

  const [selections, setSelections] = useState<Record<string, SectionSelection>>({});
  const [expanded, setExpanded] = useState<Record<string, string | null>>({});
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>(() =>
    measurementSection ? emptyValues(measurementSection.fields) : {},
  );
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [referenceImageError, setReferenceImageError] = useState<string | null>(null);

  // Load this product's own saved measurements (if any) so returning to
  // the same item shows what was entered before — never the other
  // products' data.
  useEffect(() => {
    if (!measurementSection) {
      setMeasurementValues({});
      return;
    }
    const measurementsKey = `jojo_measurements_${user?.username ?? 'guest'}`;
    const raw = localStorage.getItem(measurementsKey);
    if (raw) {
      try {
        const all = JSON.parse(raw) as Record<string, Record<string, string>>;
        setMeasurementValues({
          ...emptyValues(measurementSection.fields),
          ...(all[measurementSection.storageSuffix] ?? {}),
        });
        return;
      } catch {
        // fall through to reset below
      }
    }
    setMeasurementValues(emptyValues(measurementSection.fields));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementSection?.storageSuffix, user?.username]);

  // Load this product's own saved reference image (if any), keyed by
  // productId so Blouse/Chudidhar/etc. each keep their own photo,
  // mirroring the measurements load pattern above.
  useEffect(() => {
    setReferenceImageError(null);
    if (!productId) {
      setReferenceImage(null);
      return;
    }
    const referenceImagesKey = `jojo_reference_images_${user?.username ?? 'guest'}`;
    const raw = localStorage.getItem(referenceImagesKey);
    if (raw) {
      try {
        const all = JSON.parse(raw) as Record<string, ReferenceImage>;
        setReferenceImage(all[productId] ?? null);
        return;
      } catch {
        // fall through to reset below
      }
    }
    setReferenceImage(null);
  }, [productId, user?.username]);

  if (!productId || !config) {
    return (
      <div className="w-full min-h-screen bg-[#F6F1E7] px-6 pt-16 pb-16 flex items-center justify-center text-center">
        <div>
          <p className="text-[#4A413B] mb-4">We couldn't find that product.</p>
          <Link
            to="/custom-outfit"
            className="inline-flex items-center gap-2 text-[#5C1A32] font-semibold text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Custom Outfit
          </Link>
        </div>
      </div>
    );
  }

  const handleOptionClick = (section: StyleSection, option: StyleOption) => {
    if (option.subOptions?.length) {
      setExpanded((prev) => ({
        ...prev,
        [section.id]: prev[section.id] === option.id ? null : option.id,
      }));
      setSelections((prev) => ({
        ...prev,
        [section.id]: { optionId: option.id, subOptionId: null },
      }));
    } else {
      setExpanded((prev) => ({ ...prev, [section.id]: null }));
      setSelections((prev) => ({
        ...prev,
        [section.id]: { optionId: option.id, subOptionId: null },
      }));
    }
  };

  const handleSubOptionClick = (
    section: StyleSection,
    option: StyleOption,
    subOption: StyleSubOption,
  ) => {
    setSelections((prev) => ({
      ...prev,
      [section.id]: { optionId: option.id, subOptionId: subOption.id },
    }));
  };

  // Shared by every keystroke and by handleContinue: merges this
  // product's measurement values into the shared storage object (other
  // products' saved values are left untouched) and notifies the sidebar.
  const persistMeasurements = (nextValues: Record<string, string>) => {
    if (!measurementSection) return;
    const measurementsKey = `jojo_measurements_${user?.username ?? 'guest'}`;
    const raw = localStorage.getItem(measurementsKey);
    let all: Record<string, Record<string, string>> = {};
    try {
      all = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
    } catch {
      all = {};
    }
    all[measurementSection.storageSuffix] = nextValues;
    localStorage.setItem(measurementsKey, JSON.stringify(all));
    window.dispatchEvent(new Event(MEASUREMENTS_UPDATED_EVENT));
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurementValues((prev) => {
      const next = { ...prev, [key]: value };
      // Save + notify on every keystroke so MeasurementSidebar (and the
      // MannequinPreview below) reflect changes live, not just after
      // "Continue to Accessories".
      persistMeasurements(next);
      return next;
    });
  };

  // Saves this product's reference image into the shared reference-image
  // storage object, keyed by productId — other products' saved photos
  // are left untouched, same approach as persistMeasurements.
  const persistReferenceImage = (next: ReferenceImage | null) => {
    if (!productId) return;
    const referenceImagesKey = `jojo_reference_images_${user?.username ?? 'guest'}`;
    const raw = localStorage.getItem(referenceImagesKey);
    let all: Record<string, ReferenceImage> = {};
    try {
      all = raw ? (JSON.parse(raw) as Record<string, ReferenceImage>) : {};
    } catch {
      all = {};
    }
    if (next) {
      all[productId] = next;
    } else {
      Reflect.deleteProperty(all, productId);
    }
    localStorage.setItem(referenceImagesKey, JSON.stringify(all));
  };

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setReferenceImageError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setReferenceImageError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      setReferenceImageError('Image is too large — please keep it under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setReferenceImageError("Couldn't read that image — please try again.");
        return;
      }
      const next: ReferenceImage = {
        dataUrl: reader.result,
        fileName: file.name,
      };
      setReferenceImage(next);
      persistReferenceImage(next);
    };
    reader.onerror = () => {
      setReferenceImageError("Couldn't read that image — please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageError(null);
    persistReferenceImage(null);
  };

  const isSectionComplete = (section: StyleSection) => {
    const sel = selections[section.id];
    if (!sel) return false;
    const opt = section.options.find((o) => o.id === sel.optionId);
    if (opt?.subOptions?.length) return Boolean(sel.subOptionId);
    return true;
  };

  const isComplete = config.sections.every(isSectionComplete);
  const sectionHasSubOptions = (section: StyleSection) =>
    section.options.some((o) => o.subOptions?.length);

  const handleContinue = () => {
    if (!isComplete || !productId) return;

    // Save just this product's measurement values, merged into the
    // shared measurements object the sidebar reads from — the other
    // products' saved values are left untouched.
    persistMeasurements(measurementValues);

    const resolvedSelections = config.sections.map((section) => {
      const sel = selections[section.id];
      const option = section.options.find((o) => o.id === sel.optionId) ?? null;
      const subOption = option?.subOptions?.find((s) => s.id === sel.subOptionId) ?? null;
      return {
        sectionId: section.id,
        sectionLabel: section.label,
        optionId: option?.id ?? null,
        optionLabel: option?.label ?? null,
        subOptionId: subOption?.id ?? null,
        subOptionLabel: subOption?.label ?? null,
      };
    });

    void navigate(`/custom-outfit/${productId}/accessories`, {
      state: {
        productId,
        productName: config.name,
        selections: resolvedSelections,
        measurementValues,
        referenceImage,
        fabric,
      },
    });
  };

  const previewMeasurements = buildPreviewMeasurements(
    measurementSection?.storageSuffix,
    measurementValues,
  );
  const styleVisual = buildStyleVisual(productId, config, selections);

  return (
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] px-6 pt-16 pb-12">
      <div className="max-w-3xl mx-auto pt-10">
        <Link
          to="/custom-outfit"
          className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl md:text-4xl text-[#1B1512] mb-2" style={serif}>
          {config.name} Styles
        </h1>
        <p className="text-[#4A413B] mb-10">
          Choose the style you'd like for your {config.name.toLowerCase()}.
        </p>

        <div className="flex flex-col gap-10">
          {config.sections.map((section) => {
            const sel: SectionSelection | undefined = selections[section.id];
            const usesAccordion = sectionHasSubOptions(section);

            return (
              <div key={section.id}>
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
                  {section.label}
                </h2>

                {usesAccordion ? (
                  <div className="flex flex-col gap-3">
                    {section.options.map((option) => {
                      const isSelected = option.id === sel?.optionId;
                      const isExpanded = option.id === expanded[section.id];
                      const isOnlySelectedAsParent =
                        isSelected && option.subOptions?.length && !sel.subOptionId;

                      return (
                        <div
                          key={option.id}
                          className={`rounded-sm border transition-colors ${
                            isSelected
                              ? 'border-[#5C1A32]'
                              : 'border-[#5C1A32]/12 hover:border-[#5C1A32]/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleOptionClick(section, option);
                            }}
                            aria-pressed={isSelected && !option.subOptions?.length}
                            className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-sm text-left ${
                              isSelected && !option.subOptions?.length
                                ? 'bg-[#5C1A32] text-[#F6F1E7]'
                                : 'bg-white text-[#1B1512]'
                            }`}
                          >
                            <span className="flex items-center gap-2 font-medium text-sm">
                              {isSelected && !option.subOptions?.length && (
                                <Check className="h-4 w-4" />
                              )}
                              {option.label}
                              {isOnlySelectedAsParent && (
                                <span className="text-xs font-normal text-[#5C1A32]/70">
                                  (select an option below)
                                </span>
                              )}
                            </span>
                            {option.subOptions?.length ? (
                              <ChevronDown
                                className={`h-4 w-4 text-[#4A413B]/50 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            ) : null}
                          </button>

                          {option.subOptions?.length && isExpanded ? (
                            <div className="flex flex-col gap-2 px-5 pb-4">
                              {option.subOptions.map((sub) => {
                                const isSubSelected = sub.id === sel?.subOptionId;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      handleSubOptionClick(section, option, sub);
                                    }}
                                    aria-pressed={isSubSelected}
                                    className={`flex items-center gap-2 text-left text-sm px-4 py-2.5 rounded-sm border ${
                                      isSubSelected
                                        ? 'bg-[#5C1A32]/8 border-[#5C1A32] text-[#5C1A32] font-semibold'
                                        : 'bg-white border-[#5C1A32]/12 text-[#4A413B] hover:border-[#5C1A32]/30'
                                    }`}
                                  >
                                    {isSubSelected && <Check className="h-3.5 w-3.5" />}
                                    {sub.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {section.options.map((option) => {
                      const isSelected = option.id === sel?.optionId;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            handleOptionClick(section, option);
                          }}
                          aria-pressed={isSelected}
                          className={`flex items-center gap-2 text-left text-sm px-4 py-3 rounded-sm border transition-colors ${
                            isSelected
                              ? 'bg-[#5C1A32] border-[#5C1A32] text-[#F6F1E7] font-semibold'
                              : 'bg-white border-[#5C1A32]/12 text-[#2A211D] hover:border-[#5C1A32]/30'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Only this product's measurement fields show here — Blouse
              fields for Blouse, Chudi fields for Chudidhar, and so on.
              MannequinPreview sits alongside and reacts live both to the
              measurement values and to whichever style options above are
              selected. */}
          {measurementSection ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="h-4 w-4 text-[#B8935A]" />
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                  {config.name} Measurements
                </h2>
              </div>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
                  {measurementSection.fields.map((field, idx) => (
                    <label key={field.key} className="flex flex-col gap-1.5">
                      <span className="text-xs text-[#4A413B]">
                        {idx + 1}. {field.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          placeholder="0.0"
                          value={measurementValues[field.key] ?? ''}
                          onChange={(e) => {
                            handleMeasurementChange(field.key, e.target.value);
                          }}
                          className="w-full rounded-sm border border-[#5C1A32]/20 px-2 py-1.5 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] bg-white"
                        />
                        <span className="text-xs text-[#4A413B]/60 shrink-0">in</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="lg:w-64 shrink-0">
                  <MannequinPreview
                    title={`${config.name} Preview`}
                    {...previewMeasurements}
                    {...styleVisual}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Reference photo — optional image the client can attach so
              the stitching employee has something visual to match
              alongside the style selections and measurements above. */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImagePlus className="h-4 w-4 text-[#B8935A]" />
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                Reference Photo
              </h2>
              <span className="text-xs font-normal text-[#4A413B]/60 normal-case tracking-normal">
                (optional)
              </span>
            </div>

            {referenceImage ? (
              <div className="flex items-center gap-4 rounded-sm border border-[#5C1A32]/12 bg-white p-4">
                <img
                  src={referenceImage.dataUrl}
                  alt="Reference upload preview"
                  className="h-24 w-24 rounded-sm object-cover border border-[#5C1A32]/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1B1512] truncate">
                    {referenceImage.fileName}
                  </p>
                  <p className="text-xs text-[#4A413B]/60 mt-0.5">
                    Attached for the tailoring team to reference.
                  </p>
                  <label
                    htmlFor="reference-image-input"
                    className="inline-block mt-2 text-xs font-semibold text-[#5C1A32] cursor-pointer hover:underline"
                  >
                    Replace photo
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveReferenceImage}
                  aria-label="Remove reference photo"
                  className="h-8 w-8 shrink-0 rounded-full border border-[#5C1A32]/20 text-[#5C1A32] flex items-center justify-center hover:bg-[#5C1A32]/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="reference-image-input"
                className="flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-[#5C1A32]/20 bg-white px-6 py-8 text-center cursor-pointer hover:border-[#5C1A32]/40 transition-colors"
              >
                <span className="h-10 w-10 rounded-full bg-[#5C1A32]/8 text-[#5C1A32] flex items-center justify-center">
                  <ImagePlus className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-[#1B1512]">
                  Click to upload a reference photo
                </span>
                <span className="text-xs text-[#4A413B]/60">JPG, PNG, or WEBP · up to 4MB</span>
              </label>
            )}

            <input
              id="reference-image-input"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleReferenceImageChange}
              className="sr-only"
            />

            {referenceImageError && (
              <p className="text-xs text-red-600 mt-2">{referenceImageError}</p>
            )}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!isComplete}
            className={`inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full transition-colors ${
              isComplete
                ? 'bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32]'
                : 'bg-[#5C1A32]/10 text-[#4A413B]/50 cursor-not-allowed'
            }`}
          >
            Continue to Accessories
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
