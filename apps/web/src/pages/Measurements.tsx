import { useState, useEffect } from "react";
import { Ruler, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MEASUREMENTS_UPDATED_EVENT } from "../components/MeasurementSidebar";
import BodyTypeSelector from "../components/BodyTypeSelector";

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx / CustomOutfit.tsx / ProductStyle.tsx / ProductAccessories.tsx / ProductSummary.tsx / Address.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for the page title.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

type MeasurementValues = Record<string, string>;

interface FieldDef {
  key: string;
  label: string;
}

const BLOUSE_FIELDS: FieldDef[] = [
  { key: "height", label: "Height" },
  { key: "upperChest", label: "Upper Chest" },
  { key: "centerChest", label: "Center Chest" },
  { key: "waistRound", label: "Waist Round" },
  { key: "sleeveLength", label: "Sleeve Length" },
  { key: "sleeveRound", label: "Sleeve Round" },
  { key: "midHand", label: "Mid Hand" },
  { key: "armRound", label: "Arm Round" },
  { key: "frontNeck", label: "Front Neck" },
  { key: "backNeck", label: "Back Neck" },
  { key: "fullShoulder", label: "Full Shoulder" },
  { key: "shoulderWidth", label: "Shoulder Width" },
  { key: "centerDot", label: "Center Dot" },
];

const CHUDI_FIELDS: FieldDef[] = [
  { key: "height", label: "Height" },
  { key: "chest", label: "Chest" },
  { key: "waistHeight", label: "Waist Height" },
  { key: "waistRound", label: "Waist Round" },
  { key: "sleeveLength", label: "Sleeve Length" },
  { key: "sleeveRound", label: "Sleeve Round" },
  { key: "midHand", label: "Mid Hand" },
  { key: "armRound", label: "Arm Round" },
  { key: "frontNeck", label: "Front Neck" },
  { key: "backNeck", label: "Back Neck" },
  { key: "fullShoulder", label: "Full Shoulder" },
  { key: "shoulderWidth", label: "Shoulder Width" },
  { key: "seatLoose", label: "Seat Loose" },
  { key: "slitOpenFTop", label: "Slit Open f Top" },
];

const PANT_FIELDS: FieldDef[] = [
  { key: "height", label: "Height" },
  { key: "hipRound", label: "Hip Round" },
  { key: "seatRound", label: "Seat Round" },
  { key: "kneeRound", label: "Knee Round" },
  { key: "thighRound", label: "Thigh Round" },
  { key: "legRound", label: "Leg Round" },
  { key: "croch", label: "Croch" },
];

const SECTIONS: { title: string; storageSuffix: string; fields: FieldDef[] }[] = [
  { title: "Blouse", storageSuffix: "blouse", fields: BLOUSE_FIELDS },
  { title: "Chudi", storageSuffix: "chudi", fields: CHUDI_FIELDS },
  { title: "Pant", storageSuffix: "pant", fields: PANT_FIELDS },
];

function emptyValues(fields: FieldDef[]): MeasurementValues {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}

export default function MeasurementPage() {
  const { user } = useAuth();

  const storageKey = `jojo_measurements_${user?.username ?? "guest"}`;

  const [values, setValues] = useState<Record<string, MeasurementValues>>(() => ({
    blouse: emptyValues(BLOUSE_FIELDS),
    chudi: emptyValues(CHUDI_FIELDS),
    pant: emptyValues(PANT_FIELDS),
  }));
  const [saved, setSaved] = useState(false);

 useEffect(() => {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    setValues(JSON.parse(raw) as Record<string, MeasurementValues>);
  }
}, [storageKey]);

  const handleChange = (section: string, fieldKey: string, val: string) => {
    if (val !== "" && !/^\d*\.?\d*$/.test(val)) return;
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [fieldKey]: val },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(values));
    setSaved(true);
    // Let the persistent sidebar (mounted in App.tsx) know it should re-read localStorage.
    window.dispatchEvent(new Event(MEASUREMENTS_UPDATED_EVENT));
  };

  return (
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
      <section className="w-full px-6 pt-10 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="h-6 w-6 text-[#5C1A32]" />
            <h1 className="text-4xl text-[#1B1512]" style={serif}>
              Product Measurement Details
            </h1>
          </div>
          <p className="text-[#4A413B]">
            Welcome{user ? `, ${user.username}` : ""} — enter your measurements in inches
          </p>
        </div>
      </section>

      <section className="w-full px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <BodyTypeSelector />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {SECTIONS.map((section) => (
              <div
                key={section.storageSuffix}
                className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#5C1A32]/10">
                  <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                    {section.title}
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {section.fields.map((field, idx) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-semibold text-[#B8935A]">
                        {idx + 1}
                      </span>
                      <label className="flex-1 text-sm text-[#2A211D]">
                        {field.label}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={values[section.storageSuffix]?.[field.key] ?? ""}
                          onChange={(e) =>
                            { handleChange(section.storageSuffix, field.key, e.target.value); }
                          }
                          className="w-16 rounded-sm border border-[#5C1A32]/20 px-2 py-1.5 text-sm text-[#1B1512] text-center focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40 focus:border-[#5C1A32]"
                          placeholder="0.0"
                        />
                        <span className="text-xs text-[#4A413B]/60">in</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold py-3 px-6 hover:bg-[#5C1A32] transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Measurements
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}