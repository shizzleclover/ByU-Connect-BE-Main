import mongoose, { Schema, Document } from "mongoose";

export interface IOutreachClick extends Document {
  profileId: mongoose.Types.ObjectId;
  contactType: string;
  viewerId: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const outreachClickSchema = new Schema<IOutreachClick>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    contactType: { type: String, required: true },
    viewerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

outreachClickSchema.index({ profileId: 1, createdAt: -1 });
outreachClickSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export const OutreachClick = mongoose.model<IOutreachClick>(
  "OutreachClick",
  outreachClickSchema,
);
