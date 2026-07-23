import { useState, useEffect } from "react";
import { Ruler, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
  };

  return (
    <div className="w-full">
      <section className="w-full px-6 py-14 bg-rose-50/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="h-6 w-6 text-fuchsia-800" />
            <h1 className="text-4xl font-serif font-bold text-gray-900">
              Product Measurement Details
            </h1>
          </div>
          <p className="text-gray-500">
            Welcome{user ? `, ${user.username}` : ""} — enter your measurements in inches
          </p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {SECTIONS.map((section) => (
              <div
                key={section.storageSuffix}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-xs font-bold tracking-wide text-gray-800">
                    {section.title.toUpperCase()}
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {section.fields.map((field, idx) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-semibold text-gray-400">
                        {idx + 1}
                      </span>
                      <label className="flex-1 text-sm text-gray-700">
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
                          className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                          placeholder="0.0"
                        />
                        <span className="text-xs text-gray-400">in</span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 px-6 hover:opacity-95 transition-opacity"
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