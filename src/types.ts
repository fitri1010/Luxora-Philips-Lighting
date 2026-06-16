/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MarketplaceOrder {
  order_id: string;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  province: string;
  city: string;
  district: string;
  product_name: string;
  category: string;
  sku: string;
  qty: number;
  unit_price: number;
  gross_sales: number;
  discount: number;
  net_sales: number;
  order_status: "Completed" | "Returned" | "Cancelled" | "Delivered" | "Processing";
  // Per-order fees for the Gharar/Zalim audit (PRD F-20/F-21, BR-COST-002/003).
  // A missing admin_fee/service_fee = Gharar (biaya tidak eksplisit).
  admin_fee?: number;
  service_fee?: number;
  handling_fee?: number;
  shipping_paid_by_buyer?: number;       // ongkir dibayar pembeli
  shipping_forwarded_to_courier?: number; // ongkir diteruskan ke kurir
}

export interface POSTransaction {
  transaction_id: string;
  cashier_name: string;
  transaction_date: string;
  customer_name: string;
  product_name: string;
  qty: number;
  selling_price: number;
  total_amount: number;
  payment_method: "QRIS" | "OVO" | "GoPay" | "DANA" | "ShopeePay" | "Transfer" | "Cash";
}

export interface OperationalCost {
  id: string;
  month: string; // e.g. "2026-06"
  admin_fee_shopee: number;
  service_fee: number;
  handling_fee: number;
  shipping_fee: number;
  packing_fee: number;
  insurance_fee: number;
  advertising_cost: number;
  affiliate_cost: number;
}

export interface InventoryItem {
  sku: string;
  product_name: string;
  stock_beginning: number;
  stock_in: number;
  stock_out: number;
  stock_return: number;
  stock_ending: number;
  minimum_stock: number;
  cost_price: number; // For COGS calculations
}

export interface RiskItem {
  id: string;
  order_id?: string;
  product_name: string;
  sku: string;
  return_status: "Pending" | "Approved" | "Rejected";
  return_reason?: string;
  cancel_reason?: string;
  damaged_goods: boolean;
  lost_package: boolean;
  return_loss: number;
  date: string;
  qty?: number;
  // Return inspection lifecycle (BR-STK-003)
  inspection_status?: "PENDING_INSPECTION" | "RESTOCKED" | "DAMAGED_WRITE_OFF";
}

export interface AnomalyLog {
  id: string;
  type: "Double Order" | "Cost Spike" | "Revenue Drop" | "Return Spike";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  date: string;
  status: "Flagged" | "Resolved" | "Ignored";
  impact_value: number;
  metadata?: Record<string, string | number>;
}

export interface ShariaMetrics {
  transparency: number; // 0-100
  amanah: number;       // 0-100 (trustworthiness / fulfilled orders/quality)
  keadilan: number;     // 0-100 (fair pricing, accurate weight, discounts clear)
  bebas_gharar: number; // 0-100 (no deception, clear stock descriptions, real items)
  bebas_zalim: number;  // 0-100 (fair treatment of courier, zero chargeback abuse)
  bebas_riba: number;   // 0-100 (sharia-certified POS gateway, no late fees, cash flow check)
  kepatuhan_zakat: number; // 0-100 (timely zakat estimation)
}

export interface ZakatRecord {
  id: string;
  date: string;
  calculated_wealth: number;
  zakat_amount: number;
  nishab_status: "Reached" | "Not Reached";
  payment_status: "Paid" | "Pending";
  channel?: string;
}

export interface BusinessRecommendation {
  id: string;
  title: string;
  description: string;
  category: "Inventory" | "Marketing" | "Pricing" | "Operation" | "Sharia";
  impact: "High" | "Medium" | "Low";
  actionText: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
