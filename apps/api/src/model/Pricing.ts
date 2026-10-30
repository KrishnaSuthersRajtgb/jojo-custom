import { Schema, model, type Document } from 'mongoose';

export interface IAccessoryItem {
  id: string;
  label: string;
  price: number;
  active: boolean;
  category?: string;
  description?: string;
}

export interface ICustomFabricItem {
  id: string;
  name: string;
  tone: 'warm' | 'cool' | 'neutral';
  hex: string;
  material: string;
  pricePerMeter: number;
  description: string;
  width?: string;
  care?: string;
}

export interface IPricingDoc extends Document {
  id: string; // 'global_pricing'
  fabricPrices: Map<string, number>; // fabricId -> pricePerMeter
  accessories: IAccessoryItem[];
  customFabrics: ICustomFabricItem[];
  garments?: unknown[];
  updatedAt: Date;
}

const CustomFabricSchema = new Schema<ICustomFabricItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    tone: { type: String, enum: ['warm', 'cool', 'neutral'], default: 'warm' },
    hex: { type: String, default: '#7a1f2b' },
    material: { type: String, default: 'Silk' },
    pricePerMeter: { type: Number, required: true },
    description: { type: String, default: '' },
    width: { type: String, default: '44 Inches' },
    care: { type: String, default: 'Dry Clean Only' },
  },
  { _id: false },
);

const AccessorySchema = new Schema<IAccessoryItem>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
    active: { type: Boolean, default: true },
    category: { type: String, default: 'embellishment' },
    description: { type: String, default: '' },
  },
  { _id: false },
);

const PricingSchema = new Schema<IPricingDoc>(
  {
    id: { type: String, required: true, unique: true, default: 'global_pricing' },
    fabricPrices: { type: Map, of: Number, default: {} },
    accessories: [AccessorySchema],
    customFabrics: [CustomFabricSchema],
    garments: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true },
);

export const Pricing = model<IPricingDoc>('Pricing', PricingSchema);
