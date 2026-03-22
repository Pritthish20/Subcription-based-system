import { InferSchemaType, Model, model, models } from "mongoose";
import { drawCycleSchema, drawSimulationSchema } from "../schemas/draw.schema";

export type DrawCycleDoc = InferSchemaType<typeof drawCycleSchema>;
export const DrawCycle = (models.DrawCycle as Model<DrawCycleDoc>) || model<DrawCycleDoc>("DrawCycle", drawCycleSchema);
export const DrawSimulation = (models.DrawSimulation as Model<any>) || model("DrawSimulation", drawSimulationSchema);
