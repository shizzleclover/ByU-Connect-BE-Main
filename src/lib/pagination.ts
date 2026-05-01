import mongoose from "mongoose";

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export function buildCursorFilter(cursor?: string): Record<string, unknown> {
  if (!cursor) return {};
  try {
    const id = new mongoose.Types.ObjectId(cursor);
    return { _id: { $lt: id } };
  } catch {
    return {};
  }
}

export function getNextCursor<T extends { _id: unknown }>(
  items: T[],
  limit: number,
): string | null {
  if (items.length < limit) return null;
  const last = items[items.length - 1];
  return last._id ? String(last._id) : null;
}
