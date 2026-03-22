import { Model, model, models } from "mongoose";
import { adminAuditLogSchema, webhookEventSchema } from "../schemas/security.schema";

export const AdminAuditLog = (models.AdminAuditLog as Model<any>) || model("AdminAuditLog", adminAuditLogSchema);
export const WebhookEvent = (models.WebhookEvent as Model<any>) || model("WebhookEvent", webhookEventSchema);
