import cloudinary from "../../config/cloudinary";
import { Project, IGalleryItem, IProjectLink } from "./projects.model";
import { ApiError } from "../../lib/apiError";
import { renderMarkdown } from "../../lib/markdown";
import { generateSlug, uniqueSlug } from "../../lib/slug";
import { recomputeCompleteness } from "../../lib/completeness";

const PROJECT_LIMIT = 24;

export async function getProjects(profileId: string) {
  return Project.find({ profileId }).sort({ order: 1 }).lean();
}

export async function getProjectById(projectId: string, profileId: string) {
  const project = await Project.findOne({ _id: projectId, profileId }).lean();
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

export async function createProject(
  profileId: string,
  data: {
    title: string;
    tagline?: string | null;
    description: string;
    techStack?: string[];
    links?: IProjectLink[];
    isPublished?: boolean;
  },
) {
  const count = await Project.countDocuments({ profileId });
  if (count >= PROJECT_LIMIT) throw new ApiError(400, `Maximum ${PROJECT_LIMIT} projects allowed`);

  const baseSlug = generateSlug(data.title);
  const slug = await uniqueSlug(baseSlug, async (s) =>
    !!(await Project.exists({ profileId, slug: s })),
  );

  const descriptionHtml = await renderMarkdown(data.description);

  const project = await Project.create({
    profileId,
    slug,
    descriptionHtml,
    order: count,
    ...data,
  });

  await recomputeCompleteness(profileId);
  return project;
}

export async function updateProject(
  projectId: string,
  profileId: string,
  data: Partial<{
    title: string;
    tagline: string | null;
    description: string;
    techStack: string[];
    links: IProjectLink[];
  }>,
) {
  const project = await Project.findOne({ _id: projectId, profileId });
  if (!project) throw new ApiError(404, "Project not found");

  if (data.description !== undefined) {
    (data as Record<string, unknown>).descriptionHtml = await renderMarkdown(data.description);
  }

  Object.assign(project, data);
  await project.save();
  return project;
}

export async function updateSlug(projectId: string, profileId: string, slug: string) {
  const conflict = await Project.findOne({ profileId, slug, _id: { $ne: projectId } });
  if (conflict) throw new ApiError(409, "Slug already in use for another project");

  const project = await Project.findOneAndUpdate(
    { _id: projectId, profileId },
    { slug },
    { new: true },
  );
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

export async function uploadCover(
  projectId: string,
  profileId: string,
  userId: string,
  buffer: Buffer,
  mimeType: string,
) {
  const project = await Project.findOne({ _id: projectId, profileId });
  if (!project) throw new ApiError(404, "Project not found");

  if (project.coverPublicId) {
    await cloudinary.uploader.destroy(project.coverPublicId).catch(() => {});
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `byu-connect/projects/${userId}/${projectId}`,
          upload_preset: "cover_preset",
          resource_type: "image",
        },
        (err, r) => (err || !r ? reject(err) : resolve(r as { secure_url: string; public_id: string })),
      );
      stream.end(buffer);
    },
  );

  project.coverUrl = result.secure_url;
  project.coverPublicId = result.public_id;
  await project.save();
  return project;
}

export async function addGalleryItems(
  projectId: string,
  profileId: string,
  items: IGalleryItem[],
) {
  const project = await Project.findOne({ _id: projectId, profileId });
  if (!project) throw new ApiError(404, "Project not found");

  if (project.gallery.length + items.length > 12) {
    throw new ApiError(400, "Gallery may have at most 12 items");
  }

  project.gallery.push(...items);
  await project.save();
  return project;
}

export async function deleteGalleryItem(
  projectId: string,
  profileId: string,
  itemId: string,
) {
  const project = await Project.findOne({ _id: projectId, profileId });
  if (!project) throw new ApiError(404, "Project not found");

  const item = project.gallery.find((g) => String(g._id) === itemId);
  if (!item) throw new ApiError(404, "Gallery item not found");

  await cloudinary.uploader
    .destroy(item.publicId, { resource_type: item.type })
    .catch(() => {});

  project.gallery = project.gallery.filter((g) => String(g._id) !== itemId);
  await project.save();
}

export async function setPublished(
  projectId: string,
  profileId: string,
  isPublished: boolean,
) {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, profileId },
    { isPublished },
    { new: true },
  );
  if (!project) throw new ApiError(404, "Project not found");
  await recomputeCompleteness(profileId);
  return project;
}

export async function reorderProjects(profileId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, i) =>
      Project.findOneAndUpdate({ _id: id, profileId }, { order: i }),
    ),
  );
}

export async function deleteProject(projectId: string, profileId: string) {
  const project = await Project.findOne({ _id: projectId, profileId });
  if (!project) throw new ApiError(404, "Project not found");

  const toDelete: Array<{ publicId: string; resourceType: string }> = [];
  if (project.coverPublicId) toDelete.push({ publicId: project.coverPublicId, resourceType: "image" });
  project.gallery.forEach((g) => toDelete.push({ publicId: g.publicId, resourceType: g.type }));

  await Promise.all(
    toDelete.map(({ publicId, resourceType }) =>
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {}),
    ),
  );

  await project.deleteOne();
  await recomputeCompleteness(profileId);
}
