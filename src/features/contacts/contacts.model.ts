import mongoose, { Schema, Document } from "mongoose";
import { CONTACT_TYPES, ContactType } from "../../config/constants";

export interface IContact extends Document {
  profileId: mongoose.Types.ObjectId;
  type: ContactType;
  value: string;
  label: string | null;
  order: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    type: { type: String, enum: [...CONTACT_TYPES], required: true },
    value: { type: String, required: true, trim: true },
    label: { type: String, default: null, trim: true },
    order: { type: Number, required: true, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true },
);

contactSchema.index({ profileId: 1, order: 1 });

export const Contact = mongoose.model<IContact>("Contact", contactSchema);
