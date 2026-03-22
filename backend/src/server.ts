import "dotenv/config";
import { createApp } from "./app";
import { initializeBackend } from "./bootstrap";

async function bootstrap() {
  await initializeBackend();

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
