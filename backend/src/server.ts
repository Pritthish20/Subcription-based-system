import "dotenv/config";
import { createApp } from "./app";
import { configureCloudinary, connectDb } from "./config";
import { ensureDefaultPlans, ensureSeedData } from "./services/seed.service";

async function bootstrap() {
  configureCloudinary();
  await connectDb();
  await ensureDefaultPlans();
  await ensureSeedData();

  const port = Number(process.env.PORT ?? 4000);
  const app = createApp();

  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
