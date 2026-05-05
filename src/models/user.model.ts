import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  isEmailVerified: boolean;

  studentEmail?: string | null;
  studentEmailVerifiedAt?: Date | null;

  refreshTokenHash: string | null;
  lastLoginAt: Date | null;

  isSuspended: boolean;
  suspendedReason: string | null;

  needsPasswordReset: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Virtual
  isVerified: boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: { type: Boolean, default: false },

    studentEmail: { type: String, lowercase: true, trim: true },
    studentEmailVerifiedAt: { type: Date },

    refreshTokenHash: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },

    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String, default: null },

    needsPasswordReset: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ studentEmail: 1 }, { unique: true, sparse: true });

userSchema.virtual("isVerified").get(function () {
  return !!this.studentEmailVerifiedAt;
});

userSchema.set("toJSON", {
  virtuals: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: any, ret: any) {
    delete ret.passwordHash;
    delete ret.refreshTokenHash;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
