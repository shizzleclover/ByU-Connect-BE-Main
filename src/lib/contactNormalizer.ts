import { ApiError } from "./apiError";

export function normalizeContact(type: string, value: string): string {
  const v = value.trim();

  switch (type) {
    case "whatsapp":
    case "phone": {
      // Strip common formatting characters, keep only + and digits
      const stripped = v.replace(/[\s\-().]/g, "");
      if (!/^\+\d{7,15}$/.test(stripped)) {
        throw new ApiError(
          400,
          `${type} must include country code (e.g. +2348012345678)`,
        );
      }
      return stripped;
    }

    case "email": {
      const lower = v.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) {
        throw new ApiError(400, "Invalid email address");
      }
      return lower;
    }

    case "instagram":
    case "tiktok":
    case "x": {
      // Strip @ prefix and URL prefix, store handle only
      return v
        .replace(/^@/, "")
        .replace(
          /^https?:\/\/(www\.)?(instagram\.com|tiktok\.com|x\.com|twitter\.com)\//,
          "",
        )
        .replace(/\/$/, "");
    }

    case "linkedin": {
      if (/^https?:\/\//.test(v)) return v;
      const handle = v.replace(/^@/, "");
      return `https://linkedin.com/in/${handle}`;
    }

    case "website":
    case "custom": {
      if (!/^https?:\/\//.test(v)) {
        throw new ApiError(400, "URL must start with http:// or https://");
      }
      return v;
    }

    default:
      return v;
  }
}
