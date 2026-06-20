/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared backend logic used by BOTH the local dev Express server (server.ts)
 * and the Vercel serverless functions (api/*.ts). Single source of truth.
 */

import dotenv from "dotenv";

dotenv.config();

// Heavy SDKs (@google/genai, @supabase/supabase-js) are imported LAZILY (dynamic
// import) so they never load at serverless cold-start. Loading them eagerly was
// crashing every Vercel function (FUNCTION_INVOCATION_FAILED), even /api/health.

// ---- Gemini client (only constructed when a key is present) ----
async function getAiClient(): Promise<{ ai: any; Type: any } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
  const genai = await import("@google/genai");
  return {
    ai: new genai.GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } }),
    Type: genai.Type
  };
}
export function isAiEnabled(): boolean {
  const k = process.env.GEMINI_API_KEY;
  return !!(k && k !== "MY_GEMINI_API_KEY");
}

// ---- Supabase client (lazy) ----
let _sb: any | null | undefined;
async function getSb(): Promise<any | null> {
  if (_sb !== undefined) return _sb;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) {
    _sb = null;
    return _sb;
  }
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(url, key);
  return _sb;
}

/** Verify a Bearer token and return the Supabase user, or null. */
export async function getUserFromAuthHeader(authHeader?: string): Promise<any | null> {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const sb = await getSb();
  if (!token || !sb) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ---- Gold price (Zakat nishab) ----
const GOLD_FALLBACK_IDR_PER_GRAM = 1470000;
const GOLD_CACHE_TTL_MS = 60 * 60 * 1000;
const GRAMS_PER_TROY_OUNCE = 31.1034768;
let goldCache: { pricePerGram: number; source: string; updatedAt: string; ts: number } | null = null;

async function fetchGoldPriceIDRPerGram(): Promise<{ pricePerGram: number; source: string }> {
  const goldRes = await fetch("https://api.gold-api.com/price/XAU", { signal: AbortSignal.timeout(8000) });
  if (!goldRes.ok) throw new Error(`gold-api status ${goldRes.status}`);
  const goldJson: any = await goldRes.json();
  const usdPerOunce = Number(goldJson?.price);
  if (!usdPerOunce || Number.isNaN(usdPerOunce)) throw new Error("invalid gold price payload");

  const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(8000) });
  if (!fxRes.ok) throw new Error(`fx status ${fxRes.status}`);
  const fxJson: any = await fxRes.json();
  const usdToIdr = Number(fxJson?.rates?.IDR);
  if (!usdToIdr || Number.isNaN(usdToIdr)) throw new Error("invalid fx payload");

  return { pricePerGram: Math.round((usdPerOunce / GRAMS_PER_TROY_OUNCE) * usdToIdr), source: "Spot XAU (gold-api.com) × Kurs USD/IDR" };
}

export async function getGoldPriceResponse(): Promise<Record<string, unknown>> {
  if (goldCache && Date.now() - goldCache.ts < GOLD_CACHE_TTL_MS) {
    return { pricePerGram: goldCache.pricePerGram, source: goldCache.source, updatedAt: goldCache.updatedAt, fallback: false, cached: true };
  }
  try {
    const { pricePerGram, source } = await fetchGoldPriceIDRPerGram();
    goldCache = { pricePerGram, source, updatedAt: new Date().toISOString(), ts: Date.now() };
    return { pricePerGram, source, updatedAt: goldCache.updatedAt, fallback: false, cached: false };
  } catch (err: any) {
    if (goldCache) {
      return { pricePerGram: goldCache.pricePerGram, source: `${goldCache.source} (cache lama)`, updatedAt: goldCache.updatedAt, fallback: true, error: err?.message };
    }
    return { pricePerGram: GOLD_FALLBACK_IDR_PER_GRAM, source: "Nilai cadangan (offline)", updatedAt: new Date().toISOString(), fallback: true, error: err?.message };
  }
}

// ---- AI endpoints (return { status, body } for any transport) ----
export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function runCopilot(input: { prompt?: string; history?: any[]; dataContext?: any }): Promise<ApiResult> {
  const { prompt, history, dataContext } = input;
  if (!prompt) return { status: 400, body: { error: "Prompt is required" } };

  const client = await getAiClient();
  if (!client) return { status: 200, body: { text: generateExpertFallbackResponse(prompt, dataContext), fallback: true } };
  const { ai } = client;

  try {
    const systemInstruction = `Anda adalah LUXORA AI, asisten kecerdasan bisnis (BI) berbasis AI dan konsultan Akuntansi Syariah.
Tagline: "Illuminate Your Business Decisions with AI". Bantu pemilik bisnis lampu hias (Shopee, POS, Gudang) memantau & mengoptimalkan operasional sesuai syariah.
Data dashboard pengguna:
- Pendapatan Marketplace: IDR ${dataContext?.marketplaceTotalSales || "9.000.000"}
- POS Offline: IDR ${dataContext?.posTotalSales || "3.500.000"}
- Laba Kotor: IDR ${dataContext?.grossProfit || "5.000.000"} | Laba Bersih: IDR ${dataContext?.netProfit || "4.150.000"}
- Return: ${dataContext?.returnRate || "5"}% | Skor Syariah: ${dataContext?.shariaScore || "88"}/100
- Harta Wajib Zakat: IDR ${dataContext?.zakatWealth || "150.000.000"} | Ads ROI: ${dataContext?.adsRoi || "3.5"}x
Aturan: bahasa Indonesia santun & profesional, analisis tajam merujuk metrik di atas, ringkas, pakai bullet bila perlu.`;

    const previousTurns = (history || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [...previousTurns, { role: "user", parts: [{ text: prompt }] }],
      config: { systemInstruction, temperature: 0.7 }
    });
    return { status: 200, body: { text: response.text || "Mohon maaf, saya belum dapat menghasilkan respons.", fallback: false } };
  } catch (error: any) {
    return { status: 200, body: { text: generateExpertFallbackResponse(prompt, dataContext), error: error?.message, fallback: true } };
  }
}

export async function runPredict(input: { dataContext?: any }): Promise<ApiResult> {
  const { dataContext } = input;
  const client = await getAiClient();
  if (!client) return { status: 200, body: { forecast: generateDeterministicForecast(dataContext), fallback: true } };
  const { ai, Type } = client;

  try {
    const prompt = `Lakukan peramalan bisnis 7/30/90 hari ke depan dari data:
- Penjualan Marketplace: IDR ${dataContext?.marketplaceTotalSales || "13.000.000"}
- Penjualan POS: IDR ${dataContext?.posTotalSales || "3.500.000"}
- Persediaan akhir: ${dataContext?.endingStock || "220"} pcs
- Biaya iklan: IDR ${dataContext?.adsCost || "850.000"} | Return: ${dataContext?.returnRate || "5"}%
Output JSON sesuai schema.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["forecast7d", "forecast30d", "forecast90d", "explanation"],
          properties: {
            forecast7d: { type: Type.OBJECT, properties: { revenue: { type: Type.NUMBER }, profit: { type: Type.NUMBER }, inventoryNeeded: { type: Type.NUMBER }, shariaComplianceConfidence: { type: Type.NUMBER } } },
            forecast30d: { type: Type.OBJECT, properties: { revenue: { type: Type.NUMBER }, profit: { type: Type.NUMBER }, inventoryNeeded: { type: Type.NUMBER }, shariaComplianceConfidence: { type: Type.NUMBER } } },
            forecast90d: { type: Type.OBJECT, properties: { revenue: { type: Type.NUMBER }, profit: { type: Type.NUMBER }, inventoryNeeded: { type: Type.NUMBER }, shariaComplianceConfidence: { type: Type.NUMBER } } },
            explanation: { type: Type.STRING }
          }
        },
        temperature: 0.2
      }
    });
    return { status: 200, body: { forecast: JSON.parse(response.text || "{}"), fallback: false } };
  } catch (error: any) {
    return { status: 200, body: { forecast: generateDeterministicForecast(dataContext), error: error?.message, fallback: true } };
  }
}

export async function runInsights(input: { dataContext?: any }): Promise<ApiResult> {
  const { dataContext } = input;
  const client = await getAiClient();
  if (!client) return { status: 200, body: { insights: generateDeterministicInsights(dataContext), fallback: true } };
  const { ai, Type } = client;

  try {
    const prompt = `Buat audit dashboard otomatis (JSON) dari data retail:
- Pendapatan Bersih: IDR ${dataContext?.netSales || "8.500.000"} | Margin: ${dataContext?.netMargin || "18"}%
- Biaya Iklan: IDR ${dataContext?.adsCost || "850.000"} | Cancel: ${dataContext?.cancelRate || "2.1"}% | Damaged: ${dataContext?.damagedRate || "8.3"}%
- Zakat Terhutang: IDR ${dataContext?.zakatDuty || "3.750.000"}
Output JSON sesuai schema.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["executiveSummary", "businessOpportunity", "keyRisk", "operationalEfficiency", "profitAnalysis", "inventoryAnalysis", "shariaAudit", "marketplaceStrategy"],
          properties: {
            executiveSummary: { type: Type.STRING }, businessOpportunity: { type: Type.STRING },
            keyRisk: { type: Type.STRING }, operationalEfficiency: { type: Type.STRING },
            profitAnalysis: { type: Type.STRING }, inventoryAnalysis: { type: Type.STRING },
            shariaAudit: { type: Type.STRING }, marketplaceStrategy: { type: Type.STRING }
          }
        },
        temperature: 0.3
      }
    });
    return { status: 200, body: { insights: JSON.parse(response.text || "{}"), fallback: false } };
  } catch (error: any) {
    return { status: 200, body: { insights: generateDeterministicInsights(dataContext), error: error?.message, fallback: true } };
  }
}

// ---- Expert fallback (when Gemini key is absent) ----
function generateExpertFallbackResponse(prompt: string, ctx: any): string {
  const p = prompt.toLowerCase();
  const netProfit = ctx?.netProfit || 4150000;
  const netSales = ctx?.marketplaceTotalSales || 13400000;
  const returnRate = ctx?.returnRate || 5;

  if (p.includes("zakat") || p.includes("nisab") || p.includes("haul")) {
    return `### 🕌 Panduan Kepatuhan Zakat Mal (Zakat Perniagaan)

* **Harta Perniagaan Wajib**: IDR ${(ctx?.zakatWealth || 150000000).toLocaleString("id-ID")}.
* **Nishab**: setara 85 gram emas. **Jumlah Zakat (2.5%)**: IDR ${(ctx?.zakatDuty || 3750000).toLocaleString("id-ID")}.

Salurkan via LAZ resmi (BAZNAS, LAZISMU, NU Care) lalu catat di tombol 'Tandai Sudah Dibayarkan'.`;
  }
  if (p.includes("produk") || p.includes("menguntungkan") || p.includes("laris") || p.includes("margin") || p.includes("laba")) {
    return `### 📈 Analisis Profitabilitas Produk

Lampu Gantung Kubah Masjid LED adalah primadona margin (±48.5%). Pastikan stoknya aman karena berkontribusi ${((netProfit / (netSales || 1)) * 100).toFixed(1)}% dari laba bersih bulan ini.`;
  }
  if (p.includes("wilayah") || p.includes("daerah") || p.includes("provinsi") || p.includes("loyal")) {
    return `### 🗺️ Analisis Geografis & Return

DKI Jakarta & Jawa Barat kontributor terbesar (>55%). Jawa Timur potensial tapi return-risk tertinggi (kaca retak). Perkuat kemasan untuk pengiriman jauh.`;
  }
  if (p.includes("laba turun") || p.includes("biaya") || p.includes("rugi") || p.includes("iklan")) {
    return `### 🕵️ Tekanan Laba Bersih

Tertekan oleh iklan Shopee kurang efisien (ROI ${ctx?.adsRoi || "3.5"}x) dan biaya return barang rusak. Saran: stop bidding kata kunci konversi rendah, optimasi SEO judul produk.`;
  }
  return `### 💡 Selamat Datang di LUXORA AI

Asisten BI penjualan lampu hias, POS, & Syariah. Metrik kunci: Net Sales IDR ${netSales.toLocaleString("id-ID")}, Return ${returnRate}%, Skor Syariah ${ctx?.shariaScore || "92"}/100.

Coba tanya: produk paling menguntungkan, prediksi laba, return risk Jatim, efisiensi iklan, atau kewajiban Zakat Mal.`;
}

function generateDeterministicForecast(ctx: any) {
  const baseRevenue = (ctx?.marketplaceTotalSales || 13400000) + (ctx?.posTotalSales || 3500000);
  const baseProfit = ctx?.netProfit || 4150000;
  return {
    forecast7d: { revenue: Math.round(baseRevenue * 0.26), profit: Math.round(baseProfit * 0.28), inventoryNeeded: 18, shariaComplianceConfidence: 96 },
    forecast30d: { revenue: Math.round(baseRevenue * 1.15), profit: Math.round(baseProfit * 1.18), inventoryNeeded: 65, shariaComplianceConfidence: 97 },
    forecast90d: { revenue: Math.round(baseRevenue * 3.65), profit: Math.round(baseProfit * 3.82), inventoryNeeded: 195, shariaComplianceConfidence: 98 },
    explanation: "Pertumbuhan didorong siklus musiman perayaan Islam & pesanan kubah masjid LED. Tambah stok aman ≥65 unit dalam 30 hari, utamakan bayar tunai (anti-riba) ke supplier."
  };
}

function generateDeterministicInsights(ctx: any) {
  const damagedRate = ctx?.damagedRate || 8.3;
  return {
    executiveSummary: "Perniagaan LUXORA Lighting stabil dengan laba bersih sehat, didominasi lampu Kubah Masjid LED di DKI Jakarta.",
    businessOpportunity: "Tingkatkan kehadiran digital di Jawa Tengah & Sumatera Utara untuk kategori Lampu Hias Meja Kristal.",
    keyRisk: `Kerusakan fisik (Damaged Rate ${damagedRate}%) pada pengiriman jauh, mencederai prinsip as-Salam.`,
    operationalEfficiency: "Nego ulang kemasan kayu dengan pengrajin lokal untuk menekan packing cost hingga 15%.",
    profitAnalysis: "Margin bersih ±18.5%. Alokasikan iklan hanya untuk SKU bermargin >40%.",
    inventoryAnalysis: "Stok Lampu Meja Kristal kritis. Segera PO untuk menghindari kehilangan penjualan.",
    shariaAudit: "Transparansi & bebas riba terpenuhi. Haul tengah tahun: tunaikan zakat 2.5% dari harta lancar.",
    marketplaceStrategy: "Kurangi keyword ads umum; ganti dengan social-commerce organik (TikTok/Reels)."
  };
}
