/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * One-off: seed the demo account (safitri@tazkia.ac.id) — create a shop and fill
 * the normalized per-shop tables with the sample dataset. New accounts stay empty.
 *
 * Run: npx tsx scripts/seed-demo.ts
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  initialMarketplaceOrders,
  initialPOSTransactions,
  initialInventoryItems,
  initialRiskItems,
  initialZakatHistory,
  initialRecommendations
} from "../src/data/seedData";
import { AnomalyLog } from "../src/types";

dotenv.config();

const URL = process.env.VITE_SUPABASE_URL || "";
const KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const EMAIL = "safitri@tazkia.ac.id";
const PASSWORD = "rahasia123";

const anomalies: AnomalyLog[] = [
  {
    id: "ANM-001",
    type: "Double Order",
    title: "Double Order Terdeteksi (Muhammad Rizky)",
    description:
      "Pelanggan melakukan order berulang untuk 'Lampu Kubah Slim' (LMP-KUB-LED-01) senilai IDR 650.000 dalam selang 5 menit menggunakan alamat yang identik.",
    severity: "high",
    status: "Flagged",
    date: "2026-06-14",
    impact_value: 650000,
    metadata: { customer: "Muhammad Rizky", sku: "LMP-KUB-LED-01" }
  },
  {
    id: "ANM-002",
    type: "Cost Spike",
    title: "Shopee Ads Cost Spike",
    description:
      "Biaya promosi kata kunci harian Shopee melambung melampaui rata-rata harian normal (+IDR 350.000) dibanding minggu lalu.",
    severity: "medium",
    status: "Flagged",
    date: "2026-06-13",
    impact_value: 350000,
    metadata: { diff_amount: "350000" }
  }
];

const aiInsights = [
  "Lampu LED 18 Watt menjadi produk dengan kontribusi laba tertinggi bulan ini. Namun tingkat return meningkat 6% di wilayah Jawa Timur akibat kerusakan saat pengiriman.",
  "Shopee Ads ROI saat ini stabil di angka 4.5x. Mengurangi budget bidding kata kunci berkonversi rendah dapat menghemat biaya OPEX hingga IDR 350.000.",
  "Kewajiban Zakat Perniagaan (Zakat Mal) terhitung sebesar IDR 1.250.000 berdasarkan total harta lancar perniagaan (Kas Likuid + Persediaan Barang Dagang)."
];

async function main() {
  if (!URL || !KEY) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset di .env");
  const supabase = createClient(URL, KEY);

  // Authenticate (sign up, else sign in)
  let session = (await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: { data: { name: "Safitri Haryanti", role: "OWNER", shop_name: "LUXORA Lighting Safitri" } }
  })).data.session;
  if (!session) {
    const si = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (si.error) throw new Error("Auth gagal: " + si.error.message);
    session = si.data.session;
  }
  if (!session) throw new Error("Tidak mendapat sesi.");
  const uid = session.user.id;

  // Ensure a shop exists and the profile is linked to it
  let shop = (await supabase.from("shops").select("id, join_code").eq("owner_id", uid).maybeSingle()).data;
  if (!shop) {
    const ins = await supabase
      .from("shops")
      .insert({ name: "LUXORA Lighting Safitri", owner_id: uid })
      .select("id, join_code")
      .single();
    if (ins.error) throw new Error("Buat toko gagal: " + ins.error.message);
    shop = ins.data;
  }
  const shopId = shop!.id as string;
  await supabase.from("profiles").update({ shop_id: shopId }).eq("id", uid);

  const upsert = async (table: string, rows: Record<string, unknown>[], pk: string) => {
    const payload = rows.map((r) => ({ ...r, shop_id: shopId }));
    const { error } = await supabase.from(table).upsert(payload, { onConflict: `shop_id,${pk}` });
    if (error) throw new Error(`${table}: ${error.message}`);
  };

  await upsert("orders", initialMarketplaceOrders as unknown as Record<string, unknown>[], "order_id");
  await upsert("pos_transactions", initialPOSTransactions as unknown as Record<string, unknown>[], "transaction_id");
  await upsert("inventory_items", initialInventoryItems as unknown as Record<string, unknown>[], "sku");
  await upsert("risk_items", initialRiskItems as unknown as Record<string, unknown>[], "id");
  await upsert("zakat_records", initialZakatHistory as unknown as Record<string, unknown>[], "id");
  await upsert("anomalies", anomalies as unknown as Record<string, unknown>[], "id");

  const { error: setErr } = await supabase.from("shop_settings").upsert({
    shop_id: shopId,
    doc: {
      recommendations: initialRecommendations,
      aiInsights,
      companyName: "LUXORA Lighting Safitri",
      shopeeStore: "luxora.safitri"
    }
  });
  if (setErr) throw new Error("shop_settings: " + setErr.message);

  console.log("✓ Seed berhasil:", EMAIL);
  console.log("  shop:", shopId, "| join_code:", shop!.join_code);
  console.log("  orders:", initialMarketplaceOrders.length, "| inventory:", initialInventoryItems.length, "| pos:", initialPOSTransactions.length);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
