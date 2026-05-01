import mongoose, { Schema, Document } from "mongoose";

export interface IResume extends Document {
  profileId: mongoose.Types.ObjectId;
  fileUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true, unique: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
