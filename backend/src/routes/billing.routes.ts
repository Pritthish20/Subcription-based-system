import { Router } from "express";
import {
  cancelSubscriptionController,
  checkoutController,
  listPlansController,
  verifyDonationController,
  verifySubscriptionController,
  webhookController
} from "../controllers/billing.controller";
import { authenticate, validateBody } from "../middlewares";
import {
  cancelSubscriptionSchema,
  checkoutSchema,
  verifyDonationPaymentSchema,
  verifySubscriptionPaymentSchema
} from "../validators/billing.validator";

const router = Router();

router.get("/plans", listPlansController);
router.post("/checkout", authenticate, validateBody(checkoutSchema), checkoutController);
router.post("/verify/subscription", authenticate, validateBody(verifySubscriptionPaymentSchema), verifySubscriptionController);
router.post("/verify/donation", authenticate, validateBody(verifyDonationPaymentSchema), verifyDonationController);
router.post("/cancel", authenticate, validateBody(cancelSubscriptionSchema), cancelSubscriptionController);
router.post("/webhook", webhookController);

export default router;
