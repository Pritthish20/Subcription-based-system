import { Model, model, models } from "mongoose";
import { notificationSchema } from "../schemas/notification.schema";

export const NotificationLog = (models.NotificationLog as Model<any>) || model("NotificationLog", notificationSchema);
