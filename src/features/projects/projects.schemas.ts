import { z } from "zod";
import { PROJECT_LINK_TYPES } from "../../config/constants";

const galleryItemSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().min(1),
  type: z.enum(["image", "video"]),
  caption: z.string().max(200).nullable().optional(),
});

const projectLinkSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().min(1),
  type: z.enum([...PROJECT_LINK_TYPES] as [string, ...string[]]),
});

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).trim(),
    tagline: z.string().max(140).trim().nullable().optional(),
    description: z.string().min(1).max(5000),
    techStack: z.array(z.string().max(50)).max(12).default([]),
    links: z.array(projectLinkSchema).max(6).default([]),
    isPublished: z.boolean().default(true),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).trim().optional(),
    tagline: z.string().max(140).trim().nullable().optional(),
    description: z.string().min(1).max(5000).optional(),
    techStack: z.array(z.string().max(50)).max(12).optional(),
    links: z.array(projectLinkSchema).max(6).optional(),
  }),
});

export const updateSlugSchema = z.object({
  body: z.object({
    slug: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  }),
});

export const addGallerySchema = z.object({
  body: z.object({
    items: z.array(galleryItemSchema).min(1),
  }),
});

export const publishSchema = z.object({
  body: z.object({
    isPublished: z.boolean(),
  }),
});

export const reorderSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string()).min(1),
  }),
});
