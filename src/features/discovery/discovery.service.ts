import mongoose from "mongoose";
import { Profile } from "../profile/profile.model";
import { Service } from "../services/services.model";
import { SERVICE_CATEGORIES } from "../../config/constants";

export async function getCategories() {
  const counts = await Service.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return SERVICE_CATEGORIES.map((cat) => ({
    key: cat,
    count: countMap[cat] ?? 0,
  })).filter((c) => c.count > 0);
}

export async function getFeatured() {
  const pipeline: mongoose.PipelineStage[] = [
    { $match: { isFeatured: true, isPublic: true } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { "user.isSuspended": false } },
    { $sort: { featuredOrder: 1 } },
    {
      $addFields: { isVerified: { $cond: [{ $ifNull: ["$user.studentEmailVerifiedAt", false] }, true, false] } },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatarUrl: 1,
        bio: 1,
        department: 1,
        serviceCategories: 1,
        completenessScore: 1,
        viewCount: 1,
        isVerified: 1,
        featuredOrder: 1,
      },
    },
  ];

  return Profile.aggregate(pipeline);
}

export async function discover(params: {
  q?: string;
  category?: string;
  verified?: string;
  sort?: string;
  cursor?: string;
  limit: number;
}) {
  const { q, category, verified, sort, cursor, limit } = params;

  const pipeline: mongoose.PipelineStage[] = [];

  if (q) {
    pipeline.push({ $match: { $text: { $search: q } } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $match: { isPublic: true, "user.isSuspended": false } },
  );

  if (verified === "true") {
    pipeline.push({ $match: { "user.studentEmailVerifiedAt": { $ne: null } } });
  }

  if (category) {
    pipeline.push({ $match: { serviceCategories: category } });
  }

  if (cursor) {
    try {
      const cursorId = new mongoose.Types.ObjectId(cursor);
      pipeline.push({ $match: { _id: { $lt: cursorId } } });
    } catch {
      // ignore invalid cursor
    }
  }

  pipeline.push({
    $addFields: { isVerified: { $cond: [{ $ifNull: ["$user.studentEmailVerifiedAt", false] }, true, false] } },
  });

  const sortStage: Record<string, 1 | -1 | { $meta: "textScore" }> = q
    ? { score: { $meta: "textScore" }, isVerified: -1 }
    : sort === "alphabetical"
    ? { isVerified: -1, fullName: 1 }
    : sort === "popular"
    ? { isVerified: -1, viewCount: -1 }
    : { isVerified: -1, createdAt: -1 };

  pipeline.push(
    { $sort: sortStage },
    { $limit: limit + 1 },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatarUrl: 1,
        bio: 1,
        department: 1,
        year: 1,
        serviceCategories: 1,
        completenessScore: 1,
        viewCount: 1,
        isVerified: 1,
        createdAt: 1,
      },
    },
  );

  const results = await Profile.aggregate(pipeline);

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const nextCursor =
    hasMore && items.length > 0 ? String(items[items.length - 1]._id) : null;

  return { items, nextCursor };
}
