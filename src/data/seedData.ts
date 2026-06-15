/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketplaceOrder, POSTransaction, OperationalCost, InventoryItem, RiskItem, AnomalyLog, ZakatRecord } from "../types";

// Seed Data for Marketplace Orders (Shopee Marketplace)
// Focusing on Decorative & Islamic Design Lamps
export const initialMarketplaceOrders: MarketplaceOrder[] = [
  {
    order_id: "SPX-671239823-JKT",
    order_date: "2026-06-14T10:15:00-07:00",
    customer_name: "Muhammad Rizky",
    customer_phone: "08123456781",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    district: "Kebayoran Baru",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    category: "Mosque Aesthetics",
    sku: "LMP-KUB-LED-01",
    qty: 2,
    unit_price: 350000,
    gross_sales: 700000,
    discount: 50000,
    net_sales: 650000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-671239824-JKT",
    order_date: "2026-06-14T10:20:00-07:00",
    customer_name: "Muhammad Rizky", // DOUBLE ORDER ANOMALY INBOUND (Same customer, same SKU, same address within 5 minutes)
    customer_phone: "08123456781",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    district: "Kebayoran Baru",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    category: "Mosque Aesthetics",
    sku: "LMP-KUB-LED-01",
    qty: 2,
    unit_price: 350000,
    gross_sales: 700000,
    discount: 50000,
    net_sales: 650000,
    order_status: "Processing"
  },
  {
    order_id: "SPX-782390123-SBY",
    order_date: "2026-06-13T14:45:00-07:00",
    customer_name: "Siti Rahmawati",
    customer_phone: "08234567891",
    province: "Jawa Timur",
    city: "Surabaya",
    district: "Gubeng",
    product_name: "Lampu Dinding Minimalis Retro Gold Ramadan",
    category: "Wall Sconce",
    sku: "LMP-WL-RAM-04",
    qty: 1,
    unit_price: 180000,
    gross_sales: 180000,
    discount: 10000,
    net_sales: 170000,
    order_status: "Returned" // RETURN RISK ANOMALY
  },
  {
    order_id: "SPX-893401244-BDG",
    order_date: "2026-06-13T09:12:00-07:00",
    customer_name: "Budi Santoso",
    customer_phone: "08567890122",
    province: "Jawa Barat",
    city: "Bandung",
    district: "Coblong",
    product_name: "Lampu Hias Meja Kristal Eid Mubarak USB Touch",
    category: "Table Lamp",
    sku: "LMP-TAB-KRI-02",
    qty: 3,
    unit_price: 125000,
    gross_sales: 375000,
    discount: 25000,
    net_sales: 350000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-901248102-MDN",
    order_date: "2026-06-12T16:30:00-07:00",
    customer_name: "Ahmad Siregar",
    customer_phone: "08987654321",
    province: "Sumatera Utara",
    city: "Medan",
    district: "Medan Baru",
    product_name: "Lampu Sorot Menara Kubah RGB 50W",
    category: "Floodlight",
    sku: "LMP-FLD-MEN-08",
    qty: 1,
    unit_price: 450000,
    gross_sales: 450000,
    discount: 0,
    net_sales: 450000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-459123891-SMG",
    order_date: "2026-06-11T11:05:00-07:00",
    customer_name: "Dewi Lestari",
    customer_phone: "08771234567",
    province: "Jawa Tengah",
    city: "Semarang",
    district: "Tembalang",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    category: "Mosque Aesthetics",
    sku: "LMP-KUB-LED-01",
    qty: 1,
    unit_price: 350000,
    gross_sales: 350000,
    discount: 15000,
    net_sales: 335000,
    order_status: "Cancelled" // CANCEL RISK ANOMALY
  },
  {
    order_id: "SPX-563829012-YOG",
    order_date: "2026-06-10T19:20:00-07:00",
    customer_name: "Heri Wibowo",
    customer_phone: "08192837465",
    province: "DI Yogyakarta",
    city: "Sleman",
    district: "Depok",
    product_name: "Lampu Dinding Minimalis Retro Gold Ramadan",
    category: "Wall Sconce",
    sku: "LMP-WL-RAM-04",
    qty: 2,
    unit_price: 180000,
    gross_sales: 360000,
    discount: 30000,
    net_sales: 330000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-342890123-MKS",
    order_date: "2026-06-09T08:40:00-07:00",
    customer_name: "Yusuf Daeng",
    customer_phone: "08523456123",
    province: "Sulawesi Selatan",
    city: "Makassar",
    district: "Panakkukang",
    product_name: "Lampu Hias Meja Kristal Eid Mubarak USB Touch",
    category: "Table Lamp",
    sku: "LMP-TAB-KRI-02",
    qty: 5,
    unit_price: 125000,
    gross_sales: 625000,
    discount: 50000,
    net_sales: 575000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-213901283-BPN",
    order_date: "2026-06-08T13:15:00-07:00",
    customer_name: "Faisal Rahman",
    customer_phone: "08812345678",
    province: "Kalimantan Timur",
    city: "Balikpapan",
    district: "Balikpapan Kota",
    product_name: "Lampu Downlight Kaligrafi Tembaga",
    category: "Ceiling Light",
    sku: "LMP-CEI-KAL-06",
    qty: 4,
    unit_price: 220000,
    gross_sales: 880000,
    discount: 40000,
    net_sales: 840000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-103982390-PLB",
    order_date: "2026-06-07T15:55:00-07:00",
    customer_name: "Rina Kartika",
    customer_phone: "08314567890",
    province: "Sumatera Selatan",
    city: "Palembang",
    district: "Ilir Barat I",
    product_name: "Lampu Lantern Vintage Bambu Sharia Wood",
    category: "Lanterns",
    sku: "LMP-LAN-VNT-03",
    qty: 2,
    unit_price: 150000,
    gross_sales: 300000,
    discount: 20000,
    net_sales: 280000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-912830129-DPS",
    order_date: "2026-06-05T12:10:00-07:00",
    customer_name: "Wayan Gede",
    customer_phone: "08134567111",
    province: "Bali",
    city: "Denpasar",
    district: "Denpasar Selatan",
    product_name: "Lampu Lantern Vintage Bambu Sharia Wood",
    category: "Lanterns",
    sku: "LMP-LAN-VNT-03",
    qty: 1,
    unit_price: 150000,
    gross_sales: 150000,
    discount: 0,
    net_sales: 150000,
    order_status: "Completed"
  },
  {
    order_id: "SPX-762391290-BJM",
    order_date: "2026-06-03T10:45:00-07:00",
    customer_name: "Siti Aisyah",
    customer_phone: "08219876543",
    province: "Kalimantan Selatan",
    city: "Banjarmasin",
    district: "Banjarmasin Utara",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    category: "Mosque Aesthetics",
    sku: "LMP-KUB-LED-01",
    qty: 1,
    unit_price: 350000,
    gross_sales: 350000,
    discount: 20000,
    net_sales: 330000,
    order_status: "Completed"
  }
];

// Seed Data for POS Transactions (Point of Sales - Offline Store)
export const initialPOSTransactions: POSTransaction[] = [
  {
    transaction_id: "POS-20260614-001",
    cashier_name: "Ahmad Cashier",
    transaction_date: "2026-06-14T09:30:00-07:00",
    customer_name: "Syarif Hidayat",
    product_name: "Lampu Hias Meja Kristal Eid Mubarak USB Touch",
    qty: 1,
    selling_price: 130000, // POS standard pricing slightly different than marketplace
    total_amount: 130000,
    payment_method: "QRIS"
  },
  {
    transaction_id: "POS-20260614-002",
    cashier_name: "Farhan Cashier",
    transaction_date: "2026-06-14T11:45:00-07:00",
    customer_name: "Hanifah Syakir",
    product_name: "Lampu Lantern Vintage Bambu Sharia Wood",
    qty: 4,
    selling_price: 160000,
    total_amount: 640000,
    payment_method: "Cash"
  },
  {
    transaction_id: "POS-20260613-001",
    cashier_name: "Ahmad Cashier",
    transaction_date: "2026-06-13T16:15:00-07:00",
    customer_name: "Lukman Hakim",
    product_name: "Lampu Dinding Minimalis Retro Gold Ramadan",
    qty: 2,
    selling_price: 190000,
    total_amount: 380000,
    payment_method: "GoPay"
  },
  {
    transaction_id: "POS-20260613-002",
    cashier_name: "Farhan Cashier",
    transaction_date: "2026-06-13T19:30:00-07:00",
    customer_name: "Anissa Amalia",
    product_name: "Lampu Sorot Menara Kubah RGB 50W",
    qty: 1,
    selling_price: 470000,
    total_amount: 470000,
    payment_method: "OVO"
  },
  {
    transaction_id: "POS-20260612-001",
    cashier_name: "Ahmad Cashier",
    transaction_date: "2026-06-12T13:00:00-07:00",
    customer_name: "Firdaus",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    qty: 1,
    selling_price: 360000,
    total_amount: 360000,
    payment_method: "DANA"
  },
  {
    transaction_id: "POS-20260611-001",
    cashier_name: "Farhan Cashier",
    transaction_date: "2026-06-11T10:15:00-07:00",
    customer_name: "Aditya",
    product_name: "Lampu Downlight Kaligrafi Tembaga",
    qty: 6,
    selling_price: 230000,
    total_amount: 1380000,
    payment_method: "Transfer"
  },
  {
    transaction_id: "POS-20260610-001",
    cashier_name: "Ahmad Cashier",
    transaction_date: "2026-06-10T17:50:00-07:00",
    customer_name: "Hasan Bisri",
    product_name: "Lampu Lantern Vintage Bambu Sharia Wood",
    qty: 1,
    selling_price: 160000,
    total_amount: 160000,
    payment_method: "ShopeePay"
  }
];

// Seed Data for Operational Cost (For current month June 2026, and historical)
export const initialOperationalCosts: OperationalCost[] = [
  {
    id: "OP-2026-06",
    month: "2026-06",
    admin_fee_shopee: 220000, // 4% Shopee Admin Fee
    service_fee: 110000,      // Shopee service fee
    handling_fee: 55000,
    shipping_fee: 180000,     // Shipping subsidies
    packing_fee: 154000,      // Premium bubble packing & custom wood boxes
    insurance_fee: 22000,
    advertising_cost: 850000, // Shopee Keyword Advertising cost is high
    affiliate_cost: 300000    // Shopee affiliate commission
  },
  {
    id: "OP-2026-05",
    month: "2026-05",
    admin_fee_shopee: 195000,
    service_fee: 98000,
    handling_fee: 49000,
    shipping_fee: 165000,
    packing_fee: 140000,
    insurance_fee: 19000,
    advertising_cost: 500000, // Normal ads
    affiliate_cost: 220000
  }
];

// Seed Data for Inventory Control Tower
// Total Beginning stock, ins, outs, ending & cogs cost
export const initialInventoryItems: InventoryItem[] = [
  {
    sku: "LMP-KUB-LED-01",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    stock_beginning: 25,
    stock_in: 15,
    stock_out: 6, // 5 Market + 1 POS (Completed cases)
    stock_return: 0,
    stock_ending: 34,
    minimum_stock: 12,
    cost_price: 180000 // 50% margin for mosque aesthetics
  },
  {
    sku: "LMP-WL-RAM-04",
    product_name: "Lampu Dinding Minimalis Retro Gold Ramadan",
    stock_beginning: 40,
    stock_in: 0,
    stock_out: 5, // 3 Market + 2 POS
    stock_return: 1, // 1 Return recorded
    stock_ending: 36,
    minimum_stock: 15,
    cost_price: 90000
  },
  {
    sku: "LMP-TAB-KRI-02",
    product_name: "Lampu Hias Meja Kristal Eid Mubarak USB Touch",
    stock_beginning: 8,
    stock_in: 2,
    stock_out: 9, // 8 Market + 1 POS
    stock_return: 0,
    stock_ending: 1, // HIGH DANGER ALERT! (Stock is < 5)
    minimum_stock: 5,
    cost_price: 60000
  },
  {
    sku: "LMP-FLD-MEN-08",
    product_name: "Lampu Sorot Menara Kubah RGB 50W",
    stock_beginning: 15,
    stock_in: 10,
    stock_out: 2, // 1 Market + 1 POS
    stock_return: 0,
    stock_ending: 23,
    minimum_stock: 6,
    cost_price: 250000
  },
  {
    sku: "LMP-CEI-KAL-06",
    product_name: "Lampu Downlight Kaligrafi Tembaga",
    stock_beginning: 30,
    stock_in: 0,
    stock_out: 10, // 4 Market + 6 POS
    stock_return: 0,
    stock_ending: 20,
    minimum_stock: 10,
    cost_price: 110000
  },
  {
    sku: "LMP-LAN-VNT-03",
    product_name: "Lampu Lantern Vintage Bambu Sharia Wood",
    stock_beginning: 50,
    stock_in: 5,
    stock_out: 8, // 3 Market + 5 POS
    stock_return: 0,
    stock_ending: 47,
    minimum_stock: 10,
    cost_price: 75000
  }
];

// Seed Data for Risk Matrix
export const initialRiskItems: RiskItem[] = [
  {
    id: "RSK-001",
    order_id: "SPX-782390123-SBY",
    product_name: "Lampu Dinding Minimalis Retro Gold Ramadan",
    sku: "LMP-WL-RAM-04",
    return_status: "Approved",
    return_reason: "Produk Pecah / Kaca retak saat pengiriman ke Jawa Timur",
    damaged_goods: true,
    lost_package: false,
    return_loss: 180000,
    date: "2026-06-13"
  },
  {
    id: "RSK-002",
    order_id: "SPX-459123891-SMG",
    product_name: "Lampu Gantung Kubah Masjid LED Lumina Slim",
    sku: "LMP-KUB-LED-01",
    return_status: "Rejected",
    cancel_reason: "Pembeli berubah pikiran (Ingin ganti model lain)",
    damaged_goods: false,
    lost_package: false,
    return_loss: 0,
    date: "2026-06-11"
  }
];

// Initial Zakat Records
export const initialZakatHistory: ZakatRecord[] = [
  {
    id: "ZAK-2026-01",
    date: "2026-01-10",
    calculated_wealth: 185000000,
    zakat_amount: 4625000,
    nishab_status: "Reached",
    payment_status: "Paid",
    channel: "BAZNAS RI"
  },
  {
    id: "ZAK-2025-07",
    date: "2025-07-05",
    calculated_wealth: 162000000,
    zakat_amount: 4050000,
    nishab_status: "Reached",
    payment_status: "Paid",
    channel: "LAZISMU"
  }
];

// 5 Automatic Business Recommendations (SaaS Engine)
export const initialRecommendations = [
  {
    id: "REC-01",
    title: "Reorder Fast-Moving Item (LMP-TAB-KRI-02)",
    description: "Lampu Hias Meja Kristal Eid Mubarak USB Touch hampir habis (Stok: 1 psc, Batas Minimum: 5). Segera restock 20 psc dari supplier untuk memenuhi demand bulan ini.",
    category: "Inventory" as const,
    impact: "High" as const,
    actionText: "Ajukan Purchase Order"
  },
  {
    id: "REC-02",
    title: "Optimasi Biaya Iklan Shopee",
    description: "Biaya iklan Shopee Keyword bulan ini melonjak (IDR 850.000). Kurangi bidding pada kata kunci lampu dekorasi umum dengan konversi rendah; alihkan anggaran ke kata kunci produk spesifik bermargin tinggi.",
    category: "Marketing" as const,
    impact: "High" as const,
    actionText: "Turunkan Bid Iklan"
  },
  {
    id: "REC-03",
    title: "Upgrade Kemasan Pengiriman Lampu Dinding",
    description: "Ditemukan return kasus kaca retak (LMP-WL-RAM-04) di Jatim. Gunakan double layer bubble wrap serta kardus packing sharia tebal. Biaya tambahan IDR 3.000 per paket akan menyelamatkan margin IDR 180.000.",
    category: "Operation" as const,
    impact: "Medium" as const,
    actionText: "Terapkan Standar Packing Baru"
  },
  {
    id: "REC-04",
    title: "Lakukan Zakat Mal (Zakat Perniagaan)",
    description: "Berdasarkan Zakat Engine, total kekayaan lancar (Kas + Persediaan) telah melewati nishab senilai IDR 100M dengan haul terpenuhi. Estimasi zakat Anda adalah IDR 3.864.500. Sangat disarankan ditiadakan keraguan.",
    category: "Sharia" as const,
    impact: "High" as const,
    actionText: "Salurkan Zakat Baru"
  },
  {
    id: "REC-05",
    title: "Alihkan Margin ke Produk 'Ceiling Aesthetics'",
    description: "Lampu Gantung Kubah Slim (LMP-KUB-LED-01) memiliki margin kontribusi tertinggi (50%). Naikkan diskon marketplace sebesar 2% untuk meningkatkan frekuensi pemesanan produk primadona ini.",
    category: "Pricing" as const,
    impact: "Medium" as const,
    actionText: "Terapkan Diskon Strategis"
  }
];
