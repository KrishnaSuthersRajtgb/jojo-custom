import { Schema, model, type Document } from 'mongoose';

export interface AdminNote {
  note: string;
  addedAt: Date;
}

export type CustomerFlag = 'none' | 'VIP' | 'Needs Attention' | 'Blocked';

export interface IUser extends Document {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  password?: string | undefined;
  role: 'user' | 'staff' | 'admin';
  emailVerified: boolean;
  otpCode?: string | undefined;
  otpExpiresAt?: Date | undefined;
  authProvider: 'local' | 'google';
  avatarUrl?: string | undefined;
  failedLoginAttempts: number;
  lockUntil?: Date | undefined;
  adminNotes?: AdminNote[] | undefined;
  flag?: CustomerFlag | undefined;
  referralCode?: string | undefined;
  referredBy?: string | undefined;
  referralCount: number;
  loyaltyCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      required: false,
      default: 'Not specified',
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatarUrl: {
      type: String,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['user', 'staff', 'admin'],
      default: 'user',
    },
    adminNotes: [
      {
        note: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    flag: {
      type: String,
      enum: ['none', 'VIP', 'Needs Attention', 'Blocked'],
      default: 'none',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    referredBy: {
      type: String,
      trim: true,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    loyaltyCredits: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj['password'];
        delete obj['otpCode'];
        delete obj['otpExpiresAt'];
        delete obj['__v'];
        return obj;
      },
    },
  },
);

export const User = model<IUser>('User', UserSchema);
