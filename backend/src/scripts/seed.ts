import "dotenv/config";
import { configureCloudinary, connectDb } from "../config";
import { ensureDefaultPlans, ensureSeedData } from "../services/seed.service";

async function seed() {
  configureCloudinary();
  await connectDb();
  await ensureDefaultPlans();
  await ensureSeedData();
  console.log("Seed completed successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
