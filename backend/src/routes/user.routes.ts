import { Router } from "express";
import {
  createScoreController,
  donationController,
  listScoresController,
  meController,
  submitWinnerProofController,
  subscriberDashboardController,
  updateMeController,
  updateScoreController,
  winnerProofSignatureController
} from "../controllers/user.controller";
import { authenticate, hydrateSubscriptionAccess, requireActiveSubscription, validateBody, validateParams } from "../middlewares";
import { idParamSchema } from "../validators/common.validator";
import { oneTimeDonationSchema, scoreSchema, updateProfileSchema, winnerProofSchema } from "../validators/user.validator";

const router = Router();
const withSubscriberContext = [authenticate, hydrateSubscriptionAccess] as const;

router.post("/uploads/winner-proof-signature", ...withSubscriberContext, winnerProofSignatureController);
router.get("/me", ...withSubscriberContext, meController);
router.patch("/me", ...withSubscriberContext, validateBody(updateProfileSchema), updateMeController);
router.get("/scores", ...withSubscriberContext, requireActiveSubscription, listScoresController);
router.post("/scores", ...withSubscriberContext, requireActiveSubscription, validateBody(scoreSchema), createScoreController);
router.patch("/scores/:id", ...withSubscriberContext, requireActiveSubscription, validateParams(idParamSchema), validateBody(scoreSchema), updateScoreController);
router.post("/donations", ...withSubscriberContext, requireActiveSubscription, validateBody(oneTimeDonationSchema), donationController);
router.get("/dashboard/subscriber", ...withSubscriberContext, subscriberDashboardController);
router.post("/winner-claims/:id/proof", ...withSubscriberContext, validateParams(idParamSchema), validateBody(winnerProofSchema), submitWinnerProofController);

export default router;
