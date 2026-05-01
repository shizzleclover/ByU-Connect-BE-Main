import { Request, Response } from "express";
import * as canvasService from "./canvas.service";

export const getCanvas = async (req: Request, res: Response) => {
  const data = await canvasService.getCanvas(String(req.params.username), req);
  res.status(200).json({ success: true, data });
};

export const getProject = async (req: Request, res: Response) => {
  const data = await canvasService.getProject(
    String(req.params.username),
    String(req.params.slug),
    req,
  );
  res.status(200).json({ success: true, data });
};

export const getStory = async (req: Request, res: Response) => {
  const data = await canvasService.getStory(
    String(req.params.username),
    String(req.params.slug),
    req,
  );
  res.status(200).json({ success: true, data });
};
