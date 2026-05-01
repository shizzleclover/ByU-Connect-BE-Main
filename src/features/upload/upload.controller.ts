import { Request, Response } from "express";
import cloudinary from "../../config/cloudinary";
import { env } from "../../config/env";
import { ApiError } from "../../lib/apiError";

const FOLDERS: Record<string, (userId: string, extra?: string) => string> = {
  cover:    (userId, extra) => `byu-connect/projects/${userId}/${extra ?? "covers"}`,
  gallery:  (userId, extra) => `byu-connect/projects/${userId}/${extra ?? "gallery"}`,
  avatar:   (userId)        => `byu-connect/avatars/${userId}`,
  story:    (userId, extra) => `byu-connect/stories/${userId}/${extra ?? "covers"}`,
};

export const signUpload = async (req: Request, res: Response) => {
  const { type, resourceId } = req.body as { type: string; resourceId?: string };

  if (!FOLDERS[type]) {
    throw new ApiError(400, `Unknown upload type '${type}'. Allowed: cover, gallery, avatar, story`);
  }

  const userId = String(req.user!._id);
  const folder = FOLDERS[type](userId, resourceId);
  const timestamp = Math.round(Date.now() / 1000);

  // Signed uploads: only sign the params you will actually send to Cloudinary
  const paramsToSign: Record<string, string | number> = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  res.status(200).json({
    success: true,
    data: {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      folder,
    },
  });
};
