import type { CharityInput } from "../../../shared/src/index";
import { ApiError, runService } from "../lib/http";
import { Charity } from "../models";
import { recordAdminAction } from "./audit.service";

export async function listCharities(search = "") {
  return runService("charity.service", "listCharities", async () => {
    const filter = search ? { $or: [{ name: new RegExp(search, "i") }, { category: new RegExp(search, "i") }] } : {};
    return Charity.find(filter).sort({ featured: -1, createdAt: -1 });
  });
}

export async function getCharityBySlug(slug: string) {
  return runService("charity.service", "getCharityBySlug", async () => {
    const charity = await Charity.findOne({ slug });
    if (!charity) throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });
    return charity;
  });
}

export async function createCharity(payload: CharityInput, adminId?: string) {
  return runService("charity.service", "createCharity", async () => {
    const charity = await Charity.create({ ...payload, events: payload.events.map((event: any) => ({ ...event, startsAt: new Date(event.startsAt) })) });

    if (adminId) {
      await recordAdminAction({
        adminId,
        action: "charity.created",
        targetType: "charity",
        targetId: charity._id.toString(),
        after: charity
      });
    }

    return charity;
  });
}

export async function updateCharity(id: string, payload: CharityInput, adminId?: string) {
  return runService("charity.service", "updateCharity", async () => {
    const before = await Charity.findById(id);
    if (!before) throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });

    const charity = await Charity.findByIdAndUpdate(id, { ...payload, events: payload.events.map((event: any) => ({ ...event, startsAt: new Date(event.startsAt) })) }, { new: true });
    if (!charity) throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });

    if (adminId) {
      await recordAdminAction({
        adminId,
        action: "charity.updated",
        targetType: "charity",
        targetId: charity._id.toString(),
        before,
        after: charity
      });
    }

    return charity;
  });
}

export async function deleteCharity(id: string, adminId?: string) {
  return runService("charity.service", "deleteCharity", async () => {
    const charity = await Charity.findById(id);
    if (!charity) throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });

    await Charity.findByIdAndDelete(id);

    if (adminId) {
      await recordAdminAction({
        adminId,
        action: "charity.deleted",
        targetType: "charity",
        targetId: charity._id.toString(),
        before: charity,
        after: { deleted: true }
      });
    }

    return { deleted: true };
  });
}
