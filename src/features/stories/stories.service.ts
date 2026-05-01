import cloudinary from "../../config/cloudinary";
import { Story } from "./stories.model";
import { ApiError } from "../../lib/apiError";
import { renderMarkdown, computeReadingTime } from "../../lib/markdown";
import { generateSlug, uniqueSlug } from "../../lib/slug";
import { recomputeCompleteness } from "../../lib/completeness";

export async function getStories(profileId: string) {
  return Story.find({ profileId }).sort({ createdAt: -1 }).lean();
}

export async function getStoryById(storyId: string, profileId: string) {
  const story = await Story.findOne({ _id: storyId, profileId }).lean();
  if (!story) throw new ApiError(404, "Story not found");
  return story;
}

export async function createStory(
  profileId: string,
  data: { title: string; body: string; excerpt?: string | null; isPublished?: boolean },
) {
  const baseSlug = generateSlug(data.title);
  const slug = await uniqueSlug(baseSlug, async (s) =>
    !!(await Story.exists({ profileId, slug: s })),
  );

  const bodyHtml = await renderMarkdown(data.body);
  const readingTimeMinutes = computeReadingTime(data.body);
  const excerpt =
    data.excerpt ?? data.body.replace(/<[^>]+>/g, "").slice(0, 200);

  const publishedAt = data.isPublished ? new Date() : null;

  const story = await Story.create({
    profileId,
    slug,
    bodyHtml,
    readingTimeMinutes,
    excerpt,
    publishedAt,
    ...data,
  });

  await recomputeCompleteness(profileId);
  return story;
}

export async function updateStory(
  storyId: string,
  profileId: string,
  data: Partial<{ title: string; body: string; excerpt: string | null }>,
) {
  const story = await Story.findOne({ _id: storyId, profileId });
  if (!story) throw new ApiError(404, "Story not found");

  if (data.body !== undefined) {
    (data as Record<string, unknown>).bodyHtml = await renderMarkdown(data.body);
    (data as Record<string, unknown>).readingTimeMinutes = computeReadingTime(data.body);
  }

  Object.assign(story, data);
  await story.save();
  return story;
}

export async function setPublished(storyId: string, profileId: string, isPublished: boolean) {
  const update: Record<string, unknown> = { isPublished };
  if (isPublished) update.publishedAt = new Date();

  const story = await Story.findOneAndUpdate({ _id: storyId, profileId }, update, { new: true });
  if (!story) throw new ApiError(404, "Story not found");

  await recomputeCompleteness(profileId);
  return story;
}

export async function uploadCover(
  storyId: string,
  profileId: string,
  userId: string,
  buffer: Buffer,
) {
  const story = await Story.findOne({ _id: storyId, profileId });
  if (!story) throw new ApiError(404, "Story not found");

  if (story.coverPublicId) {
    await cloudinary.uploader.destroy(story.coverPublicId).catch(() => {});
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `byu-connect/stories/${userId}/${storyId}`,
          upload_preset: "cover_preset",
          resource_type: "image",
        },
        (err, r) => (err || !r ? reject(err) : resolve(r as { secure_url: string; public_id: string })),
      );
      stream.end(buffer);
    },
  );

  story.coverUrl = result.secure_url;
  story.coverPublicId = result.public_id;
  await story.save();
  return story;
}

export async function deleteStory(storyId: string, profileId: string) {
  const story = await Story.findOne({ _id: storyId, profileId });
  if (!story) throw new ApiError(404, "Story not found");

  if (story.coverPublicId) {
    await cloudinary.uploader.destroy(story.coverPublicId).catch(() => {});
  }

  await story.deleteOne();
  await recomputeCompleteness(profileId);
}
