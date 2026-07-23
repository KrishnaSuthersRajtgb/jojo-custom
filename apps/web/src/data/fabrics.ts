export type Tone = "warm" | "cool" | "neutral";

export interface Fabric {
  id: string;
  name: string;
  tone: Tone;
  hex: string;
  material: string;
  pricePerMeter: number;
  description: string;
}

export interface ToneInfo {
  key: Tone;
  label: string;
  desc: string;
  swatches: string[];
}

export const TONES: ToneInfo[] = [
  {
    key: "warm",
    label: "Warm",
    desc: "Reds · Golds · Maroons",
    swatches: ["#7a1f2b", "#b5822a", "#a13f5c"],
  },
  {
    key: "cool",
    label: "Cool",
    desc: "Blues · Teals · Purples",
    swatches: ["#2c5f8a", "#3a7ca5", "#3d6b8a"],
  },
  {
    key: "neutral",
    label: "Neutral",
    desc: "Whites · Beiges · Grays",
    swatches: ["#cfc6bc", "#a8998a", "#e8e2d8"],
  },
];

// Full material catalogue for filtering — not every material has stock yet,
// selecting one with 0 fabrics will simply show the empty state.
export const MATERIALS: string[] = [
  "Cotton",
  "Organic Cotton",
  "Khadi",
  "Linen",
  "Cotton Linen",
  "Rayon",
  "Viscose",
  "Modal",
  "Tencel",
  "Polyester",
  "Poly Cotton",
  "Cotton Silk",
  "Silk",
  "Raw Silk",
  "Banarasi Silk",
  "Kanchipuram Silk",
  "Tussar Silk",
  "Chanderi",
  "Maheshwari",
  "Kota Doria",
  "Georgette",
  "Chiffon",
  "Crepe",
  "Satin",
  "Organza",
  "Net",
  "Velvet",
  "Brocade",
  "Jacquard",
  "Tissue",
  "Muslin",
  "Cambric",
  "Poplin",
  "Denim",
];

// NOTE: hex values below are close visual approximations of the reference
// palettes (Warm undertones / Cool Summer / Neutral tone wheel). They are
// not pixel-sampled from the source images — swap in exact hex codes via
// an eyedropper tool (Figma, Photoshop, or imagecolorpicker.com) if precise
// brand-accurate matching is required.
export const FABRICS: Fabric[] = [
  // ---------------- WARM ----------------
  { id: "f1", name: "Maroon Silk", tone: "warm", hex: "#7a1f2b", material: "Silk", pricePerMeter: 650, description: "Rich, lustrous silk with a deep maroon depth" },
  { id: "f2", name: "Antique Gold Georgette", tone: "warm", hex: "#b5822a", material: "Georgette", pricePerMeter: 480, description: "Lightweight georgette with a warm golden shimmer" },
  { id: "f3", name: "Rani Pink Cotton", tone: "warm", hex: "#a13f5c", material: "Cotton", pricePerMeter: 320, description: "Breathable cotton in a vibrant rani pink" },
  { id: "f10", name: "Crimson Red Silk", tone: "warm", hex: "#b3122e", material: "Silk", pricePerMeter: 680, description: "Bold crimson silk with a warm red undertone" },
  { id: "f11", name: "Burnt Orange Georgette", tone: "warm", hex: "#cc5500", material: "Georgette", pricePerMeter: 470, description: "Vivid burnt orange with a flowing drape" },
  { id: "f12", name: "Coral Pink Cotton", tone: "warm", hex: "#e8735c", material: "Cotton", pricePerMeter: 310, description: "Soft coral cotton with a sun-warmed glow" },
  { id: "f13", name: "Mustard Yellow Linen", tone: "warm", hex: "#d4a017", material: "Linen", pricePerMeter: 520, description: "Earthy mustard linen with natural texture" },
  { id: "f14", name: "Olive Green Khadi", tone: "warm", hex: "#6b6b2a", material: "Khadi", pricePerMeter: 380, description: "Handspun khadi in a muted olive green" },
  { id: "f15", name: "Terracotta Chanderi", tone: "warm", hex: "#b1562f", material: "Chanderi", pricePerMeter: 560, description: "Sheer chanderi with a warm terracotta hue" },
  { id: "f16", name: "Deep Brown Raw Silk", tone: "warm", hex: "#4a2e1f", material: "Raw Silk", pricePerMeter: 610, description: "Textured raw silk in a deep earthy brown" },

  // ---------------- COOL ----------------
  { id: "f4", name: "Royal Blue Silk", tone: "cool", hex: "#2c5f8a", material: "Silk", pricePerMeter: 700, description: "Premium silk with a deep royal blue finish" },
  { id: "f5", name: "Teal Georgette", tone: "cool", hex: "#3a7ca5", material: "Georgette", pricePerMeter: 460, description: "Crisp structured georgette with subtle sheen" },
  { id: "f6", name: "Slate Purple Cotton", tone: "cool", hex: "#3d6b8a", material: "Cotton", pricePerMeter: 340, description: "Soft cotton in a muted slate purple" },
  { id: "f17", name: "Slate Navy Georgette", tone: "cool", hex: "#2e4053", material: "Georgette", pricePerMeter: 465, description: "Deep navy georgette with a cool slate cast" },
  { id: "f18", name: "Charcoal Grey Poplin", tone: "cool", hex: "#36454f", material: "Poplin", pricePerMeter: 350, description: "Structured poplin in a cool charcoal grey" },
  { id: "f19", name: "Raspberry Pink Crepe", tone: "cool", hex: "#c2185b", material: "Crepe", pricePerMeter: 500, description: "Fluid crepe in a bold cool-toned raspberry" },
  { id: "f20", name: "Fuchsia Chiffon", tone: "cool", hex: "#d6336c", material: "Chiffon", pricePerMeter: 490, description: "Sheer chiffon in a vivid cool fuchsia" },
  { id: "f21", name: "Mint Green Organza", tone: "cool", hex: "#7fc9a3", material: "Organza", pricePerMeter: 540, description: "Crisp organza with a fresh cool mint tone" },
  { id: "f22", name: "Periwinkle Net", tone: "cool", hex: "#8fa3d1", material: "Net", pricePerMeter: 420, description: "Delicate net fabric in a soft periwinkle blue" },
  { id: "f23", name: "Plum Purple Satin", tone: "cool", hex: "#5b2a5e", material: "Satin", pricePerMeter: 580, description: "Smooth satin with a rich cool plum shade" },
  { id: "f24", name: "Sky Blue Muslin", tone: "cool", hex: "#7ec8e3", material: "Muslin", pricePerMeter: 280, description: "Airy muslin in a light cool sky blue" },

  // ---------------- NEUTRAL ----------------
  { id: "f7", name: "Ivory Silk", tone: "neutral", hex: "#e8e2d8", material: "Silk", pricePerMeter: 620, description: "Elegant ivory silk with a soft natural drape" },
  { id: "f8", name: "Warm Beige Cotton", tone: "neutral", hex: "#a8998a", material: "Cotton", pricePerMeter: 300, description: "Everyday cotton in a warm neutral beige" },
  { id: "f9", name: "Soft Grey Georgette", tone: "neutral", hex: "#cfc6bc", material: "Georgette", pricePerMeter: 440, description: "Delicate georgette in a soft dove grey" },
  { id: "f25", name: "Taupe Linen", tone: "neutral", hex: "#b7a99a", material: "Linen", pricePerMeter: 510, description: "Natural linen in an understated taupe" },
  { id: "f26", name: "Stone Poplin", tone: "neutral", hex: "#ada393", material: "Poplin", pricePerMeter: 340, description: "Everyday poplin in a muted stone shade" },
  { id: "f27", name: "Oatmeal Modal", tone: "neutral", hex: "#ded0b6", material: "Modal", pricePerMeter: 460, description: "Soft-draping modal in a warm oatmeal tone" },
  { id: "f28", name: "Dove Grey Tencel", tone: "neutral", hex: "#c9c5bd", material: "Tencel", pricePerMeter: 490, description: "Silky tencel with a calm dove grey finish" },
  { id: "f29", name: "Sand Khadi", tone: "neutral", hex: "#cbb994", material: "Khadi", pricePerMeter: 370, description: "Handwoven khadi in a soft sandy neutral" },
  { id: "f30", name: "Mushroom Viscose", tone: "neutral", hex: "#a89f91", material: "Viscose", pricePerMeter: 400, description: "Fluid viscose in a subtle mushroom hue" },
];

export interface GarmentType {
  id: string;
  label: string;
  defaultMeters: number;
}

export const GARMENT_TYPES: GarmentType[] = [
  { id: "blouse", label: "Blouse", defaultMeters: 1 },
  { id: "chudidhar", label: "Chudidhar", defaultMeters: 2.5 },
  { id: "frocks", label: "Frocks", defaultMeters: 3 },
  { id: "lehanga", label: "Lehanga", defaultMeters: 6 },
  { id: "rts-saree", label: "Ready to Wear Saree", defaultMeters: 6 },
  { id: "pant", label: "Pant", defaultMeters: 1.5 },
  { id: "overcoat", label: "Over Coat", defaultMeters: 3.5 },
];