import { Request, Response } from "express";
import * as discoveryService from "./discovery.service";

export const getCategories = async (req: Request, res: Response) => {
  const categories = await discoveryService.getCategories();
  res.status(200).json({ success: true, data: categories });
};

export const getFeatured = async (req: Request, res: Response) => {
  const profiles = await discoveryService.getFeatured();
  res.status(200).json({ success: true, data: profiles });
};

export const discover = async (req: Request, res: Response) => {
  const { q, category, verified, sort, cursor, limit } = req.query as Record<string, string>;
  const result = await discoveryService.discover({
    q,
    category,
    verified,
    sort,
    cursor,
    limit: Number(limit) || 20,
  });
  res.status(200).json({ success: true, data: result });
};
