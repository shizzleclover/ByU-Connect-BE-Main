import { Profile } from "../profile/profile.model";
import { Service } from "./services.model";
import { ApiError } from "../../lib/apiError";
import { recomputeCompleteness } from "../../lib/completeness";

const SERVICE_LIMIT = 12;

export async function getServices(profileId: string) {
  return Service.find({ profileId }).sort({ order: 1 }).lean();
}

export async function createService(
  profileId: string,
  data: {
    category: string;
    title: string;
    description: string;
    startingPrice?: number | null;
    currency?: string;
    isNegotiable?: boolean;
  },
) {
  const count = await Service.countDocuments({ profileId });
  if (count >= SERVICE_LIMIT) {
    throw new ApiError(400, `Maximum ${SERVICE_LIMIT} services allowed`);
  }

  const service = await Service.create({ profileId, ...data, order: count } as Parameters<typeof Service.create>[0]);

  // Update denormalized serviceCategories on profile
  await syncServiceCategories(profileId);
  await recomputeCompleteness(profileId);

  return service;
}

export async function updateService(
  serviceId: string,
  profileId: string,
  data: Partial<{ category: string; title: string; description: string; startingPrice: number | null; currency: string; isNegotiable: boolean }>,
) {
  const service = await Service.findOneAndUpdate(
    { _id: serviceId, profileId },
    data,
    { new: true },
  );
  if (!service) throw new ApiError(404, "Service not found");

  await syncServiceCategories(profileId);
  return service;
}

export async function deleteService(serviceId: string, profileId: string) {
  const service = await Service.findOneAndDelete({ _id: serviceId, profileId });
  if (!service) throw new ApiError(404, "Service not found");

  // Re-index order
  const remaining = await Service.find({ profileId }).sort({ order: 1 });
  await Promise.all(
    remaining.map((s, i) => Service.findByIdAndUpdate(s._id, { order: i })),
  );

  await syncServiceCategories(profileId);
  await recomputeCompleteness(profileId);
}

export async function reorderServices(profileId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, i) =>
      Service.findOneAndUpdate({ _id: id, profileId }, { order: i }),
    ),
  );
}

async function syncServiceCategories(profileId: string) {
  const services = await Service.find({ profileId }).distinct("category");
  await Profile.findByIdAndUpdate(profileId, { serviceCategories: services });
}
