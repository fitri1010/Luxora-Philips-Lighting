/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketplaceOrder } from "../types";

// Per-transaction Gharar / Zalim audit (PRD F-20/F-21, BR-COST-002 & BR-COST-003,
// AI_SPEC PROMPT-SYARIAH-002).

export type AuditStatus = "COMPLIANT" | "GHARAR" | "ZALIM" | "GHARAR+ZALIM";

export interface OrderAudit {
  order: MarketplaceOrder;
  flagGharar: boolean;
  flagZalim: boolean;
  detailGharar: string | null;
  detailZalim: string | null;
  zalimAmount: number;
  status: AuditStatus;
}

const idr = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

/** Audit a single order for gharar (hidden/implicit fees) and zalim (shipping overcharge). */
export function auditOrder(o: MarketplaceOrder): OrderAudit {
  // GHARAR: required cost components must have explicit values (BR-COST-002)
  const missing: string[] = [];
  if (o.admin_fee == null) missing.push("Admin Fee");
  if (o.service_fee == null) missing.push("Service Fee");
  const flagGharar = missing.length > 0;
  const detailGharar = flagGharar ? `Biaya tidak eksplisit: ${missing.join(", ")}` : null;

  // ZALIM: ongkir dibayar pembeli tidak boleh > ongkir diteruskan ke kurir (BR-COST-003)
  let flagZalim = false;
  let detailZalim: string | null = null;
  let zalimAmount = 0;
  if (o.shipping_paid_by_buyer != null && o.shipping_forwarded_to_courier != null) {
    const diff = o.shipping_paid_by_buyer - o.shipping_forwarded_to_courier;
    if (diff > 0) {
      flagZalim = true;
      zalimAmount = diff;
      detailZalim = `Ongkir pembeli ${idr(o.shipping_paid_by_buyer)} > ke kurir ${idr(o.shipping_forwarded_to_courier)} (lebih ${idr(diff)})`;
    }
  }

  const status: AuditStatus =
    flagGharar && flagZalim ? "GHARAR+ZALIM" : flagGharar ? "GHARAR" : flagZalim ? "ZALIM" : "COMPLIANT";

  return { order: o, flagGharar, flagZalim, detailGharar, detailZalim, zalimAmount, status };
}

export interface AuditSummary {
  audits: OrderAudit[];
  flagged: OrderAudit[];
  total: number;
  compliant: number;
  gharar: number;
  zalim: number;
  totalOvercharge: number;
}

export function auditOrders(orders: MarketplaceOrder[]): AuditSummary {
  const audits = orders.map(auditOrder);
  return {
    audits,
    flagged: audits.filter((a) => a.status !== "COMPLIANT"),
    total: audits.length,
    compliant: audits.filter((a) => a.status === "COMPLIANT").length,
    gharar: audits.filter((a) => a.flagGharar).length,
    zalim: audits.filter((a) => a.flagZalim).length,
    totalOvercharge: audits.reduce((s, a) => s + a.zalimAmount, 0)
  };
}
