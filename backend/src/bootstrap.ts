import { configureCloudinary, connectDb } from "./config";

const globalCache = globalThis as typeof globalThis & {
  backendBootstrapPromise?: Promise<void>;
};

export async function initializeBackend() {
  if (!globalCache.backendBootstrapPromise) {
    globalCache.backendBootstrapPromise = (async () => {
      configureCloudinary();
      await connectDb();
    })();
  }

  return globalCache.backendBootstrapPromise;
}
