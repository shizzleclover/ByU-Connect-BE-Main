import { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/apiError";

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Not found - ${req.originalUrl}`));
};
