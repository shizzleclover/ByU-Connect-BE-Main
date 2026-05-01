import cloudinary from "../../config/cloudinary";
import { Resume } from "./resume.model";
import { Profile } from "../profile/profile.model";
import { ApiError } from "../../lib/apiError";
import { recomputeCompleteness } from "../../lib/completeness";

export async function getResume(profileId: string) {
  return Resume.findOne({ profileId }).lean();
}

export async function uploadResume(
  profileId: string,
  userId: string,
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  fileSize: number,
) {
  if (mimeType !== "application/pdf") {
    throw new ApiError(400, "Resume must be a PDF file");
  }
  if (fileSize > 5 * 1024 * 1024) {
    throw new ApiError(400, "Resume must be under 5 MB");
  }

  // Delete existing if present
  const existing = await Resume.findOne({ profileId });
  if (existing) {
    await cloudinary.uploader.destroy(existing.publicId, { resource_type: "raw" }).catch(() => {});
    await existing.deleteOne();
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `byu-connect/resumes/${userId}`,
          resource_type: "raw",
          format: "pdf",
        },
        (err, r) => (err || !r ? reject(err) : resolve(r as { secure_url: string; public_id: string })),
      );
      stream.end(buffer);
    },
  );

  const resume = await Resume.create({
    profileId,
    fileUrl: result.secure_url,
    publicId: result.public_id,
    fileName: originalName,
    fileSize,
    uploadedAt: new Date(),
  });

  await recomputeCompleteness(profileId);
  return resume;
}

export async function deleteResume(profileId: string) {
  const resume = await Resume.findOne({ profileId });
  if (!resume) throw new ApiError(404, "No resume found");

  await cloudinary.uploader.destroy(resume.publicId, { resource_type: "raw" }).catch(() => {});
  await resume.deleteOne();
  await recomputeCompleteness(profileId);
}
