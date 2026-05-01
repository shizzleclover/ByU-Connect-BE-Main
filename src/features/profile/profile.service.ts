import cloudinary from "../../config/cloudinary";
import { Profile } from "./profile.model";
import { ApiError } from "../../lib/apiError";
import { recomputeCompleteness } from "../../lib/completeness";

export async function uploadAvatar(
  profileId: string,
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<{ avatarUrl: string; avatarPublicId: string }> {
  if (!mimeType.startsWith("image/")) {
    throw new ApiError(400, "Avatar must be an image");
  }

  const profile = await Profile.findById(profileId);
  if (!profile) throw new ApiError(404, "Profile not found");

  // Delete old avatar if exists
  if (profile.avatarPublicId) {
    await cloudinary.uploader.destroy(profile.avatarPublicId).catch(() => {});
  }

  const folder = `byu-connect/avatars/${userId}`;

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result as { secure_url: string; public_id: string });
        },
      );
      stream.end(fileBuffer);
    },
  );

  await Profile.findByIdAndUpdate(profileId, {
    avatarUrl: result.secure_url,
    avatarPublicId: result.public_id,
  });

  await recomputeCompleteness(profileId);

  return { avatarUrl: result.secure_url, avatarPublicId: result.public_id };
}

export async function deleteAvatar(profileId: string): Promise<void> {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new ApiError(404, "Profile not found");

  if (profile.avatarPublicId) {
    await cloudinary.uploader.destroy(profile.avatarPublicId).catch(() => {});
  }

  await Profile.findByIdAndUpdate(profileId, {
    avatarUrl: null,
    avatarPublicId: null,
  });

  await recomputeCompleteness(profileId);
}
