import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../lib/apiError";

export const validate = (schema: z.ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: unknown; params?: unknown };
      if (parsed.body !== undefined) req.body = parsed.body;
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.slice(1).join("."),
          message: issue.message,
        }));
        return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", details));
      }
      return next(error);
    }
  };
};
