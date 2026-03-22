import "dotenv/config";
import { createApp } from "../src/app";
import { initializeBackend } from "../src/bootstrap";

const app = createApp();

export default async function handler(req: any, res: any) {
  await initializeBackend();
  return app(req, res);
}
