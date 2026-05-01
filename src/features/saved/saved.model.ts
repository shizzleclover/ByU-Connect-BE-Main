import mongoose, { Schema, Document } from "mongoose";

export interface ISavedProfile extends Document {
  userId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedProfileSchema = new Schema<ISavedProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

savedProfileSchema.index({ userId: 1, profileId: 1 }, { unique: true });

export const SavedProfile = mongoose.model<ISavedProfile>(
  "SavedProfile",
  savedProfileSchema,
);
