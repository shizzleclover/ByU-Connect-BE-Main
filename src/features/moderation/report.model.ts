import mongoose, { Schema, Document } from "mongoose";

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "impersonation"
  | "harassment"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetProfileId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetProfileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    reason: {
      type: String,
      enum: ["spam", "inappropriate", "impersonation", "harassment", "other"],
      required: true,
    },
    description: { type: String, default: null, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "reviewed", "actioned", "dismissed"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    adminNote: { type: String, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>("Report", reportSchema);
