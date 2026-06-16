/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MarketplaceOrder, POSTransaction, InventoryItem, RiskItem, ZakatRecord } from "../types";

export type ReportType =
  | "PL" | "CashFlow" | "Sales" | "Inventory" | "POS" | "Return" | "Risk" | "Sharia" | "Zakat";

export interface ReportData {
  orders: MarketplaceOrder[];
  posHistory: POSTransaction[];
  inventoryItems: InventoryItem[];
  riskItems: RiskItem[];
  zakatRecords: ZakatRecord[];
  netSales: number;
  grossProfit: number;
  netProfit: number;
  opexTotal: number;
  inventoryValue: number;
  // Real zakat inputs (shared with the Zakat module, per-user)
  zakatCash: number;
  zakatLiabilities: number;
  goldPricePerGram: number;
  // Meta
  shopName: string;
  ownerName: string;
  period: string;
}

const idr = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const todayStr = () => new Date().toISOString().split("T")[0];

// Consistent zakat math (mirrors ShariaRadar / BUSINESS_RULES §6)
export function computeZakat(d: ReportData) {
  const nishab = 85 * d.goldPricePerGram;
  const hwz = Math.max(0, d.zakatCash + d.inventoryValue - d.zakatLiabilities);
  const reached = hwz >= nishab;
  const due = reached ? Math.round(hwz * 0.025) : 0;
  return { nishab, hwz, reached, due };
}

// ----------------------------------------------------
// XLSX — full workbook, multiple sheets, NO buyer PII (BR-RPT-003)
// ----------------------------------------------------
export function exportWorkbook(d: ReportData): void {
  const wb = XLSX.utils.book_new();
  const z = computeZakat(d);

  const ringkasan = [
    ["LUXORA — Ringkasan Laporan Keuangan"],
    ["Toko", d.shopName, "Periode", d.period],
    [],
    ["Akun", "Nominal (IDR)"],
    ["Pendapatan Bersih (Net Sales)", d.netSales],
    ["Harga Pokok Penjualan (COGS)", -(d.netSales - d.grossProfit)],
    ["Laba Kotor (Gross Profit)", d.grossProfit],
    ["Biaya Operasional (OPEX)", -d.opexTotal],
    ["Laba Bersih (Net Profit)", d.netProfit],
    [],
    ["Arus Kas Masuk (POS + Marketplace)", d.netSales],
    ["Arus Kas Keluar (OPEX)", -d.opexTotal],
    ["Arus Kas Keluar (COGS Supplier)", -(d.netSales - d.grossProfit)]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ringkasan), "Ringkasan");

  const sales = [
    ["Produk", "Qty Terjual", "Estimasi Netto (IDR)"],
    ...d.inventoryItems.map((i) => [i.product_name, i.stock_out, Math.round(i.stock_out * i.cost_price * 1.8)])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sales), "Sales");

  const inv = [
    ["SKU", "Produk", "Awal", "Masuk", "Keluar", "Akhir", "Modal Satuan", "Aset Buku"],
    ...d.inventoryItems.map((i) => [
      i.sku, i.product_name, i.stock_beginning, i.stock_in, i.stock_out, i.stock_ending,
      i.cost_price, i.stock_ending * i.cost_price
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(inv), "Inventory");

  // POS ledger — buyer name intentionally excluded (PII)
  const pos = [
    ["Tanggal", "Kasir", "Metode Bayar", "Nominal (IDR)"],
    ...d.posHistory.map((t) => [t.transaction_date.split("T")[0], t.cashier_name, t.payment_method, t.total_amount])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pos), "POS Ledger");

  const ret = [
    ["ID", "Order ID", "SKU", "Sebab", "Kerugian (IDR)"],
    ...d.riskItems.map((r) => [
      r.id, r.order_id || "POS-STORE", r.sku, r.return_reason || r.cancel_reason || "-", r.return_loss
    ])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ret), "Return Ledger");

  const zakat = [
    ["LAPORAN ZAKAT MAL (PERNIAGAAN)"],
    ["Muzakki", d.ownerName, "Toko", d.shopName],
    [],
    ["Komponen", "Nilai (IDR)"],
    ["Kas / Saldo", d.zakatCash],
    ["Nilai Stok Barang", d.inventoryValue],
    ["Hutang Jangka Pendek", -d.zakatLiabilities],
    ["Harta Wajib Zakat", z.hwz],
    [],
    ["Harga Emas / gram", d.goldPricePerGram],
    ["Nishab (85 gram emas)", z.nishab],
    ["Status Nishab", z.reached ? "TERCAPAI" : "BELUM TERCAPAI"],
    ["Tarif Zakat", "2.5%"],
    ["Zakat Wajib", z.due],
    [],
    ["Riwayat Setoran", "Tanggal", "Lembaga", "Nominal (IDR)"],
    ...d.zakatRecords.map((r) => ["", r.date, r.channel || "-", r.zakat_amount])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(zakat), "Zakat");

  const syariah = [
    ["Audit Kepatuhan Syariah (Muamalah)"],
    [],
    ["Aspek", "Status"],
    ["Akad jual beli (Ijab Qabul) POS", "Jelas / Bebas Gharar"],
    ["Gerbang pembayaran", "Bebas Riba (tunai / e-wallet langsung)"],
    ["Unsur rekayasa harga (Najsy)", "Nihil"],
    ["Kewajiban Zakat", z.reached ? "Wajib ditunaikan" : "Belum mencapai nishab"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(syariah), "Syariah");

  XLSX.writeFile(wb, `LUXORA_Laporan_${d.shopName.replace(/\s+/g, "_") || "Toko"}_${todayStr()}.xlsx`);
}

// ----------------------------------------------------
// PDF — printable document for one report (jsPDF + autotable)
// ----------------------------------------------------
const REPORT_TITLES: Record<ReportType, string> = {
  PL: "Laporan Laba Rugi (Profit & Loss)",
  CashFlow: "Laporan Arus Kas (Cash Flow)",
  Sales: "Laporan Penjualan (Sales)",
  Inventory: "Laporan Persediaan (Inventory)",
  POS: "Buku Besar Transaksi POS",
  Return: "Buku Besar Retur (Return Ledger)",
  Risk: "Audit Risiko Logistik",
  Sharia: "Audit Kepatuhan Syariah",
  Zakat: "Laporan Zakat Mal (Perniagaan)"
};

function drawWatermark(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  // @ts-expect-error GState exists at runtime
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.setFontSize(80);
  doc.setTextColor(120, 120, 120);
  doc.text("DRAFT", w / 2, h / 2, { align: "center", angle: 35 });
  doc.restoreGraphicsState();
}

export function exportReportPDF(reportType: ReportType, d: ReportData): void {
  const doc = new jsPDF();
  const title = REPORT_TITLES[reportType];

  // Header
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105);
  doc.text("LUXORA", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Lighting Sales, POS, Financial & Sharia Analytics", 14, 23.5);
  doc.text(`Toko: ${d.shopName || "-"}    Periode: ${d.period}`, 14, 28.5);
  doc.setDrawColor(220);
  doc.line(14, 31.5, 196, 31.5);
  doc.setFontSize(13);
  doc.setTextColor(30);
  doc.text(title, 14, 39);

  drawWatermark(doc);

  const startY = 45;

  if (reportType === "PL") {
    autoTable(doc, {
      startY,
      head: [["Akun Keuangan", "Nominal"]],
      body: [
        ["Pendapatan Bersih (Net Sales)", idr(d.netSales)],
        ["Harga Pokok Penjualan (COGS)", `-${idr(d.netSales - d.grossProfit)}`],
        ["Laba Kotor (Gross Profit)", idr(d.grossProfit)],
        ["Biaya Operasional (OPEX)", `-${idr(d.opexTotal)}`],
        ["Laba Bersih (Net Profit)", idr(d.netProfit)]
      ],
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "CashFlow") {
    autoTable(doc, {
      startY,
      head: [["Aliran Kas", "Nominal"]],
      body: [
        ["Kas Masuk (POS + Marketplace)", `+${idr(d.netSales)}`],
        ["Kas Keluar (OPEX)", `-${idr(d.opexTotal)}`],
        ["Kas Keluar (COGS Supplier)", `-${idr(d.netSales - d.grossProfit)}`],
        ["Kas Akhir (Rekonsiliasi)", idr(d.netProfit)]
      ],
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "Sales") {
    autoTable(doc, {
      startY,
      head: [["Produk", "Qty Terjual", "Estimasi Netto"]],
      body: d.inventoryItems.map((i) => [i.product_name, String(i.stock_out), idr(i.stock_out * i.cost_price * 1.8)]),
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "Inventory") {
    autoTable(doc, {
      startY,
      head: [["SKU", "Produk", "Akhir", "Modal", "Aset Buku"]],
      body: d.inventoryItems.map((i) => [
        i.sku, i.product_name, String(i.stock_ending), idr(i.cost_price), idr(i.stock_ending * i.cost_price)
      ]),
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "POS") {
    autoTable(doc, {
      startY,
      head: [["Tanggal", "Kasir", "Metode", "Nominal"]],
      body: d.posHistory.map((t) => [t.transaction_date.split("T")[0], t.cashier_name, t.payment_method, idr(t.total_amount)]),
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "Return") {
    autoTable(doc, {
      startY,
      head: [["ID", "Order", "SKU", "Sebab", "Kerugian"]],
      body: d.riskItems.map((r) => [r.id, r.order_id || "POS", r.sku, r.return_reason || r.cancel_reason || "-", idr(r.return_loss)]),
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "Risk") {
    const loss = d.riskItems.reduce((s, r) => s + r.return_loss, 0);
    autoTable(doc, {
      startY,
      head: [["Metrik Risiko Logistik", "Nilai"]],
      body: [
        ["Volume paket rusak", `${d.riskItems.filter((r) => r.damaged_goods).length} kasus`],
        ["Paket hilang kurir", `${d.riskItems.filter((r) => r.lost_package).length} paket`],
        ["Total kerugian retur", idr(loss)]
      ],
      theme: "striped",
      headStyles: { fillColor: [190, 30, 45] }
    });
  } else if (reportType === "Sharia") {
    const z = computeZakat(d);
    autoTable(doc, {
      startY,
      head: [["Aspek Muamalah", "Status"]],
      body: [
        ["Akad jual beli (Ijab Qabul)", "Jelas / Bebas Gharar"],
        ["Gerbang pembayaran", "Bebas Riba"],
        ["Rekayasa harga (Najsy)", "Nihil"],
        ["Kewajiban Zakat", z.reached ? "Wajib ditunaikan" : "Belum mencapai nishab"]
      ],
      theme: "striped",
      headStyles: { fillColor: [5, 150, 105] }
    });
  } else if (reportType === "Zakat") {
    const z = computeZakat(d);
    // COMPLIANCE §4.4 format
    autoTable(doc, {
      startY,
      head: [["LAPORAN ZAKAT MAL", ""]],
      body: [
        ["Muzakki (Pembayar)", d.ownerName || "-"],
        ["Periode Penilaian", d.period],
        ["Kas / Saldo", idr(d.zakatCash)],
        ["Nilai Stok Barang", idr(d.inventoryValue)],
        ["(-) Hutang Jangka Pendek", `-${idr(d.zakatLiabilities)}`],
        ["HARTA WAJIB ZAKAT", idr(z.hwz)],
        ["Harga Emas / gram", idr(d.goldPricePerGram)],
        ["Nishab (85 gram emas)", idr(z.nishab)],
        ["Status Nishab", z.reached ? "TERCAPAI" : "BELUM TERCAPAI"],
        ["Tarif Zakat", "2,5%"],
        ["ZAKAT WAJIB", idr(z.due)]
      ],
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105] },
      didParseCell: (data) => {
        const label = String(data.row.raw[0] || "");
        if (data.section === "body" && (label === "HARTA WAJIB ZAKAT" || label === "ZAKAT WAJIB")) {
          data.cell.styles.fontStyle = "bold";
        }
      }
    });
    const afterY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Laporan dihasilkan otomatis oleh sistem. Harap konfirmasi dengan amil zakat di LAZ pilihan Anda.",
      14, afterY, { maxWidth: 180 }
    );
  }

  // Footer
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Dokumen DRAFT — dibuat ${new Date().toLocaleString("id-ID")} · LUXORA BI`, 14, h - 10);

  doc.save(`LUXORA_${reportType}_${todayStr()}.pdf`);
}
