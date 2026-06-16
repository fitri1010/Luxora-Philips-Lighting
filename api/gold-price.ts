/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGoldPriceResponse } from "./_lib/core";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.json(await getGoldPriceResponse());
}
