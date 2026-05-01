import { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/apiError";
import { verifyAccess } from "../lib/jwt";
import { User } from "../models/user.model";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid Authorization header"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccess(token);
    const user = await User.findById(decoded.userId).select(
      "-passwordHash -refreshTokenHash",
    );

    if (!user) return next(new ApiError(401, "User not found"));

    if (user.isSuspended) {
      return next(
        new ApiError(403, "Your account has been suspended", "SUSPENDED"),
      );
    }

    req.user = user;
    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired access token"));
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccess(token);
    const user = await User.findById(decoded.userId).select(
      "-passwordHash -refreshTokenHash",
    );
    if (user && !user.isSuspended) req.user = user;
  } catch {
    // ignore — optional auth just leaves req.user undefined
  }
  next();
};

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
};
