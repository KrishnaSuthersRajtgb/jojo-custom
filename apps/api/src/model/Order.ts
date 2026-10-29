import { Schema, model, type Document } from 'mongoose';

export interface SelectionEntry {
  sectionLabel: string;
  optionLabel: string | null;
  subOptionLabel: string | null;
}

export interface AccessoryEntry {
  id: string;
  label: string;
  price: number;
}

export interface ReferenceImage {
  dataUrl: string;
  fileName: string;
}

export interface OrderDetails {
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  garmentLabel?: string;
  meters: number;
  pricePerMeter: number;
  total: number;
  isCustom?: boolean;
  fabricTotal?: number;
  productId?: string;
  productName?: string;
  selections?: SelectionEntry[] | null;
  accessories?: AccessoryEntry[];
  accessoriesTotal?: number;
  measurementValues?: Record<string, string> | null;
  bodyType?: string | null;
  referenceImage?: ReferenceImage | null;
}

export interface OrderAddress {
  id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
}

export type OrderStatus =
  | 'placed'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'cancelled';

export interface IOrder extends Document {
  id: string;
  username: string;
  orderDetails: OrderDetails;
  address: OrderAddress;
  paymentId: string | null;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  trackingNumber?: string;
  courier?: string;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    orderDetails: {
      fabricId: { type: String, required: true },
      fabricName: { type: String, required: true },
      tone: { type: String, default: '' },
      garment: { type: String, default: '' },
      garmentLabel: { type: String, default: '' },
      meters: { type: Number, default: 1 },
      pricePerMeter: { type: Number, default: 0 },
      total: { type: Number, required: true },
      isCustom: { type: Boolean, default: false },
      fabricTotal: { type: Number },
      productId: { type: String },
      productName: { type: String },
      selections: [
        {
          sectionLabel: { type: String },
          optionLabel: { type: String, default: null },
          subOptionLabel: { type: String, default: null },
        },
      ],
      accessories: [
        {
          id: { type: String },
          label: { type: String },
          price: { type: Number },
        },
      ],
      accessoriesTotal: { type: Number, default: 0 },
      measurementValues: { type: Map, of: String, default: null },
      bodyType: { type: String, default: null },
      referenceImage: {
        dataUrl: { type: String },
        fileName: { type: String },
      },
    },
    address: {
      id: { type: String },
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      type: { type: String, default: 'home' },
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: [
        'placed',
        'packed',
        'dispatched',
        'delivered',
        'confirmed',
        'processing',
        'shipped',
        'cancelled',
      ],
      default: 'placed',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    courier: {
      type: String,
      default: 'BlueDart Express',
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj['_id'];
        delete obj['__v'];
        return obj;
      },
    },
  },
);

export const Order = model<IOrder>('Order', OrderSchema);
