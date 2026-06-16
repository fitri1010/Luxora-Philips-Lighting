/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local dev (and Render-style) server: Express + Vite middleware.
 * Vercel deployments do NOT use this file — they use the api/*.ts functions.
 * All API logic lives in api/_lib/core.ts (shared single source of truth).
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  isAiEnabled,
  getGoldPriceResponse,
  getUserFromAuthHeader,
  runCopilot,
  runPredict,
  runInsights
} from "./api/_lib/core";

const app = express();
const PORT = 3000;
app.use(express.json({ limit: "5mb" }));

// ---- API ENDPOINTS (mirror the Vercel functions in api/) ----
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiEnabled: isAiEnabled() });
});

app.get("/api/gold-price", async (_req, res) => {
  res.json(await getGoldPriceResponse());
});

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Sesi tidak valid. Silakan masuk kembali." });
    return;
  }
  (req as express.Request & { user?: unknown }).user = user;
  next();
}

app.post("/api/copilot", requireAuth, async (req, res) => {
  const r = await runCopilot(req.body || {});
  res.status(r.status).json(r.body);
});

app.post("/api/predict", requireAuth, async (req, res) => {
  const r = await runPredict(req.body || {});
  res.status(r.status).json(r.body);
});

app.post("/api/insights", requireAuth, async (req, res) => {
  const r = await runInsights(req.body || {});
  res.status(r.status).json(r.body);
});

// ---- VITE CLIENT INTEGRATION ----
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("LUXORA - Starting Vite in middleware mode (Development)...");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    console.log("LUXORA - Serving production build...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LUXORA Active - listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
