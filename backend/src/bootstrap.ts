import { configureCloudinary, connectDb } from "./config";
import { ensureDefaultPlans, ensureSeedData } from "./services/seed.service";

const globalCache = globalThis as typeof globalThis & {
  backendBootstrapPromise?: Promise<void>;
};

export async function initializeBackend() {
  if (!globalCache.backendBootstrapPromise) {
    globalCache.backendBootstrapPromise = (async () => {
      configureCloudinary();
      await connectDb();
      await ensureDefaultPlans();
      await ensureSeedData();
    })();
  }

  return globalCache.backendBootstrapPromise;
}
