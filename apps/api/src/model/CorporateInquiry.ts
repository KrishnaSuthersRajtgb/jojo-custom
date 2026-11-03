import { Schema, model, type Document } from 'mongoose';

export type CorporateInquiryStatus = 'New' | 'In Progress' | 'Quoted' | 'Closed';

export interface ICorporateInquiry extends Document {
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  garmentType: string;
  estimatedQuantity: number;
  deliveryCity: string;
  targetDate: string;
  specialRequirements?: string;
  status: CorporateInquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CorporateInquirySchema = new Schema<ICorporateInquiry>(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    garmentType: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryCity: {
      type: String,
      required: true,
      trim: true,
    },
    targetDate: {
      type: String,
      required: true,
    },
    specialRequirements: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Quoted', 'Closed'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  },
);

export const CorporateInquiry = model<ICorporateInquiry>(
  'CorporateInquiry',
  CorporateInquirySchema,
);
