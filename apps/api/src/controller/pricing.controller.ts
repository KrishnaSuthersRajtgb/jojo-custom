import type { Request, Response } from 'express';
import { Pricing, type IAccessoryItem } from '../model/Pricing.js';

export const DEFAULT_ACCESSORIES: IAccessoryItem[] = [
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

export class PricingController {
  /**
   * Get all active pricing (custom fabric prices & accessories)
   * GET /api/pricing
   */
  async getPricing(_req: Request, res: Response): Promise<void> {
    try {
      let pricing = await Pricing.findOne({ id: 'global_pricing' });
      if (!pricing) {
        pricing = await Pricing.create({
          id: 'global_pricing',
          fabricPrices: new Map(),
          accessories: DEFAULT_ACCESSORIES,
        });
      }

      // Convert fabricPrices Map to plain object for JSON response
      const fabricPricesObj: Record<string, number> = {};
      pricing.fabricPrices.forEach((val, key) => {
        fabricPricesObj[key] = val;
      });

      res.status(200).json({
        data: {
          fabricPrices: fabricPricesObj,
          accessories: pricing.accessories.length > 0 ? pricing.accessories : DEFAULT_ACCESSORIES,
          customFabrics: pricing.customFabrics,
          updatedAt: pricing.updatedAt,
        },
      });
    } catch (error) {
      console.error('[pricing] Get pricing error:', error);
      res.status(500).json({ error: 'Failed to retrieve pricing configurations.' });
    }
  }

  /**
   * Add a new custom fabric
   * POST /api/pricing/fabrics/new
   */
  async addCustomFabric(req: Request, res: Response): Promise<void> {
    try {
      const { name, tone, hex, material, pricePerMeter, description, width, care } = req.body as {
        name?: string;
        tone?: 'warm' | 'cool' | 'neutral';
        hex?: string;
        material?: string;
        pricePerMeter?: number;
        description?: string;
        width?: string;
        care?: string;
      };

      if (!name || typeof pricePerMeter !== 'number') {
        res.status(400).json({ error: 'Fabric name and price per meter are required.' });
        return;
      }

      let pricing = await Pricing.findOne({ id: 'global_pricing' });
      if (!pricing) {
        pricing = new Pricing({
          id: 'global_pricing',
          fabricPrices: new Map(),
          accessories: DEFAULT_ACCESSORIES,
          customFabrics: [],
        });
      }

      const id = `f_new_${Date.now().toString()}`;
      const newFabric = {
        id,
        name: name.trim(),
        tone: tone || 'warm',
        hex: hex || '#7a1f2b',
        material: material?.trim() || 'Silk',
        pricePerMeter: Math.max(0, pricePerMeter),
        description: description?.trim() || 'Handcrafted bespoke textile weave.',
        width: width?.trim() || '44 Inches',
        care: care?.trim() || 'Dry Clean Only',
      };

      pricing.customFabrics.push(newFabric);
      pricing.fabricPrices.set(id, newFabric.pricePerMeter);
      pricing.markModified('customFabrics');
      pricing.markModified('fabricPrices');
      await pricing.save();

      res.status(201).json({
        message: 'New fabric created successfully.',
        data: newFabric,
      });
    } catch (error) {
      console.error('[pricing] Add custom fabric error:', error);
      res.status(500).json({ error: 'Failed to add custom fabric.' });
    }
  }

  /**
   * Update fabric price (single or bulk map)
   * PUT /api/pricing/fabrics
   */
  async updateFabricPrices(req: Request, res: Response): Promise<void> {
    try {
      const { fabricId, pricePerMeter, fabricPrices } = req.body as {
        fabricId?: string;
        pricePerMeter?: number;
        fabricPrices?: Record<string, number>;
      };

      let pricing = await Pricing.findOne({ id: 'global_pricing' });
      if (!pricing) {
        pricing = new Pricing({
          id: 'global_pricing',
          fabricPrices: new Map(),
          accessories: DEFAULT_ACCESSORIES,
        });
      }

      if (fabricId && typeof pricePerMeter === 'number') {
        pricing.fabricPrices.set(fabricId, Math.max(0, pricePerMeter));
      }

      if (fabricPrices && typeof fabricPrices === 'object') {
        for (const [id, price] of Object.entries(fabricPrices)) {
          if (typeof price === 'number') {
            pricing.fabricPrices.set(id, Math.max(0, price));
          }
        }
      }

      pricing.markModified('fabricPrices');
      await pricing.save();

      const fabricPricesObj: Record<string, number> = {};
      pricing.fabricPrices.forEach((val, key) => {
        fabricPricesObj[key] = val;
      });

      res.status(200).json({
        message: 'Fabric prices updated successfully.',
        data: { fabricPrices: fabricPricesObj },
      });
    } catch (error) {
      console.error('[pricing] Update fabric prices error:', error);
      res.status(500).json({ error: 'Failed to update fabric prices.' });
    }
  }

  /**
   * Update accessories list & pricing
   * PUT /api/pricing/accessories
   */
  async updateAccessories(req: Request, res: Response): Promise<void> {
    try {
      const { accessories } = req.body as { accessories?: IAccessoryItem[] };
      if (!Array.isArray(accessories)) {
        res.status(400).json({ error: 'Accessories array is required.' });
        return;
      }

      let pricing = await Pricing.findOne({ id: 'global_pricing' });
      if (!pricing) {
        pricing = new Pricing({
          id: 'global_pricing',
          fabricPrices: new Map(),
          accessories: DEFAULT_ACCESSORIES,
        });
      }

      pricing.accessories = accessories;
      pricing.markModified('accessories');
      await pricing.save();

      res.status(200).json({
        message: 'Accessories updated successfully.',
        data: { accessories: pricing.accessories },
      });
    } catch (error) {
      console.error('[pricing] Update accessories error:', error);
      res.status(500).json({ error: 'Failed to update accessories.' });
    }
  }

  /**
   * Reset pricing to factory defaults
   * POST /api/pricing/reset
   */
  async resetPricing(_req: Request, res: Response): Promise<void> {
    try {
      let pricing = await Pricing.findOne({ id: 'global_pricing' });
      if (!pricing) {
        pricing = new Pricing({ id: 'global_pricing' });
      }

      pricing.fabricPrices = new Map();
      pricing.accessories = DEFAULT_ACCESSORIES;
      pricing.markModified('fabricPrices');
      pricing.markModified('accessories');
      await pricing.save();

      res.status(200).json({
        message: 'Pricing reset to factory defaults.',
        data: { fabricPrices: {}, accessories: DEFAULT_ACCESSORIES },
      });
    } catch (error) {
      console.error('[pricing] Reset error:', error);
      res.status(500).json({ error: 'Failed to reset pricing.' });
    }
  }
}

export const pricingController = new PricingController();
