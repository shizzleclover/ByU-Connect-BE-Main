import mongoose, { Schema, Document } from "mongoose";
import { PROJECT_LINK_TYPES, ProjectLinkType } from "../../config/constants";

export interface IGalleryItem {
  _id?: unknown;
  url: string;
  publicId: string;
  type: "image" | "video";
  caption: string | null;
}

export interface IProjectLink {
  label: string;
  url: string;
  type: ProjectLinkType;
}

export interface IProject extends Document {
  profileId: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  descriptionHtml: string;
  coverUrl: string | null;
  coverPublicId: string | null;
  gallery: IGalleryItem[];
  links: IProjectLink[];
  techStack: string[];
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    tagline: { type: String, default: null, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 5000 },
    descriptionHtml: { type: String, required: true },
    coverUrl: { type: String, default: null },
    coverPublicId: { type: String, default: null },
    gallery: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
          type: { type: String, enum: ["image", "video"], required: true },
          caption: { type: String, default: null },
        },
      ],
      default: [],
      validate: [(v: unknown[]) => v.length <= 12, "Max 12 gallery items"],
    },
    links: {
      type: [
        {
          label: { type: String, required: true },
          url: { type: String, required: true },
          type: { type: String, enum: [...PROJECT_LINK_TYPES], required: true },
        },
      ],
      default: [],
      validate: [(v: unknown[]) => v.length <= 6, "Max 6 project links"],
    },
    techStack: {
      type: [String],
      default: [],
      validate: [(v: unknown[]) => v.length <= 12, "Max 12 tech stack tags"],
    },
    order: { type: Number, required: true, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

projectSchema.index({ profileId: 1, order: 1 });
projectSchema.index({ profileId: 1, slug: 1 }, { unique: true });

export const Project = mongoose.model<IProject>("Project", projectSchema);
