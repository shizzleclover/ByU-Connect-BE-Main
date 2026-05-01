import mongoose, { Schema, Document } from "mongoose";

export interface ILink extends Document {
  profileId: mongoose.Types.ObjectId;
  label: string;
  url: string;
  iconKey: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, required: true, trim: true },
    iconKey: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

linkSchema.index({ profileId: 1, order: 1 });

export const Link = mongoose.model<ILink>("Link", linkSchema);
