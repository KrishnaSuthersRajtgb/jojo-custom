import { Schema, model, type Document } from 'mongoose';

export interface IWishlistItem {
  fabricId: string;
  fabricName: string;
  tone: string;
  hex: string;
  pricePerMeter: number;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: string;
  items: IWishlistItem[];
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    fabricId: { type: String, required: true },
    fabricName: { type: String, required: true },
    tone: { type: String, default: 'warm' },
    hex: { type: String, default: '#5C1A32' },
    pricePerMeter: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: [WishlistItemSchema],
  },
  { timestamps: true },
);

export const Wishlist = model<IWishlist>('Wishlist', WishlistSchema);
