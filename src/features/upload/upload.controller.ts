import { Request, Response } from "express";
import cloudinary from "../../config/cloudinary";
import { env } from "../../config/env";
import { ApiError } from "../../lib/apiError";
import { z } from "zod";

const PRESETS: Record<string, string> = {
  cover: "cover_preset",
  gallery: "gallery_preset",
  link_icon: "gallery_preset",
};

const FOLDERS: Record<string, (userId: string, extra?: string) => string> = {
  cover: (userId, extra) => `byu-connect/projects/${userId}/${extra}`,
  gallery: (userId, extra) => `byu-connect/projects/${userId}/${extra}`,
  link_icon: (userId) => `byu-connect/links/${userId}`,
};

export const signUpload = async (req: Request, res: Response) => {
  const { type, resourceId } = req.body;

  if (!PRESETS[type]) {
    throw new ApiError(400, `Unknown upload type '${type}'`);
  }

  const userId = String(req.user!._id);
  const folder = FOLDERS[type](userId, resourceId);
  const uploadPreset = PRESETS[type];
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
    upload_preset: uploadPreset,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  res.status(200).json({
    success: true,
    data: {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      folder,
      uploadPreset,
    },
  });
};
