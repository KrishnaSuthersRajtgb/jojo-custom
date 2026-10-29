import {
  pricingApi,
  type AccessoryItem,
  type CustomFabricItem,
  type CustomFabricPayload,
} from './api';
import { FABRICS, type Fabric } from '../data/fabrics';

export type { AccessoryItem, CustomFabricItem, CustomFabricPayload };
export const PRICING_UPDATED_EVENT = 'jojo-pricing-updated';
const FABRIC_PRICES_KEY = 'jojo_custom_fabric_prices';
const ACCESSORIES_KEY = 'jojo_custom_accessories';
const CUSTOM_FABRICS_KEY = 'jojo_custom_fabric_list';

export const DEFAULT_ACCESSORIES: AccessoryItem[] = [
  {
    id: 'zari-embroidery',
    label: 'Zari Embroidery',
    price: 800,
    active: true,
    category: 'embellishment',
    description: 'Intricate metallic gold and silver zari thread embroidery',
  },
  {
    id: 'mirror-work-border',
    label: 'Mirror Work Border',
    price: 650,
    active: true,
    category: 'border',
    description: 'Hand-sewn reflective mirror embellishment along hemlines',
  },
  {
    id: 'hand-embroidery',
    label: 'Hand Embroidery',
    price: 1200,
    active: true,
    category: 'embellishment',
    description: 'Master artisan needlework with pure silk floss',
  },
  {
    id: 'stone-work',
    label: 'Stone Work',
    price: 750,
    active: true,
    category: 'embellishment',
    description: 'Crystalline cut beads and semi-precious stone setting',
  },
  {
    id: 'tassel-detailing',
    label: 'Tassel Detailing',
    price: 320,
    active: true,
    category: 'latkan',
    description: 'Handcrafted potli and silk thread tassels',
  },
  {
    id: 'piping-edge',
    label: 'Piping Edge',
    price: 200,
    active: true,
    category: 'finish',
    description: 'Fine contrast silk piping finish on seams',
  },
  {
    id: 'embroidered-belt',
    label: 'Embroidered Belt',
    price: 450,
    active: true,
    category: 'accessory',
    description: 'Matching structured waist belt with embroidery',
  },
  {
    id: 'contrast-lining',
    label: 'Contrast Lining',
    price: 280,
    active: true,
    category: 'lining',
    description: 'Breathable pure mulmul or satin contrast lining',
  },
];

class PricingService {
  private fabricPrices: Record<string, number> = {};
  private accessories: AccessoryItem[] = DEFAULT_ACCESSORIES;
  private customFabrics: CustomFabricItem[] = [];
  private initialized = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const rawFabrics = localStorage.getItem(FABRIC_PRICES_KEY);
      if (rawFabrics) {
        this.fabricPrices = JSON.parse(rawFabrics) as Record<string, number>;
      }
    } catch {
      this.fabricPrices = {};
    }

    try {
      const rawAccessories = localStorage.getItem(ACCESSORIES_KEY);
      if (rawAccessories) {
        const parsed = JSON.parse(rawAccessories) as AccessoryItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.accessories = parsed;
        }
      }
    } catch {
      this.accessories = DEFAULT_ACCESSORIES;
    }

    try {
      const rawCustom = localStorage.getItem(CUSTOM_FABRICS_KEY);
      if (rawCustom) {
        const parsed = JSON.parse(rawCustom) as CustomFabricItem[];
        if (Array.isArray(parsed)) {
          this.customFabrics = parsed;
        }
      }
    } catch {
      this.customFabrics = [];
    }
  }

  private notify(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(PRICING_UPDATED_EVENT));
    }
  }

  /**
   * Sync with backend API on app launch
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const res = await pricingApi.get();
      this.fabricPrices = { ...this.fabricPrices, ...res.data.fabricPrices };
      localStorage.setItem(FABRIC_PRICES_KEY, JSON.stringify(this.fabricPrices));

      if (res.data.accessories.length > 0) {
        this.accessories = res.data.accessories;
        localStorage.setItem(ACCESSORIES_KEY, JSON.stringify(this.accessories));
      }
      if (res.data.customFabrics && Array.isArray(res.data.customFabrics)) {
        this.customFabrics = res.data.customFabrics;
        localStorage.setItem(CUSTOM_FABRICS_KEY, JSON.stringify(this.customFabrics));
      }
      this.notify();
    } catch {
      // Offline fallback: continue with localStorage
    }
  }

  /**
   * Force refresh prices and custom items from backend API
   */
  async refreshFromApi(): Promise<void> {
    this.initialized = false;
    await this.init();
  }

  /**
   * Get all fabrics (merges custom admin-added fabrics with catalogue)
   */
  getAllFabrics(): Fabric[] {
    this.loadFromLocalStorage();
    const mappedCustom: Fabric[] = this.customFabrics.map((cf) => ({
      id: cf.id,
      name: cf.name,
      tone: cf.tone,
      hex: cf.hex,
      material: cf.material,
      pricePerMeter: this.getFabricPrice(cf.id, cf.pricePerMeter),
      description: cf.description,
      width: cf.width ?? '44 Inches',
      care: cf.care ?? 'Dry Clean Only',
    }));

    return [...mappedCustom, ...FABRICS];
  }

  /**
   * Add a brand new fabric SKU to catalogue
   */
  async addCustomFabric(payload: CustomFabricPayload): Promise<CustomFabricItem> {
    const tempId = `f_new_${Date.now().toString()}`;
    const localItem: CustomFabricItem = { ...payload, id: tempId };

    try {
      const res = await pricingApi.addFabric(payload);
      const savedItem = res.data;
      this.customFabrics = [savedItem, ...this.customFabrics.filter((f) => f.id !== savedItem.id)];
      this.fabricPrices[savedItem.id] = savedItem.pricePerMeter;
      localStorage.setItem(CUSTOM_FABRICS_KEY, JSON.stringify(this.customFabrics));
      localStorage.setItem(FABRIC_PRICES_KEY, JSON.stringify(this.fabricPrices));
      this.notify();
      return savedItem;
    } catch {
      // Offline fallback
      this.customFabrics = [localItem, ...this.customFabrics];
      this.fabricPrices[tempId] = localItem.pricePerMeter;
      localStorage.setItem(CUSTOM_FABRICS_KEY, JSON.stringify(this.customFabrics));
      localStorage.setItem(FABRIC_PRICES_KEY, JSON.stringify(this.fabricPrices));
      this.notify();
      return localItem;
    }
  }

  /**
   * Get dynamic fabric price. Falls back to catalog price if not overridden.
   */
  getFabricPrice(fabricId: string, defaultPrice: number): number {
    this.loadFromLocalStorage();
    if (fabricId in this.fabricPrices) {
      const customPrice = this.fabricPrices[fabricId];
      if (typeof customPrice === 'number' && !isNaN(customPrice)) {
        return customPrice;
      }
    }
    return defaultPrice;
  }

  /**
   * Get all custom fabric prices map
   */
  getAllFabricPrices(): Record<string, number> {
    this.loadFromLocalStorage();
    return { ...this.fabricPrices };
  }

  /**
   * Get all accessories with current dynamic prices
   */
  getAccessories(): AccessoryItem[] {
    this.loadFromLocalStorage();
    return [...this.accessories];
  }

  /**
   * Save a single fabric price
   */
  async saveFabricPrice(fabricId: string, price: number): Promise<void> {
    const validPrice = Math.max(0, Math.round(price));
    this.fabricPrices[fabricId] = validPrice;
    localStorage.setItem(FABRIC_PRICES_KEY, JSON.stringify(this.fabricPrices));
    this.notify();

    try {
      await pricingApi.updateFabricPrices({ fabricId, pricePerMeter: validPrice });
    } catch (e) {
      console.warn('Failed to sync fabric price to backend:', e);
    }
  }

  /**
   * Save bulk fabric prices map
   */
  async saveBulkFabricPrices(prices: Record<string, number>): Promise<void> {
    this.fabricPrices = { ...this.fabricPrices, ...prices };
    localStorage.setItem(FABRIC_PRICES_KEY, JSON.stringify(this.fabricPrices));
    this.notify();

    try {
      await pricingApi.updateFabricPrices({ fabricPrices: prices });
    } catch (e) {
      console.warn('Failed to sync bulk fabric prices to backend:', e);
    }
  }

  /**
   * Save accessories list and prices
   */
  async saveAccessories(accessories: AccessoryItem[]): Promise<void> {
    this.accessories = accessories;
    localStorage.setItem(ACCESSORIES_KEY, JSON.stringify(this.accessories));
    this.notify();

    try {
      await pricingApi.updateAccessories(accessories);
    } catch (e) {
      console.warn('Failed to sync accessories to backend:', e);
    }
  }

  /**
   * Reset pricing to factory defaults
   */
  async resetToDefaults(): Promise<void> {
    this.fabricPrices = {};
    this.accessories = DEFAULT_ACCESSORIES;
    localStorage.removeItem(FABRIC_PRICES_KEY);
    localStorage.setItem(ACCESSORIES_KEY, JSON.stringify(DEFAULT_ACCESSORIES));
    this.notify();

    try {
      await pricingApi.reset();
    } catch (e) {
      console.warn('Failed to reset backend pricing:', e);
    }
  }
}

export const pricingService = new PricingService();
