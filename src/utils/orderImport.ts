/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from "xlsx";
import { MarketplaceOrder } from "../types";

// Parse a Shopee-style CSV/XLSX export into MarketplaceOrder[] (PRD F-01, PB-TRX-005,
// header mapping per AI_SPEC §2.6). Robust to common Indonesian & simple English headers.

type Row = Record<string, unknown>;

const ALIAS = {
  id: ["no. pesanan", "no pesanan", "order id", "order_id", "id pesanan"],
  date: ["waktu pesanan dibuat", "tanggal", "tanggal pesanan", "order date", "order_date"],
  product: ["nama produk", "produk", "product", "product_name"],
  sku: ["sku", "nomor referensi sku", "kode variasi"],
  qty: ["jumlah", "qty", "quantity"],
  unitPrice: ["harga awal (idr)", "harga satuan", "unit price", "unit_price", "harga"],
  total: ["total harga produk (idr)", "total", "total_harga"],
  discount: ["diskon produk dari penjual (idr)", "diskon", "discount"],
  province: ["provinsi", "province"],
  city: ["kota", "city"],
  buyer: ["nama penerima", "nama pembeli", "customer", "pembeli"],
  status: ["status pesanan", "status"],
  adminFee: ["biaya administrasi (idr)", "admin fee", "admin_fee"],
  serviceFee: ["biaya layanan (idr)", "service fee", "service_fee"],
  shipBuyer: ["ongkos kirim dibayar oleh pembeli (idr)", "ongkir pembeli", "shipping_paid_by_buyer"],
  shipCourier: ["ongkir diteruskan ke kurir", "ongkir kurir", "shipping_forwarded_to_courier"]
};

function normalizeRow(row: Row): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row)) out[k.toLowerCase().trim()] = row[k];
  return out;
}

function pick(r: Record<string, unknown>, aliases: string[]): unknown {
  for (const a of aliases) {
    if (a in r && r[a] !== null && r[a] !== "") return r[a];
  }
  return undefined;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const cleaned = String(v).replace(/[^0-9-]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function parseDate(v: unknown): string {
  if (!v) return new Date().toISOString();
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function normalizeStatus(v: unknown): MarketplaceOrder["order_status"] {
  const s = String(v || "").toLowerCase();
  if (s.includes("selesai")) return "Completed";
  if (s.includes("batal")) return "Cancelled";
  if (s.includes("kembali") || s.includes("return") || s.includes("pengembalian")) return "Returned";
  if (s.includes("kirim")) return "Delivered";
  return "Processing";
}

function mapRow(raw: Row, index: number): MarketplaceOrder {
  const r = normalizeRow(raw);

  const product = pick(r, ALIAS.product);
  if (!product) throw new Error("Nama produk kosong");

  const qty = num(pick(r, ALIAS.qty)) || 1;
  if (qty < 1 || qty > 9999) throw new Error(`Qty tidak valid (${qty})`);

  const unit = num(pick(r, ALIAS.unitPrice));
  const totalRaw = num(pick(r, ALIAS.total));
  const discount = num(pick(r, ALIAS.discount));
  const gross = totalRaw || unit * qty;
  if (gross <= 0) throw new Error("Harga/total tidak valid");
  const unitPrice = unit || Math.round(gross / qty);
  const net = Math.max(0, gross - discount);

  const id = pick(r, ALIAS.id) ? String(pick(r, ALIAS.id)) : `IMP-${Date.now().toString(36)}-${index}`;

  const order: MarketplaceOrder = {
    order_id: id,
    order_date: parseDate(pick(r, ALIAS.date)),
    customer_name: pick(r, ALIAS.buyer) ? String(pick(r, ALIAS.buyer)) : "Pembeli Shopee",
    customer_phone: "",
    province: pick(r, ALIAS.province) ? String(pick(r, ALIAS.province)) : "Lainnya",
    city: pick(r, ALIAS.city) ? String(pick(r, ALIAS.city)) : "-",
    district: "-",
    product_name: String(product),
    category: "Imported",
    sku: pick(r, ALIAS.sku) ? String(pick(r, ALIAS.sku)) : "IMP-SKU",
    qty,
    unit_price: unitPrice,
    gross_sales: gross,
    discount,
    net_sales: net,
    order_status: normalizeStatus(pick(r, ALIAS.status))
  };

  // Optional fees (feed the Gharar/Zalim audit). Absence is left undefined on purpose.
  const adminFee = pick(r, ALIAS.adminFee);
  const serviceFee = pick(r, ALIAS.serviceFee);
  const shipBuyer = pick(r, ALIAS.shipBuyer);
  const shipCourier = pick(r, ALIAS.shipCourier);
  if (adminFee !== undefined) order.admin_fee = num(adminFee);
  if (serviceFee !== undefined) order.service_fee = num(serviceFee);
  if (shipBuyer !== undefined) order.shipping_paid_by_buyer = num(shipBuyer);
  if (shipCourier !== undefined) order.shipping_forwarded_to_courier = num(shipCourier);

  return order;
}

export interface ParseResult {
  orders: MarketplaceOrder[];
  errors: string[];
}

export async function parseOrdersFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { orders: [], errors: ["File tidak memiliki sheet yang dapat dibaca."] };

  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null });
  const orders: MarketplaceOrder[] = [];
  const errors: string[] = [];

  rows.forEach((row, i) => {
    try {
      orders.push(mapRow(row, i));
    } catch (e) {
      errors.push(`Baris ${i + 2}: ${e instanceof Error ? e.message : "gagal diproses"}`);
    }
  });

  return { orders, errors };
}
