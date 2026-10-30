// ── Atelier Garment Items & Sub-Division Style Service ───────────────────────
// Manages customizable garments (Blouse, Chudidhar, Frocks, Lehanga, etc. + custom admin items)
// and their sub-divisions (style sections, options, sub-options) along with individual tailoring amounts.

import { pricingApi } from './api';

export interface StyleSubOption {
  id: string;
  label: string;
  tailoringPrice: number; // Stitching fee / additional tailoring charge for this sub-option (in INR)
  referenceImageUrl?: string;
}

export interface StyleOption {
  id: string;
  label: string;
  tailoringPrice: number; // Stitching fee / additional tailoring charge for this option (in INR)
  referenceImageUrl?: string;
  subOptions?: StyleSubOption[];
}

export interface StyleSection {
  id: string;
  label: string;
  options: StyleOption[];
}

export interface GarmentItem {
  id: string;
  label: string;
  defaultMeters: number;
  baseTailoringPrice: number; // Base stitching charge for this garment item
  description?: string;
  measurementProfile?: 'blouse' | 'chudi' | 'pant';
  sections: StyleSection[];
  isCustom?: boolean;
}

export interface SelectedStyleOption {
  sectionId?: string;
  sectionLabel: string;
  optionId?: string | null;
  optionLabel: string | null;
  subOptionId?: string | null;
  subOptionLabel: string | null;
  tailoringPrice?: number;
}

export const GARMENTS_STORAGE_KEY = 'jojo_garments_catalog_v2';
export const GARMENTS_UPDATED_EVENT = 'jojo_garments_catalog_updated';

// ── Factory Default Garments and Sub-Divisions Seed ─────────────────────────
export const DEFAULT_GARMENTS: GarmentItem[] = [
  {
    id: 'blouse',
    label: 'Blouse',
    defaultMeters: 1,
    baseTailoringPrice: 450,
    description: 'Fitted, princess cut or designer-back blouses tailored to your size.',
    measurementProfile: 'blouse',
    sections: [
      {
        id: 'style',
        label: 'Blouse Style',
        options: [
          {
            id: 'darted',
            label: 'Darted Blouse',
            tailoringPrice: 0,
            subOptions: [
              { id: '2-dart', label: '2 Dart Blouse', tailoringPrice: 50 },
              { id: '3-dart', label: '3 Dart Blouse', tailoringPrice: 100 },
              { id: '4-dart', label: '4 Dart Blouse', tailoringPrice: 150 },
            ],
          },
          { id: 'princess-cut', label: 'Princess Cut Blouse', tailoringPrice: 250 },
          { id: 'katori-cut', label: 'Katori Cut Blouse', tailoringPrice: 300 },
          { id: 'customized', label: 'Customized Design', tailoringPrice: 450 },
        ],
      },
    ],
  },
  {
    id: 'chudidhar',
    label: 'Chudidhar',
    defaultMeters: 2.5,
    baseTailoringPrice: 650,
    description: 'Classic or Anarkali-style sets stitched to measure with custom sleeves.',
    measurementProfile: 'chudi',
    sections: [
      {
        id: 'kurta-type',
        label: 'Kurta Type',
        options: [
          { id: 'a-line', label: 'A-Line Kurta', tailoringPrice: 150 },
          { id: 'straight-cut', label: 'Straight Cut Kurta', tailoringPrice: 100 },
          { id: 'anarkali', label: 'Anarkali Kurta', tailoringPrice: 450 },
          { id: 'c-cut', label: 'C-Cut Kurta', tailoringPrice: 200 },
          { id: 'flared', label: 'Flared Kurta', tailoringPrice: 300 },
          { id: 'high-low', label: 'High-Low Kurta', tailoringPrice: 250 },
          { id: 'tail-cut', label: 'Tail Cut Kurta', tailoringPrice: 250 },
          { id: 'shirt-style', label: 'Shirt Style Kurta', tailoringPrice: 300 },
          { id: 'pakistani', label: 'Pakistani Kurta', tailoringPrice: 400 },
          { id: 'angrakha', label: 'Angrakha Kurta', tailoringPrice: 350 },
          { id: 'floor-length', label: 'Floor-Length Kurta', tailoringPrice: 500 },
          { id: 'indo-western', label: 'Indo-Western Kurta', tailoringPrice: 450 },
        ],
      },
      {
        id: 'sleeve-design',
        label: 'Sleeve Design',
        options: [
          { id: 'butterfly', label: 'Butterfly Sleeve', tailoringPrice: 150 },
          { id: 'pleated', label: 'Pleated Sleeve', tailoringPrice: 180 },
          { id: 'split', label: 'Split Sleeve', tailoringPrice: 150 },
          { id: 'sheer-puff', label: 'Sheer Puff Sleeve', tailoringPrice: 220 },
          { id: 'blouson', label: 'Blouson Sleeve', tailoringPrice: 200 },
          { id: 'tie', label: 'Tie Sleeve', tailoringPrice: 120 },
          { id: 'double-flounce', label: 'Double Flounce Sleeve', tailoringPrice: 250 },
          { id: 'tulip', label: 'Tulip Sleeve', tailoringPrice: 180 },
          { id: 'lantern', label: 'Lantern Sleeve', tailoringPrice: 200 },
          { id: 'ruched', label: 'Ruched Sleeve', tailoringPrice: 150 },
          { id: 'cape', label: 'Cape Sleeve', tailoringPrice: 300 },
          { id: 'leg-of-mutton', label: 'Leg-of-Mutton Sleeve', tailoringPrice: 280 },
          { id: 'slit-bell', label: 'Slit Bell Sleeve', tailoringPrice: 200 },
          { id: 'eyelet', label: 'Eyelet Sleeve', tailoringPrice: 220 },
          { id: 'cut-out', label: 'Cut-Out Sleeve', tailoringPrice: 180 },
          { id: 'smocked', label: 'Smocked Sleeve', tailoringPrice: 260 },
          { id: 'tiered', label: 'Tiered Sleeve', tailoringPrice: 240 },
          { id: 'trumpet', label: 'Trumpet Sleeve', tailoringPrice: 200 },
        ],
      },
    ],
  },
  {
    id: 'frocks',
    label: 'Frocks',
    defaultMeters: 3,
    baseTailoringPrice: 750,
    description: 'Everyday, skater and party frocks in your choice of fabric.',
    measurementProfile: 'chudi',
    sections: [
      {
        id: 'style',
        label: 'Frock Style',
        options: [
          { id: 'a-line', label: 'A-Line Frock', tailoringPrice: 150 },
          { id: 'anarkali', label: 'Anarkali Frock', tailoringPrice: 350 },
          { id: 'fit-flare', label: 'Fit & Flare Dress', tailoringPrice: 250 },
          { id: 'maxi', label: 'Maxi Dress', tailoringPrice: 300 },
          { id: 'midi', label: 'Midi Dress', tailoringPrice: 200 },
          { id: 'shirt-dress', label: 'Shirt Dress', tailoringPrice: 250 },
          { id: 'wrap-dress', label: 'Wrap Dress', tailoringPrice: 280 },
          { id: 'tiered', label: 'Tiered Dress', tailoringPrice: 320 },
          { id: 'bodycon', label: 'Bodycon Dress', tailoringPrice: 220 },
          { id: 'skater', label: 'Skater Dress', tailoringPrice: 200 },
        ],
      },
    ],
  },
  {
    id: 'lehanga',
    label: 'Lehanga',
    defaultMeters: 6,
    baseTailoringPrice: 1200,
    description: 'Festive bridal and party lehangas with custom flair options.',
    measurementProfile: 'blouse',
    sections: [
      {
        id: 'style',
        label: 'Lehenga Style',
        options: [
          { id: 'a-line', label: 'A-Line Lehenga', tailoringPrice: 300 },
          { id: 'circular-flared', label: 'Circular (Flared) Lehenga', tailoringPrice: 600 },
          { id: 'mermaid-fishtail', label: 'Mermaid (Fishtail) Lehenga', tailoringPrice: 500 },
          { id: 'panelled', label: 'Panelled Lehenga', tailoringPrice: 450 },
          { id: 'straight-cut', label: 'Straight-Cut Lehenga', tailoringPrice: 300 },
          { id: 'jacket', label: 'Jacket Lehenga', tailoringPrice: 550 },
          { id: 'sharara', label: 'Sharara Lehenga', tailoringPrice: 400 },
          { id: 'ruffle', label: 'Ruffle Lehenga', tailoringPrice: 500 },
          { id: 'cape', label: 'Cape Lehenga', tailoringPrice: 450 },
          { id: 'indo-western', label: 'Indo-Western Lehenga', tailoringPrice: 650 },
        ],
      },
    ],
  },
  {
    id: 'ready-to-wear-saree',
    label: 'Ready to Wear Saree',
    defaultMeters: 6,
    baseTailoringPrice: 850,
    description: 'Pre-stitched and ready-pleated sarees, tailored to your exact measurements.',
    measurementProfile: 'blouse',
    sections: [
      {
        id: 'style',
        label: 'Saree Style',
        options: [
          { id: 'pre-stitched', label: 'Pre-Stitched Saree', tailoringPrice: 200 },
          { id: 'ready-pleated', label: 'Ready Pleated Saree', tailoringPrice: 250 },
          { id: 'one-minute', label: 'One-Minute Saree', tailoringPrice: 300 },
          { id: 'pant-style', label: 'Pant Style Saree', tailoringPrice: 400 },
          { id: 'dhoti-style', label: 'Dhoti Style Saree', tailoringPrice: 450 },
          { id: 'gown', label: 'Gown Saree', tailoringPrice: 500 },
          { id: 'lehenga-saree', label: 'Lehenga Saree', tailoringPrice: 450 },
          { id: 'ruffle', label: 'Ruffle Saree', tailoringPrice: 350 },
          { id: 'belted', label: 'Belted Saree', tailoringPrice: 250 },
          { id: 'cape', label: 'Cape Saree', tailoringPrice: 380 },
        ],
      },
    ],
  },
  {
    id: 'pant',
    label: 'Pant',
    defaultMeters: 1.5,
    baseTailoringPrice: 450,
    description: 'Palazzos, cigarette trousers, and salwaars tailored to fit.',
    measurementProfile: 'pant',
    sections: [
      {
        id: 'pant-style',
        label: 'Pant Style',
        options: [
          { id: 'churidar-salwaar', label: 'Churidar Salwaar', tailoringPrice: 100 },
          { id: 'patiala-salwaar', label: 'Patiala Salwaar', tailoringPrice: 150 },
          { id: 'afghani-salwaar', label: 'Afghani Salwaar', tailoringPrice: 180 },
          { id: 'dhoti-salwaar', label: 'Dhoti Salwaar', tailoringPrice: 220 },
          { id: 'tulip-salwaar', label: 'Tulip Salwaar', tailoringPrice: 200 },
          { id: 'palazzo-salwaar', label: 'Palazzo Salwaar', tailoringPrice: 150 },
          { id: 'sharara', label: 'Sharara', tailoringPrice: 250 },
          { id: 'gharara', label: 'Gharara', tailoringPrice: 300 },
          { id: 'straight-cut-salwaar', label: 'Straight-Cut Salwaar', tailoringPrice: 120 },
          { id: 'harem-salwaar', label: 'Harem Salwaar', tailoringPrice: 200 },
          { id: 'balloon-salwaar', label: 'Balloon Salwaar', tailoringPrice: 220 },
          { id: 'parallel-salwaar', label: 'Parallel Salwaar', tailoringPrice: 150 },
        ],
      },
    ],
  },
  {
    id: 'over-coat',
    label: 'Over Coat',
    defaultMeters: 3.5,
    baseTailoringPrice: 1500,
    description: 'Layered over-coats, trenches and blazers tailored for a sharp silhouette.',
    measurementProfile: 'chudi',
    sections: [
      {
        id: 'style',
        label: 'Coat Style',
        options: [
          { id: 'trench', label: 'Trench Coat', tailoringPrice: 500 },
          { id: 'wool-overcoat', label: 'Wool Overcoat', tailoringPrice: 600 },
          { id: 'longline', label: 'Longline Coat', tailoringPrice: 450 },
          { id: 'double-breasted', label: 'Double-Breasted Coat', tailoringPrice: 550 },
          { id: 'single-breasted', label: 'Single-Breasted Coat', tailoringPrice: 400 },
          { id: 'peacoat', label: 'Peacoat', tailoringPrice: 450 },
          { id: 'wrap', label: 'Wrap Coat', tailoringPrice: 350 },
          { id: 'belted', label: 'Belted Coat', tailoringPrice: 350 },
          { id: 'teddy', label: 'Teddy Coat', tailoringPrice: 400 },
          { id: 'faux-fur', label: 'Faux Fur Coat', tailoringPrice: 650 },
        ],
      },
    ],
  },
];

class GarmentStyleService {
  private cache: GarmentItem[] | null = null;
  private isSyncing = false;

  constructor() {
    // Initial sync from remote MongoDB
    if (typeof window !== 'undefined') {
      void this.syncWithRemote();
    }
  }

  public async syncWithRemote(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const res = await pricingApi.get();
      const remoteGarments = res.data.garments as GarmentItem[] | undefined;
      if (Array.isArray(remoteGarments) && remoteGarments.length > 0) {
        this.cache = remoteGarments;
        localStorage.setItem(GARMENTS_STORAGE_KEY, JSON.stringify(remoteGarments));
        window.dispatchEvent(new Event(GARMENTS_UPDATED_EVENT));
      } else {
        // If MongoDB does not have garments yet, seed MongoDB with current local catalog
        const current = this.getGarments();
        await pricingApi.updateGarments(current);
      }
    } catch (e) {
      console.warn('[garmentStyleService] Remote MongoDB sync deferred:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  public getGarments(): GarmentItem[] {
    if (this.cache) return this.cache;
    try {
      const raw = localStorage.getItem(GARMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GarmentItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
          return parsed;
        }
      }
    } catch {
      // fallback to defaults
    }
    this.cache = DEFAULT_GARMENTS;
    this.saveGarments(DEFAULT_GARMENTS);
    return DEFAULT_GARMENTS;
  }

  public getGarment(id: string): GarmentItem | undefined {
    const list = this.getGarments();
    return list.find((g) => g.id.toLowerCase() === id.toLowerCase());
  }

  public saveGarments(items: GarmentItem[]): void {
    this.cache = items;
    try {
      localStorage.setItem(GARMENTS_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event(GARMENTS_UPDATED_EVENT));
    } catch (e) {
      console.error('Failed to save garments to localStorage:', e);
    }

    // Persist asynchronously to MongoDB Atlas
    pricingApi.updateGarments(items).catch((err: unknown) => {
      console.error('Failed to persist garments to MongoDB:', err);
    });
  }

  public addGarment(item: Omit<GarmentItem, 'id'> & { id?: string }): GarmentItem {
    const garments = this.getGarments();
    const id = (
      item.id ||
      item.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    ).slice(0, 40);

    const exists = garments.some((g) => g.id === id);
    const finalId = exists ? `${id}-${Date.now().toString().slice(-4)}` : id;

    const newGarment: GarmentItem = {
      ...item,
      id: finalId,
      isCustom: true,
      sections: item.sections,
    };

    const updated = [...garments, newGarment];
    this.saveGarments(updated);
    return newGarment;
  }

  public updateGarment(id: string, updates: Partial<GarmentItem>): GarmentItem | undefined {
    const garments = this.getGarments();
    const index = garments.findIndex((g) => g.id === id);
    if (index === -1) return undefined;

    const existing = garments[index];
    if (!existing) return undefined;

    const updatedItem: GarmentItem = {
      ...existing,
      ...updates,
      id: existing.id, // preserve id
    };

    const next = [...garments];
    next[index] = updatedItem;
    this.saveGarments(next);
    return updatedItem;
  }

  public deleteGarment(id: string): boolean {
    const garments = this.getGarments();
    const filtered = garments.filter((g) => g.id !== id);
    if (filtered.length === garments.length) return false;
    this.saveGarments(filtered);
    return true;
  }

  // ── Sub-Division (Section) Operations ────────────────────────────────────
  public addSection(garmentId: string, section: StyleSection): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const existingIndex = garment.sections.findIndex((s) => s.id === section.id);
    const nextSections = [...garment.sections];
    if (existingIndex >= 0) {
      nextSections[existingIndex] = section;
    } else {
      nextSections.push(section);
    }

    this.updateGarment(garmentId, { sections: nextSections });
    return true;
  }

  public updateSection(
    garmentId: string,
    sectionId: string,
    updates: Partial<StyleSection>,
  ): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const sectionIndex = garment.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return false;

    const existing = garment.sections[sectionIndex];
    if (!existing) return false;

    const nextSections = [...garment.sections];
    nextSections[sectionIndex] = { ...existing, ...updates };
    this.updateGarment(garmentId, { sections: nextSections });
    return true;
  }

  public deleteSection(garmentId: string, sectionId: string): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const nextSections = garment.sections.filter((s) => s.id !== sectionId);
    this.updateGarment(garmentId, { sections: nextSections });
    return true;
  }

  // ── Style Options Operations ─────────────────────────────────────────────
  public addOption(garmentId: string, sectionId: string, option: StyleOption): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const section = garment.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const existingOptIndex = section.options.findIndex((o) => o.id === option.id);
    const nextOptions = [...section.options];
    if (existingOptIndex >= 0) {
      nextOptions[existingOptIndex] = option;
    } else {
      nextOptions.push(option);
    }

    this.updateSection(garmentId, sectionId, { options: nextOptions });
    return true;
  }

  public updateOption(
    garmentId: string,
    sectionId: string,
    optionId: string,
    updates: Partial<StyleOption>,
  ): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const section = garment.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const optionIndex = section.options.findIndex((o) => o.id === optionId);
    if (optionIndex === -1) return false;

    const existing = section.options[optionIndex];
    if (!existing) return false;

    const nextOptions = [...section.options];
    nextOptions[optionIndex] = { ...existing, ...updates };

    this.updateSection(garmentId, sectionId, { options: nextOptions });
    return true;
  }

  public deleteOption(garmentId: string, sectionId: string, optionId: string): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const section = garment.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const nextOptions = section.options.filter((o) => o.id !== optionId);
    this.updateSection(garmentId, sectionId, { options: nextOptions });
    return true;
  }

  // ── Sub-Options Operations ───────────────────────────────────────────────
  public addSubOption(
    garmentId: string,
    sectionId: string,
    optionId: string,
    subOption: StyleSubOption,
  ): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const section = garment.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const option = section.options.find((o) => o.id === optionId);
    if (!option) return false;

    const existingSub = option.subOptions || [];
    const subIndex = existingSub.findIndex((s) => s.id === subOption.id);
    const nextSubs = [...existingSub];
    if (subIndex >= 0) {
      nextSubs[subIndex] = subOption;
    } else {
      nextSubs.push(subOption);
    }

    this.updateOption(garmentId, sectionId, optionId, { subOptions: nextSubs });
    return true;
  }

  public deleteSubOption(
    garmentId: string,
    sectionId: string,
    optionId: string,
    subOptionId: string,
  ): boolean {
    const garment = this.getGarment(garmentId);
    if (!garment) return false;

    const section = garment.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const option = section.options.find((o) => o.id === optionId);
    if (!option || !option.subOptions) return false;

    const nextSubs = option.subOptions.filter((s) => s.id !== subOptionId);
    this.updateOption(garmentId, sectionId, optionId, { subOptions: nextSubs });
    return true;
  }

  public resetToDefaults(): GarmentItem[] {
    this.cache = DEFAULT_GARMENTS;
    this.saveGarments(DEFAULT_GARMENTS);
    return DEFAULT_GARMENTS;
  }
}

export const garmentStyleService = new GarmentStyleService();
