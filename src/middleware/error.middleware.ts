import { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/apiError";
import { logger } from "../lib/logger";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let apiErr: ApiError;

  if (err instanceof ApiError) {
    apiErr = err;
  } else {
    apiErr = new ApiError(500, err.message || "Internal Server Error", "INTERNAL_ERROR");
  }

  if (env.NODE_ENV === "development") {
    logger.error(err);
  } else if (!apiErr.isOperational) {
    logger.error(err);
  }

  const body: Record<string, unknown> = {
    success: false,
    error: {
      code: apiErr.code,
      message: apiErr.message,
      ...(apiErr.details?.length ? { details: apiErr.details } : {}),
    },
  };

  if (env.NODE_ENV === "development") {
    body.stack = err.stack;
  }

  res.status(apiErr.statusCode).json(body);
};
