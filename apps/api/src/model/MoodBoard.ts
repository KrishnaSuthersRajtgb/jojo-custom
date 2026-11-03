import { Schema, model, type Document } from 'mongoose';

export interface IMoodBoardItem extends Document {
  imageUrl: string;
  caption: string;
  fabricName: string;
  garmentType: string;
  priceRange: string; // e.g., "₹3,500 - ₹5,000"
  fabricId?: string | undefined;
  garmentId?: string | undefined;
  active: boolean;
  createdAt: Date;
}

const MoodBoardSchema = new Schema<IMoodBoardItem>(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, required: true },
    fabricName: { type: String, default: '' },
    garmentType: { type: String, default: '' },
    priceRange: { type: String, default: '' },
    fabricId: { type: String },
    garmentId: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const MoodBoard = model<IMoodBoardItem>('MoodBoard', MoodBoardSchema);
