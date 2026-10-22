import { Schema, model, type Document } from 'mongoose';

export interface IMeasurement extends Document {
  username: string;
  blouse: Record<string, string>;
  chudi: Record<string, string>;
  pant: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const MeasurementSchema = new Schema<IMeasurement>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    blouse: {
      type: Map,
      of: String,
      default: () => ({}),
    },
    chudi: {
      type: Map,
      of: String,
      default: () => ({}),
    },
    pant: {
      type: Map,
      of: String,
      default: () => ({}),
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

export const Measurement = model<IMeasurement>('Measurement', MeasurementSchema);
