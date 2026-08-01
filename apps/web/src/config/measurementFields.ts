// Shared measurement field definitions, used by both MeasurementSidebar
// (which always shows all sections) and ProductStyle (which shows only
// the section matching the product currently being customized).

export interface FieldDef {
  key: string;
  label: string;
}

export const BLOUSE_FIELDS: FieldDef[] = [
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

export const CHUDI_FIELDS: FieldDef[] = [
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

export const PANT_FIELDS: FieldDef[] = [
  { key: "height", label: "Height" },
  { key: "hipRound", label: "Hip Round" },
  { key: "seatRound", label: "Seat Round" },
  { key: "kneeRound", label: "Knee Round" },
  { key: "thighRound", label: "Thigh Round" },
  { key: "legRound", label: "Leg Round" },
  { key: "croch", label: "Croch" },
];

export interface MeasurementSection {
  title: string;
  storageSuffix: string;
  fields: FieldDef[];
}

export const MEASUREMENT_SECTIONS: MeasurementSection[] = [
  { title: "Blouse", storageSuffix: "blouse", fields: BLOUSE_FIELDS },
  { title: "Chudi", storageSuffix: "chudi", fields: CHUDI_FIELDS },
  { title: "Pant", storageSuffix: "pant", fields: PANT_FIELDS },
];

// Maps the productId used in CustomOutfit/ProductStyle routes to the
// measurement section it should use. Add an entry whenever a new
// product gets its own measurement fields (Frocks, Lehanga, etc).
export const PRODUCT_TO_SECTION: Record<string, string> = {
  blouse: "blouse",
  chudidhar: "chudi",
  pant: "pant",
};

export function emptyValues(fields: FieldDef[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}