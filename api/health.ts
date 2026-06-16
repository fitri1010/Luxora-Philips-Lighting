/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAiEnabled } from "./_lib/core";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({ status: "ok", aiEnabled: isAiEnabled() });
}
