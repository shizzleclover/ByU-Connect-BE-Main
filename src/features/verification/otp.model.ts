import mongoose, { Schema, Document } from "mongoose";

export type OtpPurpose =
  | "verify_email"
  | "verify_student_email"
  | "reset_password";

export interface IOtp extends Document {
  userId: mongoose.Types.ObjectId;
  purpose: OtpPurpose;
  emailTarget: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purpose: {
      type: String,
      enum: ["verify_email", "verify_student_email", "reset_password"],
      required: true,
    },
    emailTarget: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, max: 5 },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

otpSchema.index({ userId: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
