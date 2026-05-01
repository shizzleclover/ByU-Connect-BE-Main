import mongoose, { Schema, Document } from "mongoose";

export type ViewSource =
  | "direct"
  | "discover"
  | "category"
  | "search"
  | "shared"
  | "featured";

export interface IProfileView extends Document {
  profileId: mongoose.Types.ObjectId;
  viewerId: mongoose.Types.ObjectId | null;
  viewerKey: string;
  source: ViewSource;
  createdAt: Date;
}

const profileViewSchema = new Schema<IProfileView>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    viewerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    viewerKey: { type: String, required: true },
    source: {
      type: String,
      enum: ["direct", "discover", "category", "search", "shared", "featured"],
      default: "direct",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

profileViewSchema.index({ profileId: 1, createdAt: -1 });
profileViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ProfileView = mongoose.model<IProfileView>(
  "ProfileView",
  profileViewSchema,
);
