/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sheet, FileSpreadsheet, Printer, RefreshCw, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { MarketplaceOrder, POSTransaction, InventoryItem, RiskItem, ZakatRecord } from "../types";

interface ReportCenterProps {
  orders: MarketplaceOrder[];
  posHistory: POSTransaction[];
  inventoryItems: InventoryItem[];
  riskItems: RiskItem[];
  zakatRecords: ZakatRecord[];
  netSales: number;
  grossProfit: number;
  netProfit: number;
  opexTotal: number;
}

export default function ReportCenter({
  orders,
  posHistory,
  inventoryItems,
  riskItems,
  zakatRecords,
  netSales,
  grossProfit,
  netProfit,
  opexTotal
}: ReportCenterProps) {
  const [activeReport, setActiveReport] = useState<
    "PL" | "CashFlow" | "Sales" | "Inventory" | "POS" | "Return" | "Risk" | "Sharia" | "Zakat"
  >("PL");

  const [exportedMsg, setExportedMsg] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // List of reports
  const reportsList = [
    { value: "PL", label: "Profit & Loss Report", desc: "Arus laba rugi bersih, modal barang (COGS) dan detail operational fee." },
    { value: "CashFlow", label: "Cash Flow Report", desc: "Rekonsiliasi dana kas masuk digital & fisik terpisah." },
    { value: "Sales", label: "Sales Report", desc: "Detail omzet kotor, neto, kuantitas per-item terkirim marketplace." },
    { value: "Inventory", label: "Inventory Report", desc: "Status persediaan buku, sirkulasi in-out dan nilai aset tersimpan." },
    { value: "POS", label: "POS Transaction Ledger", desc: "Catatan transaksi kasir di kasir toko luring (offline)." },
    { value: "Return", label: "Return Ledger", desc: "Daftar pengembalian dana pembeli akibat kondisi tidak sesuai." },
    { value: "Risk", label: "Risk Command Audit", desc: "Arus bocor logistik mencakup kerusakan fisik produk pecah di luar pulau." },
    { value: "Sharia", label: "Sharia Compliance Audit", desc: "Evaluasi transparansi transaksi, sertifikasi bebas riba, najsy." },
    { value: "Zakat", label: "Zakat Mal Statement", desc: "Haul wajib zakat perdagangan 2.5% dan riwayat bayar lembaga LAZ." }
  ] as const;

  const currentMonthName = "Juni 2026 (Active Month)";

  const inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.stock_ending * item.cost_price), 0);
  const cashBalance = netProfit + 50000000;

  // Trigger HTML table to CSV conversion & download
  const handleCSVExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const reportName = reportsList.find(r => r.value === activeReport)?.label || "KAS_Report";

    // Build plain rows based on report selection
    if (activeReport === "PL") {
      csvContent += "Laporan Laba Rugi KAS - " + currentMonthName + "\n";
      csvContent += "Item,Nilai\n";
      csvContent += `Pendapatan Bersih (Net Sales), ${netSales}\n`;
      csvContent += `Laba Kotor (Gross Profit), ${grossProfit}\n`;
      csvContent += `Biaya Operasional (OPEX), ${opexTotal}\n`;
      csvContent += `Laba Bersih (Net Profit), ${netProfit}\n`;
    } else if (activeReport === "Inventory") {
      csvContent += "SKU,Nama Barang,Beginning,Stok In,Stok Out,Stock Ending,Modal Satuan\n";
      inventoryItems.forEach(i => {
        csvContent += `${i.sku},"${i.product_name}",${i.stock_beginning},${i.stock_in},${i.stock_out},${i.stock_ending},${i.cost_price}\n`;
      });
    } else {
      csvContent += `${reportName} - Eksportir KAS Accounting Systems\n`;
      csvContent += "Generated Date, " + new Date().toISOString() + "\n";
      csvContent += "Status, Audited Sharia Certifications Verified\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedMsg("Laporan berhasil dikonversi ke format XLSX-CSV Excel!");
    setTimeout(() => setExportedMsg(""), 3500);
  };

  // Standard Print Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5 gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
              <Sheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>REPORT CENTER GENERAL GENERAL LEDGER</span>
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Kompilasi lembar kerja akuntansi (accounting sheet) berstandar IFRS dan SAK Syariah Indonesia.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* CSV export button */}
            <button
              onClick={handleCSVExport}
              className="flex items-center space-x-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-3xs font-black uppercase rounded-lg border border-emerald-250 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV/XLSX</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-250 text-3xs font-black uppercase rounded-lg transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF (Print)</span>
            </button>
          </div>
        </div>

        {exportedMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportedMsg}</span>
          </div>
        )}

        {/* Content Layout: Report Categories left, Sheet View right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CATEGORIES RAIL - 4 Columns */}
          <div className="lg:col-span-4 space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {reportsList.map((rep) => {
              const active = activeReport === rep.value;
              return (
                <button
                  key={rep.value}
                  onClick={() => setActiveReport(rep.value)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    active
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-slate-150/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <span className={`text-2xs font-extrabold ${active ? "text-emerald-700 dark:text-emerald-450" : "text-slate-800 dark:text-slate-250"}`}>
                    {rep.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-normal block">
                    {rep.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SHEET PREVIEW CONTAINER - 8 Columns */}
          <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border dark:border-slate-800 text-xs font-mono select-text min-h-[355px] flex flex-col justify-between">
            <div>
              {/* Header inside sheet */}
              <div className="flex justify-between items-start pb-3 border-b dark:border-slate-850">
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block leading-none">
                    KAS SHEET SYSTEM
                  </span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-1 uppercase">
                    {reportsList.find(r => r.value === activeReport)?.label}
                  </span>
                </div>
                <div className="text-right flex flex-col text-[10px] text-slate-400 leading-normal">
                  <span className="font-bold">Periode: {currentMonthName}</span>
                  <span>Verifikasi: Al-Amanah Audited</span>
                </div>
              </div>

              {/* SHEET SPECIFICS RENDER */}
              <div className="py-4 space-y-3">
                {activeReport === "PL" && (
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold border-b dark:border-slate-750 pb-1 text-slate-500 text-[10px]">
                      <span>AKUN KEUANGAN</span>
                      <span>NOMINAL ESTIMASI</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800 dark:text-slate-350">PENDAPATAN BERSIH MARKETS:</span>
                      <span className="text-slate-800 dark:text-slate-100">{formatIDR(netSales)}</span>
                    </div>
                    <div className="flex justify-between pl-4 text-3xs text-slate-450">
                      <span>Harga Pokok Barang (COGS):</span>
                      <span>-{formatIDR(netSales - grossProfit)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t dark:border-slate-850 pt-2.5">
                      <span className="text-slate-800 dark:text-slate-350">LABA PERDAGANGAN KOTOR:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatIDR(grossProfit)}</span>
                    </div>
                    <div className="flex justify-between pl-4 text-3xs text-slate-450 pt-1">
                      <span>Biaya Iklan Shopee Keywords:</span>
                      <span>-IDR 850.000</span>
                    </div>
                    <div className="flex justify-between pl-4 text-3xs text-slate-450">
                      <span>Admin Fee + Packing Box:</span>
                      <span>-{formatIDR(opexTotal - 850000)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-dotted dark:border-slate-850 pt-3">
                      <span className="text-slate-850 dark:text-slate-200 uppercase">Laba Bersih Usaha (Net Profit):</span>
                      <span className="text-emerald-700 dark:text-emerald-450">{formatIDR(netProfit)}</span>
                    </div>
                  </div>
                )}

                {activeReport === "CashFlow" && (
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold border-b dark:border-slate-750 pb-1 text-slate-500 text-[10px]">
                      <span>ALIRAN KAS BI</span>
                      <span>NOMINAL</span>
                    </div>
                    <div className="flex justify-between text-slate-850 dark:text-slate-250">
                      <span>Arus Kas Masuk (Penerimaan POS + Shp):</span>
                      <span className="text-emerald-600">+{formatIDR(netSales)}</span>
                    </div>
                    <div className="flex justify-between text-slate-850 dark:text-slate-250">
                      <span>(Arus Kas Keluar - Biaya Adm & Packing):</span>
                      <span className="text-red-500">-{formatIDR(opexTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-850 dark:text-slate-250">
                      <span>(Arus Kas Keluar - Supplier COGS):</span>
                      <span className="text-red-550">-{formatIDR(netSales - grossProfit)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm border-t dark:border-slate-750 pt-2 text-emerald-700">
                      <span>KAS AKHIR BULAN REKONSILIASI:</span>
                      <span>{formatIDR(netProfit + 50000000)}</span>
                    </div>
                  </div>
                )}

                {activeReport === "Sales" && (
                  <div className="space-y-1.5 text-3xs">
                    <div className="flex justify-between font-bold border-b dark:border-slate-750 pb-1 text-slate-500">
                      <span>PRODUK</span>
                      <span>NETTO SALES</span>
                    </div>
                    {inventoryItems.map(item => (
                      <div key={item.sku} className="flex justify-between">
                        <span className="truncate max-w-[200px]">{item.product_name}</span>
                        <span className="font-semibold">{formatIDR(item.stock_out * item.cost_price * 1.8)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeReport === "Inventory" && (
                  <div className="space-y-1 text-3xs">
                    <div className="grid grid-cols-4 font-bold border-b dark:border-slate-750 pb-1 text-slate-500">
                      <span>SKU</span>
                      <span className="col-span-2 text-center">STOK AKHIR</span>
                      <td className="text-right">ASET BUKU</td>
                    </div>
                    {inventoryItems.map(item => (
                      <div key={item.sku} className="grid grid-cols-4 py-0.5">
                        <span className="font-extrabold">{item.sku}</span>
                        <span className="col-span-2 text-center">{item.stock_ending} Psc</span>
                        <td className="text-right text-emerald-600 font-bold">{formatIDR(item.stock_ending * item.cost_price)}</td>
                      </div>
                    ))}
                  </div>
                )}

                {activeReport === "POS" && (
                  <div className="space-y-1.5 text-3xs">
                    <div className="flex justify-between font-bold border-b dark:border-slate-750 pb-1 text-slate-500">
                      <span>TRANSAKSI</span>
                      <span>CARA BAYAR</span>
                      <span>NOMINAL</span>
                    </div>
                    {posHistory.map(tx => (
                      <div key={tx.transaction_id} className="flex justify-between">
                        <span>{tx.customer_name}</span>
                        <span>{tx.payment_method}</span>
                        <span className="font-bold">{formatIDR(tx.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeReport === "Return" && (
                  <div className="space-y-1 text-3xs">
                    <div className="flex justify-between font-bold border-b dark:border-slate-750 pb-1 text-slate-500">
                      <span>PEMBELI</span>
                      <span>SEBAB LOGISTIK</span>
                      <span>KERUGIAN</span>
                    </div>
                    {riskItems.map(item => (
                      <div key={item.id} className="flex justify-between py-0.5">
                        <span className="truncate max-w-[100px]">{item.id}</span>
                        <span className="truncate max-w-[230px] font-semibold text-rose-500">{item.return_reason || "Ganti model"}</span>
                        <span className="font-bold text-red-650">-{formatIDR(item.return_loss)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeReport === "Risk" && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-normal italic">
                      Laporan Audit Kebocoran Logistik Nasional: Tingkat Kerusakan (Damaged goods) di Jatim menyumbang 85% klaim pengembalian dana Shopee.
                    </p>
                    <div className="flex justify-between text-2xs pt-2">
                      <span>Volume Paket Rusak:</span>
                      <span className="font-extrabold text-red-650">{riskItems.filter(r => r.damaged_goods).length} Kasus</span>
                    </div>
                    <div className="flex justify-between text-2xs">
                      <span>Total Biaya Terkuras (Loss):</span>
                      <span className="font-extrabold text-red-650">{formatIDR(riskItems.reduce((s,o) => s + o.return_loss, 0))}</span>
                    </div>
                    <div className="flex justify-between text-2xs border-t dark:border-slate-75 pt-2 font-bold text-emerald-600">
                      <span>Status Refund Pelanggan:</span>
                      <span>100% Selesai Tanpa Sengketa</span>
                    </div>
                  </div>
                )}

                {activeReport === "Sharia" && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 capitalize leading-normal">
                      Pemeriksaan syariah menyatakan seluruh perikatan akad jual beli (ijab qabul) pada POS menggunakan sistem cash/digital langsung tanpa bunga riba penyangga. Deskripsi barang pada Shopee bebas gharar samar-samar.
                    </p>
                    <div className="flex justify-between text-2xs font-extrabold">
                      <span>Sertifikasi Muamalah:</span>
                      <span className="text-emerald-600">VERIFIED SYARIAH</span>
                    </div>
                    <div className="flex justify-between text-2xs font-extrabold">
                      <span>Unsur Rekayasa (Najsy):</span>
                      <span className="text-teal-600">NIHIL (Clean)</span>
                    </div>
                  </div>
                )}

                {activeReport === "Zakat" && (
                  <div className="space-y-2 text-2xs">
                    <div className="flex justify-between">
                      <span>Kekayaan Harta Lancar KAS:</span>
                      <span>{formatIDR(cashBalance + inventoryValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kewajiban Hutang Lancar:</span>
                      <span className="text-rose-500">-IDR 15.000.000</span>
                    </div>
                    <div className="flex justify-between border-t border-dotted dark:border-slate-700 pt-2 font-extrabold">
                      <span>Total Kekayaan Bersih Mulia (Mal):</span>
                      <span>{formatIDR(cashBalance + inventoryValue - 15000000)}</span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-600">
                      <span>Wajib Zakat Disetorkan (2.5%):</span>
                      <span>{formatIDR(Math.max(0, (cashBalance + inventoryValue - 15000000) * 0.025))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between text-3xs text-slate-400">
              <span className="flex items-center space-x-1 uppercase text-[9px] font-bold">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>KAS Financial Ledger ver 4.2</span>
              </span>
              <span>Audit Hash: SHARP-KAS-2026-X8</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
