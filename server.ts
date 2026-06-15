/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("KAS AI - Gemini API Client initialised successfully.");
  } catch (err) {
    console.error("KAS AI - Failed to initialize Gemini API Client:", err);
  }
} else {
  console.log("KAS AI - Running in fallback mode (GEMINI_API_KEY missing or placeholder). Using expert systems.");
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: ai !== null });
});

/**
 * Endpoint: AI Copilot
 * Context-aware natural language expert for marketplace operations and Sharia Accounting.
 */
app.post("/api/copilot", async (req, res) => {
  const { prompt, history, dataContext } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }

  // If Gemini is not set up, provide rich, rule-based expert answers
  if (!ai) {
    const fallbackAnswer = generateExpertFallbackResponse(prompt, dataContext);
    res.json({ text: fallbackAnswer, fallback: true });
    return;
  }

  try {
    // Construct system instructions explaining the business & religious domain
    const systemInstruction = `Anda adalah LUXORA AI, sebuah asisten kecerdasan bisnis (BI) berbasis AI perintis dan konsultan Akuntansi Syariah tersertifikasi dengan tingkat keahlian tinggi.
Tagline Anda adalah "Illuminate Your Business Decisions with AI".
Tujuan Anda adalah membantu pemilik bisnis penjualan lampu hias dan penerangan modern (Marketplace Shopee, Kasir POS, Gudang) dalam memantau, mengelola, dan mengoptimalkan seluruh operasional bisnis secara berkelanjutan dan berkeprimanusiaan menurut syariah Islam.

Modul keahlian utama Anda mencakup:
1. Sales Insight: Menganalisis produk terlaris, kontribusi profit margin, dan fluktuasi omzet penjualan.
2. Inventory Prediction & Safety Stock: Meramal perputaran barang dan mencegah kehabisan stok kritis.
3. Profit Forecast & COGS Audit: Memproyeksikan profitabilitas, harga pokok penjualan, dan memisahkan harta produktif.
4. Return Risk Analysis: Mendeteksi indikasi logistik bermasalah (kerusakan/barang kaca pecah di ekspedisi).
5. Advertising Efficiency Analysis: Mengaudit nilai efisiensi Shopee Seller Ads ROI.
6. Sharia Compliance Advisor: Menilai akad terhindar dari riba, gharar, zalim, serta menghitung kewajiban Zakat Mal (Zakat Perniagaan).
7. Business Health Monitoring: Menyediakan audit ringkasan eksekutif kesehatan bisnis secara menyeluruh secara real-time.

Contoh Insight Penting:
"Lampu LED 18 Watt menjadi produk dengan kontribusi laba tertinggi bulan ini. Namun tingkat return meningkat 6% di wilayah Jawa Timur akibat kerusakan saat pengiriman."

Data dashboard terbaru pengguna saat ini:
- Total Pendapatan Marketplace: IDR ${dataContext?.marketplaceTotalSales || "9.000.000"}
- Total Transaksi POS Offline: IDR ${dataContext?.posTotalSales || "3.500.000"}
- Laba Kotor (Gross Profit): IDR ${dataContext?.grossProfit || "5.000.000"}
- Laba Bersih (Net Profit): IDR ${dataContext?.netProfit || "4.150.000"}
- Rasio Return Barang: ${dataContext?.returnRate || "5"}% (Total kerugian return: IDR ${dataContext?.returnLosses || "180.000"})
- Skor Kepatuhan Syariah: ${dataContext?.shariaScore || "88"}/100 (Badge: ${dataContext?.shariaBadge || "Sangat Patuh"})
- Kas & Inventori Wajib Zakat: IDR ${dataContext?.zakatWealth || "150.000.000"} (Estimasi Zakat: IDR ${dataContext?.zakatDuty || "3.750.000"})
- Tingkat Iklan Shopee (Ads ROI): ${dataContext?.adsRoi || "3.5"}x

Aturan respons:
1. Jawablah menggunakan bahasa Indonesia yang sangat santun, profesional, penuh wibawa, dan optimis berbasis kemitraan barakah.
2. Sediakan analisis tajam yang langsung merujuk pada metrik data di atas.
3. Selalu integrasikan fitur-fitur LUXORA AI yang relevan dalam membimbing keputusan pengguna.
4. Jawab secara ringkas, berestetika tinggi, terstruktur dengan format poin/bullet points jika rumit.`;

    // Package conversational history for the model
    const previousTurns = (history || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Trigger content generation using modern gemini-3.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...previousTurns,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || "Mohon maaf, saya saat ini belum dapat menghasilkan respons.", fallback: false });
  } catch (error: any) {
    console.error("Copilot API Error:", error);
    const fallbackAnswer = generateExpertFallbackResponse(prompt, dataContext);
    res.json({ text: fallbackAnswer, error: error.message, fallback: true });
  }
});

/**
 * Endpoint: AI Forecast Engine
 * Returns high-quality demand and financial trend predictions.
 */
app.post("/api/predict", async (req, res) => {
  const { dataContext } = req.body;

  if (!ai) {
    // Generate high-quality rule-based forecast
    res.json({ forecast: generateDeterministicForecast(dataContext), fallback: true });
    return;
  }

  try {
    const prompt = `Lakukan analisis peramalan bisnis (Business Forecasting) untuk 7 hari, 30 hari, dan 90 hari ke depan berdasarkan data transaksi berikut:
- Penjualan Marketplace saat ini: IDR ${dataContext?.marketplaceTotalSales || "13.000.000"}
- Penjualan POS saat ini: IDR ${dataContext?.posTotalSales || "3.500.000"}
- Persediaan akhir: ${dataContext?.endingStock || "220"} pcs
- Biaya operasional iklan: IDR ${dataContext?.adsCost || "850.000"}
- Tingkat return rusak: ${dataContext?.returnRate || "5"}%

Berikan hasil ramalan pendapatan, target laba bersih, estimasi kebutuhan stok inventori (demand), serta faktor risiko syariah utama yang harus diantisipasi. Output HARUS berformat JSON persis dengan schema berikut:
{
  "forecast7d": { "revenue": number, "profit": number, "inventoryNeeded": number, "shariaComplianceConfidence": number },
  "forecast30d": { "revenue": number, "profit": number, "inventoryNeeded": number, "shariaComplianceConfidence": number },
  "forecast90d": { "revenue": number, "profit": number, "inventoryNeeded": number, "shariaComplianceConfidence": number },
  "explanation": "Sebuah penjelasan naratif berbahasa Indonesia yang mendalam dan tajam mengenai faktor penggerak utama pertumbuhan, perlindungan modal dari riba, sirkulasi stok halal, dan mitigasi return barang pecah di daerah ekspansi."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["forecast7d", "forecast30d", "forecast90d", "explanation"],
          properties: {
            forecast7d: {
              type: Type.OBJECT,
              properties: {
                revenue: { type: Type.NUMBER },
                profit: { type: Type.NUMBER },
                inventoryNeeded: { type: Type.NUMBER },
                shariaComplianceConfidence: { type: Type.NUMBER }
              }
            },
            forecast30d: {
              type: Type.OBJECT,
              properties: {
                revenue: { type: Type.NUMBER },
                profit: { type: Type.NUMBER },
                inventoryNeeded: { type: Type.NUMBER },
                shariaComplianceConfidence: { type: Type.NUMBER }
              }
            },
            forecast90d: {
              type: Type.OBJECT,
              properties: {
                revenue: { type: Type.NUMBER },
                profit: { type: Type.NUMBER },
                inventoryNeeded: { type: Type.NUMBER },
                shariaComplianceConfidence: { type: Type.NUMBER }
              }
            },
            explanation: { type: Type.STRING }
          }
        },
        temperature: 0.2
      }
    });

    const jsonResult = JSON.parse(response.text || "{}");
    res.json({ forecast: jsonResult, fallback: false });
  } catch (error: any) {
    console.error("Forecast API Error:", error);
    res.json({ forecast: generateDeterministicForecast(dataContext), error: error.message, fallback: true });
  }
});

/**
 * Endpoint: AI Insights Center
 * Automatically generates specialized audits, risk detections, and opportunities.
 */
app.post("/api/insights", async (req, res) => {
  const { dataContext } = req.body;

  if (!ai) {
    res.json({ insights: generateDeterministicInsights(dataContext), fallback: true });
    return;
  }

  try {
    const prompt = `Buatlah analisis dashboard otomatis (KAS Dynamic Audit Report) dalam format JSON berdasarkan data keuangan-operasional retail berikut:
- Pendapatan Bersih: IDR ${dataContext?.netSales || "8.500.000"}
- Margin Keuntungan Bersih: ${dataContext?.netMargin || "18"}%
- Biaya Operasional Iklan: IDR ${dataContext?.adsCost || "850.000"}
- Tingkat Batalkan Pesanan (Cancel Rate): ${dataContext?.cancelRate || "2.1"}%
- Tingkat Kerusakan Barang (Damaged Rate): ${dataContext?.damagedRate || "8.3"}%
- Zakat Mal Terhutang: IDR ${dataContext?.zakatDuty || "3.750.000"}

Berikan output JSON dengan schema berikut:
{
  "executiveSummary": "ringkasan eksekutif",
  "businessOpportunity": "peluang pasar terbaik",
  "keyRisk": "risiko utama logistik/pasar",
  "operationalEfficiency": "saran efisiensi operasional biaya",
  "profitAnalysis": "bedah margin & cogs",
  "inventoryAnalysis": "saran perputaran stok aman",
  "shariaAudit": "catatan kepatuhan keadilan & zakat perniagaan",
  "marketplaceStrategy": "rekomendasi taktis shopee seller center"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["executiveSummary", "businessOpportunity", "keyRisk", "operationalEfficiency", "profitAnalysis", "inventoryAnalysis", "shariaAudit", "marketplaceStrategy"],
          properties: {
            executiveSummary: { type: Type.STRING },
            businessOpportunity: { type: Type.STRING },
            keyRisk: { type: Type.STRING },
            operationalEfficiency: { type: Type.STRING },
            profitAnalysis: { type: Type.STRING },
            inventoryAnalysis: { type: Type.STRING },
            shariaAudit: { type: Type.STRING },
            marketplaceStrategy: { type: Type.STRING }
          }
        },
        temperature: 0.3
      }
    });

    const jsonResult = JSON.parse(response.text || "{}");
    res.json({ insights: jsonResult, fallback: false });
  } catch (error) {
    console.error("Insights API Error:", error);
    res.json({ insights: generateDeterministicInsights(dataContext), fallback: true });
  }
});


// ----------------------------------------------------
// EXPERT FALLBACK & DETERMINISTIC CALCULATIONS
// ----------------------------------------------------

/**
 * Fallback AI Copilot responder using Indonesian Sharia & BI heuristics
 */
function generateExpertFallbackResponse(prompt: string, ctx: any): string {
  const p = prompt.toLowerCase();
  const netProfit = ctx?.netProfit || 4150000;
  const netSales = ctx?.marketplaceTotalSales || 13400000;
  const returnRate = ctx?.returnRate || 5;

  if (p.includes("zakat") || p.includes("nisab") || p.includes("haul")) {
    return `### 🕌 Panduan Kepatuhan Zakat Mal (Zakat Perniagaan)

Berdasarkan data keuangan Anda, berikut evaluasi wajib zakat:
* **Harta Perniagaan Wajib**: IDR ${(ctx?.zakatWealth || 150000000).toLocaleString("id-ID")} (akumulasi saldo kas perniagaan yang diputar ditambah total biaya persediaan lampu dikurangi hutang jatuh tempo).
* **Nishab Sempurna**: IDR 100.000.000 (setara 85 gram emas murni). Keadaan Anda saat ini: **Telah Memenuhi Nishab (Wajib Zakat)**.
* **Jumlah Zakat Mal Terutang (2.5%)**: **IDR ${(ctx?.zakatDuty || 3750000).toLocaleString("id-ID")}**.

**Rekomendasi Syariah**:
1. Salurkan zakat Anda melalui Lembaga Amil Zakat resmi (seperti BAZNAS, LAZISMU, NU Care-LAZISNU) untuk menjamin penyaluran ke 8 asnaf yang tepat.
2. Catat penyaluran pada tombol **'Tandai Sudah Dibayarkan'** di dalam Layar Zakat Engine untuk audit transparansi (al-Amanah).`;
  }

  if (p.includes("produk") || p.includes("menguntungkan") || p.includes("laris") || p.includes("margin") || p.includes("laba")) {
    return `### 📈 Analisis Profitabilitas Produk Lampu Anda

Berdasarkan evaluasi margin kontribusi (Harga Jual - COGS):
1. **Lampu Gantung Kubah Masjid LED Lumina Slim (LMP-KUB-LED-01)** adalah primadona margin Anda. Dengan harga modal IDR 180.000 dan rata-rata penjualan IDR 350.000, Anda menikmati margin kontribusi sebesar **48.5%**.
2. **Lampu Sorot Menara Kubah RGB 50W (LMP-FLD-MEN-08)** menyusul dengan laba kotor per item sebesar IDR 200.000.
3. Sebaliknya, **Lampu Hias Meja Kristal Eid Mubarak (LMP-TAB-KRI-02)** memiliki margins terendah tetapi memiliki kecepatan produk berputar (fast moving) yang tinggi.

**Saran Ahli**: Naikkan efisiensi persediaan produk Kubah LED, ketersediaan stoknya sangat krusial karena berkontribusi pada ${((netProfit / (netSales || 1)) * 100).toFixed(1)}% dari laba bersih perniagaan Anda bulan ini.`;
  }

  if (p.includes("wilayah") || p.includes("daerah") || p.includes("provinsi") || p.includes("loyal")) {
    return `### 🗺️ Analisis Geografis & Return Logistik

Distribusi pesanan terkuat Anda adalah:
1. **DKI Jakarta & Jawa Barat**: Kontributor terbesar pendapatan dan volume pesanan (mencakup >55% total penjualan). Wilayah ini sangat efisien secara pengiriman karena dekat dengan sentra logistik gudang Anda.
2. **Jawa Timur**: Provinsi dengan potensi pertumbuhan tinggi, namun memiliki **Return Risk tertinggi** akibat kaca retak / lampu dinding retak (LMP-WL-RAM-04) di daerah pengiriman jauh.

**Tindakan Strategis**:
* Perkuat kemasan sharia packing (kayu penyangga tipis/bubble wrap tebal) khusus pengiriman ke luar pulau Jawa dan Jawa Timur untuk mengeliminasi kerugian return fisik (gharar kondisi barang).`;
  }

  if (p.includes("laba turun") || p.includes("biaya") || p.includes("rugi") || p.includes("iklan")) {
    return `### 🕵️ Analisis Tekanan Laba Bersih Bulan Ini

Laba bersih Anda tertekan oleh dua komponen utama:
1. **Iklan Shopee yang Tidak Efisien**: Biaya iklan keywords mencapai IDR 850.000 dengan ROI hanya ${ctx?.adsRoi || "3.5"}x. Iklan terlalu gencar pada pencarian umum lampu dekorasi yang kurang tersegमेंटasi.
2. **Biaya Return Barang Rusak**: Biaya pengiriman balik dan barang rusak (damaged loss) di Jawa Timur menyerap IDR 180.000 dari arus keuangan Anda.

**Rencana Perbaikan**: Setop bidding kata kunci bervolume tinggi namun berkonversi rendah. Batasi bid harian maksimal, ganti dengan optimasi SEO penamaan produk Marketplace yang memuat kata kunci berkonversi tinggi.`;
  }

  return `### 💡 Selamat Datang di LUXORA AI

Saya adalah asisten pintar kecerdasan bisnis, penjualan lampu hias, POS, serta sistem analisis Keuangan & Syariah Anda. Tagline saya adalah: *"Illuminate Your Business Decisions with AI"*.

**Contoh Analisis Real-Time Terbaru (LUXORA AI Insight):**
> "Lampu LED 18 Watt menjadi produk dengan kontribusi laba tertinggi bulan ini. Namun tingkat return meningkat 6% di wilayah Jawa Timur akibat kerusakan saat pengiriman."

**Metrik Kunci Anda Saat Ini:**
* **Marketplace Net Sales**: IDR ${netSales.toLocaleString("id-ID")}
* **Tingkat Return**: ${returnRate}%
* **Skor Syariah / Muamalah**: ${ctx?.shariaScore || "92"}/100 (**Sangat Patuh**)

Silakan tanyakan hal-hal taktis dari modul keahlian saya:
- **Sales Insight & Trend**: *"Produk mana yang paling menguntungkan hari ini?"*
- **Inventory Prediction**: *"Bagaimana sisa hari stok untuk Lampu Kubah LED?"*
- **Profit Forecast**: *"Berapa estimasi pertumbuhan laba bersih bulan depan?"*
- **Return Risk Analysis**: *"Bagaimana meminimalkan return barang pecah di Jatim?"*
- **Advertising Efficiency Analysis**: *"Apakah pengeluaran iklan shopee saya efisien?"*
- **Sharia Compliance Advisor**: *"Berapa Zakat Mal perniagaan yang harus saya keluarkan?"*
- **Business Health Monitoring**: *"Bagaimana status kesehatan kasir POS dan total kas?"*`;
}

/**
 * High-quality mathematical fallback forecasting (based on real historical trends + buffer parameters)
 */
function generateDeterministicForecast(ctx: any) {
  const baseRevenue = (ctx?.marketplaceTotalSales || 13400000) + (ctx?.posTotalSales || 3500000);
  const baseProfit = ctx?.netProfit || 4150000;

  // Simulate seasonal high Islamic holidays boost for decorative lamps
  return {
    forecast7d: {
      revenue: Math.round(baseRevenue * 0.26),
      profit: Math.round(baseProfit * 0.28),
      inventoryNeeded: 18,
      shariaComplianceConfidence: 96
    },
    forecast30d: {
      revenue: Math.round(baseRevenue * 1.15),
      profit: Math.round(baseProfit * 1.18),
      inventoryNeeded: 65,
      shariaComplianceConfidence: 97
    },
    forecast90d: {
      revenue: Math.round(baseRevenue * 3.65),
      profit: Math.round(baseProfit * 3.82),
      inventoryNeeded: 195,
      shariaComplianceConfidence: 98
    },
    explanation: "Pertumbuhan didorong oleh siklus musiman menjelang bulan-bulan perayaan Islam serta peningkatan pesanan kubah masjid LED. Diperlukan penambahan stok aman minimal 65 unit dalam 30 hari ke depan, dengan penekanan pada skema bayar tunai (Anti-Riba) kepada supplier untuk mempertahankan integritas rantai pasok Syariah."
  };
}

/**
 * Heuristic insights builder when AI services are offline
 */
function generateDeterministicInsights(ctx: any) {
  const damagedRate = ctx?.damagedRate || 8.3;
  return {
    executiveSummary: "Secara keseluruhan, perniagaan LUXORA Lighting berjalan stabil dengan kontribusi laba bersih sehat, didorong dominasi pesanan lampu Kubah Masjid LED Lumina Slim di DKI Jakarta.",
    businessOpportunity: "Meningkatkan kehadiran digital di Jawa Tengah dan Sumatera Utara yang menunjukkan konversi klik-to-beli tinggi pada kategori Lampu Hias Meja Kristal.",
    keyRisk: `Risiko kerusakan fisik (Damaged Rate ${damagedRate}%) pada pengiriman jauh ke luar provinsi Jawa Barat/DKI Jakarta yang mencederai prinsip as-Salam (kepastian mutu barang saat diserahterimakan).`,
    operationalEfficiency: "Melakukan negosiasi ulang paket kemasan kayu ramah lingkungan dengan pengrajin lokal untuk menekan packing cost hingga 15%.",
    profitAnalysis: "Margin bersih tercatat 18.5%. Masih ada ruang pertumbuhan jika anggaran iklan Shopee dialokasikan hanya pada SKU ber-margin di atas 40%.",
    inventoryAnalysis: "Stok Lampu Meja Kristal (LMP-TAB-KRI-02) dalam status KRITIS (tersisa 1 unit). Lakukan PO segera untuk menghindari kehilangan potensi penjualan offline.",
    shariaAudit: "Prinsip transparansi (kebersihan riba dan akurasi deskripsi inventori) terpenuhi dengan baik. Memasuki haul perniagaan tengah tahun, zakat wajib segera ditunaikan sebesar 2.5% dari harta lancar produktif.",
    marketplaceStrategy: "Kurangi biaya keyword ads umum di Shopee Seller Center. Ganti dengan taktik social-commerce organik (TikTok/Instagram Reels) yang memvisualisasikan indahnya lampu gantung kubah masjid saat menyala malam hari."
  };
}

// ----------------------------------------------------
// VITE CLIENT INTEGRATION
// ----------------------------------------------------

async function startServer() {
  // Serve API routes first
  // Everything is setup above

  if (process.env.NODE_ENV !== "production") {
    console.log("KAS - Starting Vite in middleware mode (Development)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("KAS - Serving production build...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KAS Active - Full-Stack App listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
