import mongoose, { Schema, Document } from "mongoose";

export interface IStory extends Document {
  profileId: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  coverPublicId: string | null;
  body: string;
  bodyHtml: string;
  readingTimeMinutes: number;
  isPublished: boolean;
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    excerpt: { type: String, default: null, trim: true, maxlength: 200 },
    coverUrl: { type: String, default: null },
    coverPublicId: { type: String, default: null },
    body: { type: String, required: true, maxlength: 20000 },
    bodyHtml: { type: String, required: true },
    readingTimeMinutes: { type: Number, required: true, default: 1 },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

storySchema.index({ profileId: 1, publishedAt: -1 });
storySchema.index({ profileId: 1, slug: 1 }, { unique: true });

export const Story = mongoose.model<IStory>("Story", storySchema);
