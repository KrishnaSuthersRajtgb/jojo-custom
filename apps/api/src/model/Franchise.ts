import { Schema, model, type Document } from 'mongoose';

export interface IFranchise extends Document {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  investment: string;
  message?: string;
  status: 'new' | 'contacted' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseSchema = new Schema<IFranchise>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
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
    city: {
      type: String,
      required: true,
      trim: true,
    },
    investment: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'approved', 'rejected'],
      default: 'new',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        const idObj = obj['_id'] as { toString(): string } | undefined;
        if (idObj) {
          obj['id'] = idObj.toString();
        }
        delete obj['_id'];
        delete obj['__v'];
        return obj;
      },
    },
  },
);

export const Franchise = model<IFranchise>('Franchise', FranchiseSchema);
