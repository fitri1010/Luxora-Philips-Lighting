/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromAuthHeader, runCopilot } from "./_lib/core";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Sesi tidak valid. Silakan masuk kembali." });
    return;
  }
  const r = await runCopilot(req.body || {});
  res.status(r.status).json(r.body);
}
