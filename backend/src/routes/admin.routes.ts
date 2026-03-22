import { Router } from "express";
import {
  adminDashboardController,
  adminScoresController,
  adminSubscriptionsController,
  adminUsersController,
  adminWinnerClaimsController,
  payWinnerController,
  reviewWinnerController,
  updateAdminScoreController,
  updateAdminSubscriptionController,
  updateAdminUserController
} from "../controllers/admin.controller";
import { authenticate, authorize, validateBody, validateParams } from "../middlewares";
import { adminSubscriptionUpdateSchema, adminUserUpdateSchema } from "../validators/admin.validator";
import { idParamSchema } from "../validators/common.validator";
import { scoreSchema } from "../validators/user.validator";
import { payoutUpdateSchema, winnerReviewSchema } from "../validators/winner.validator";

const router = Router();

router.get("/dashboard/admin", authenticate, authorize("admin"), adminDashboardController);
router.get("/admin/users", authenticate, authorize("admin"), adminUsersController);
router.patch("/admin/users/:id", authenticate, authorize("admin"), validateParams(idParamSchema), validateBody(adminUserUpdateSchema), updateAdminUserController);
router.get("/admin/subscriptions", authenticate, authorize("admin"), adminSubscriptionsController);
router.patch("/admin/subscriptions/:id", authenticate, authorize("admin"), validateParams(idParamSchema), validateBody(adminSubscriptionUpdateSchema), updateAdminSubscriptionController);
router.get("/admin/scores", authenticate, authorize("admin"), adminScoresController);
router.patch("/admin/scores/:id", authenticate, authorize("admin"), validateParams(idParamSchema), validateBody(scoreSchema), updateAdminScoreController);
router.get("/admin/winner-claims", authenticate, authorize("admin"), adminWinnerClaimsController);
router.post("/admin/winner-claims/:id/review", authenticate, authorize("admin"), validateParams(idParamSchema), validateBody(winnerReviewSchema), reviewWinnerController);
router.post("/admin/winner-claims/:id/pay", authenticate, authorize("admin"), validateParams(idParamSchema), validateBody(payoutUpdateSchema), payWinnerController);

export default router;