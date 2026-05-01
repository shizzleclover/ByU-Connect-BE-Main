import mongoose, { Schema, Document } from "mongoose";
import { SERVICE_CATEGORIES, ServiceCategory } from "../../config/constants";

export interface IService extends Document {
  profileId: mongoose.Types.ObjectId;
  category: ServiceCategory;
  title: string;
  description: string;
  startingPrice: number | null;
  currency: "NGN" | "USD";
  isNegotiable: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    category: { type: String, enum: [...SERVICE_CATEGORIES], required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    startingPrice: { type: Number, default: null },
    currency: { type: String, enum: ["NGN", "USD"], default: "NGN" },
    isNegotiable: { type: Boolean, default: false },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

serviceSchema.index({ profileId: 1, order: 1 });
serviceSchema.index({ category: 1, createdAt: -1 });

export const Service = mongoose.model<IService>("Service", serviceSchema);
