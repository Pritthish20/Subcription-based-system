import { Router } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import billingRoutes from "./billing.routes";
import charityRoutes from "./charity.routes";
import drawRoutes from "./draw.routes";
import userRoutes from "./user.routes";

export function createApiRouter() {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok" } });
  });

  router.use("/auth", authRoutes);
  router.use("/billing", billingRoutes);
  router.use("/charities", charityRoutes);
  router.use(userRoutes);
  router.use("/draws", drawRoutes);
  router.use(adminRoutes);

  return router;
}
