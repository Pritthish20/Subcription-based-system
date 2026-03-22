import { Router } from "express";
import { listDrawResultsController, publishDrawController, simulateDrawController } from "../controllers/draw.controller";
import { authenticate, authorize, validateBody } from "../middlewares";
import { drawPublishSchema, drawSimulationSchema } from "../validators/draw.validator";

const router = Router();

router.post("/simulate", authenticate, authorize("admin"), validateBody(drawSimulationSchema), simulateDrawController);
router.post("/publish", authenticate, authorize("admin"), validateBody(drawPublishSchema), publishDrawController);
router.get("/results", listDrawResultsController);

export default router;