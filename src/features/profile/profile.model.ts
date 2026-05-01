import mongoose, { Schema, Document } from "mongoose";
import { CANVAS_SECTIONS, CanvasSection } from "../../config/constants";

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  bio: string | null;
  department: string | null;
  year: string | null;

  canvasLayout: CanvasSection[];

  accentColor: string | null;

  serviceCategories: string[];

  isPublic: boolean;
  isFeatured: boolean;
  featuredAt: Date | null;
  featuredOrder: number | null;

  completenessScore: number;
  viewCount: number;
  lastActiveAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    fullName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 280, trim: true },
    department: { type: String, default: null, trim: true },
    year: { type: String, default: null },

    canvasLayout: {
      type: [String],
      enum: [...CANVAS_SECTIONS],
      default: ["services", "projects", "links", "stories", "resume"],
    },

    accentColor: { type: String, default: null },

    serviceCategories: { type: [String], default: [] },

    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredAt: { type: Date, default: null },
    featuredOrder: { type: Number, default: null },

    completenessScore: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

profileSchema.index({ isFeatured: 1, featuredOrder: 1 });
profileSchema.index({ serviceCategories: 1 });
profileSchema.index(
  { fullName: "text", bio: "text", department: "text" },
  { weights: { fullName: 3, bio: 2, department: 1 } },
);

export const Profile = mongoose.model<IProfile>("Profile", profileSchema);
