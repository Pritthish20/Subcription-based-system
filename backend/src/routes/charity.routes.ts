import { Router } from "express";
import { charityDetailController, createCharityController, deleteCharityController, listCharitiesController, updateCharityController } from "../controllers/charity.controller";
import { authenticate, authorize, validateBody, validateParams, validateQuery } from "../middlewares";
import { charitySchema, charityListQuerySchema, charitySlugParamSchema } from "../validators/charity.validator";
import { idParamSchema } from "../validators/common.validator";

const router = Router();

router.get("/", validateQuery(charityListQuerySchema), listCharitiesController);
router.get("/:slug", validateParams(charitySlugParamSchema), charityDetailController);
router.post("/", authenticate, authorize("admin"), validateBody(charitySchema), createCharityController);
router.patch("/:id", authenticate, authorize("admin"), validateParams(idParamSchema), validateBody(charitySchema), updateCharityController);
router.delete("/:id", authenticate, authorize("admin"), validateParams(idParamSchema), deleteCharityController);

export default router;

