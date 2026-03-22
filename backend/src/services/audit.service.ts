import { runService } from "../lib/http";
import { AdminAuditLog } from "../models";

function toSnapshot(value: unknown) {
  if (value === undefined || value === null) return value;

  const candidate = value as { toObject?: () => unknown };
  const raw = typeof candidate.toObject === "function" ? candidate.toObject() : value;
  return JSON.parse(JSON.stringify(raw));
}

type AdminAuditInput = {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  meta?: Record<string, unknown>;
};

export async function recordAdminAction(input: AdminAuditInput) {
  return runService("audit.service", "recordAdminAction", async () => {
    return AdminAuditLog.create({
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      before: toSnapshot(input.before),
      after: toSnapshot(input.after),
      meta: input.meta ?? {}
    });
  });
}
