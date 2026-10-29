import { Schema, model, type Document } from 'mongoose';

export interface IReview extends Document {
  username: string;
  userId?: string;
  orderId?: string;
  fabricId?: string;
  fabricName?: string;
  garment?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'flagged';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      trim: true,
    },
    orderId: {
      type: String,
      trim: true,
    },
    fabricId: {
      type: String,
      trim: true,
      index: true,
    },
    fabricName: {
      type: String,
      trim: true,
    },
    garment: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'flagged'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  },
);

export const Review = model<IReview>('Review', ReviewSchema);
