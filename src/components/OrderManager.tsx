/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { PlusCircle, Upload, Download, Trash2, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { MarketplaceOrder, InventoryItem } from "../types";
import { parseOrdersFile } from "../utils/orderImport";

interface OrderManagerProps {
  orders: MarketplaceOrder[];
  inventoryItems: InventoryItem[];
  onAddOrders: (orders: MarketplaceOrder[]) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: MarketplaceOrder["order_status"]) => void;
  canWrite: boolean;
}

// Valid one-way status transitions (BR-TRX-002). Returned/Cancelled are final.
const ALLOWED_NEXT: Record<MarketplaceOrder["order_status"], MarketplaceOrder["order_status"][]> = {
  Processing: ["Processing", "Completed", "Delivered", "Returned", "Cancelled"],
  Delivered: ["Delivered", "Completed", "Returned"],
  Completed: ["Completed", "Returned"],
  Returned: ["Returned"],
  Cancelled: ["Cancelled"]
};

const PROVINCES = [
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Sumatera Utara", "Sumatera Selatan", "Kalimantan Timur", "Kalimantan Selatan",
  "Sulawesi Selatan", "Bali"
];
const STATUSES: MarketplaceOrder["order_status"][] = ["Completed", "Processing", "Delivered", "Returned", "Cancelled"];

const idr = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

export default function OrderManager({ orders, inventoryItems, onAddOrders, onDeleteOrder, onUpdateStatus, canWrite }: OrderManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [sku, setSku] = useState(inventoryItems[0]?.sku || "");
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [province, setProvince] = useState(PROVINCES[0]);
  const [status, setStatus] = useState<MarketplaceOrder["order_status"]>("Completed");
  const [customerName, setCustomerName] = useState("Pembeli Shopee");
  const [msg, setMsg] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const product = inventoryItems.find((i) => i.sku === sku);
  const unitPrice = product ? Math.round(product.cost_price * 1.95) : 0;
  const gross = unitPrice * qty;
  const net = Math.max(0, gross - discount);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const order: MarketplaceOrder = {
      order_id: `MAN-${Date.now().toString(36).toUpperCase()}`,
      order_date: new Date().toISOString(),
      customer_name: customerName || "Pembeli Shopee",
      customer_phone: "",
      province,
      city: "-",
      district: "-",
      product_name: product.product_name,
      category: "Manual",
      sku: product.sku,
      qty,
      unit_price: unitPrice,
      gross_sales: gross,
      discount,
      net_sales: net,
      order_status: status,
      admin_fee: Math.round(net * 0.0425),
      service_fee: Math.round(net * 0.02),
      handling_fee: 2000,
      shipping_paid_by_buyer: 20000,
      shipping_forwarded_to_courier: 20000
    };
    onAddOrders([order]);
    setImportErrors([]);
    flash(`Transaksi ${order.order_id} berhasil ditambahkan.`);
    setQty(1);
    setDiscount(0);
  };

  const handleImport = async (file: File) => {
    const { orders: parsed, errors } = await parseOrdersFile(file);
    const existing = new Set(orders.map((o) => o.order_id));
    const fresh = parsed.filter((o) => !existing.has(o.order_id));
    const dup = parsed.length - fresh.length;
    if (fresh.length) onAddOrders(fresh);
    setImportErrors(errors.slice(0, 5));
    flash(
      `${fresh.length} order ditambahkan` +
        (dup ? `, ${dup} duplikat dilewati` : "") +
        (errors.length ? `, ${errors.length} baris error` : "") +
        "."
    );
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const headers = [
      "No. Pesanan", "Waktu Pesanan Dibuat", "Nama Produk", "SKU", "Jumlah", "Harga Awal (IDR)",
      "Diskon Produk dari Penjual (IDR)", "Status Pesanan", "Provinsi", "Kota",
      "Biaya Administrasi (IDR)", "Biaya Layanan (IDR)", "Ongkos Kirim Dibayar oleh Pembeli (IDR)"
    ];
    const ex = [
      "SPX-CONTOH-001", "2026-06-15", "Lampu Gantung Kubah Masjid LED Lumina Slim", "LMP-KUB-LED-01",
      "2", "350000", "50000", "Pesanan Selesai", "DKI Jakarta", "Jakarta Selatan", "27625", "13000", "20000"
    ];
    const csv = headers.join(",") + "\n" + ex.map((v) => `"${v}"`).join(",") + "\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Import_Transaksi_LUXORA.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = (o: MarketplaceOrder, next: MarketplaceOrder["order_status"]) => {
    if (next === o.order_status) return;
    if (next === "Returned" || next === "Cancelled") {
      if (!window.confirm(`Ubah status ${o.order_id} menjadi ${next}? Status ini final dan tidak dapat diubah lagi.`)) return;
    }
    onUpdateStatus(o.order_id, next);
    flash(`Status ${o.order_id} diubah ke ${next}.`);
  };

  const inputCls =
    "w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500";
  const labelCls = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5 gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>MANAJEMEN TRANSAKSI MARKETPLACE</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Input manual atau impor laporan Shopee (CSV/XLSX). Data tersimpan per-akun &amp; masuk ke seluruh laporan. (F-01)
          </p>
        </div>
        <span className="text-2xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
          {orders.length} transaksi
        </span>
      </div>

      {msg && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{msg}</span>
        </div>
      )}
      {importErrors.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400 text-3xs font-semibold">
          <div className="flex items-center gap-1.5 font-black mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Sebagian baris dilewati:</div>
          {importErrors.map((er, i) => <div key={i}>• {er}</div>)}
        </div>
      )}

      {!canWrite ? (
        <div className="mb-5 p-3 text-3xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
          Tampilan transaksi bersifat read-only untuk peran Anda. Input/impor hanya untuk Owner &amp; Staff.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Manual input */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <h3 className="text-2xs font-black tracking-widest text-slate-400 uppercase">Input Manual</h3>
            <div>
              <label className={labelCls}>Produk</label>
              <select value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls}>
                {inventoryItems.map((i) => (
                  <option key={i.sku} value={i.sku}>{i.product_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Qty</label>
                <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Diskon</label>
                <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as MarketplaceOrder["order_status"])} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Provinsi</label>
                <select value={province} onChange={(e) => setProvince(e.target.value)} className={inputCls}>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pembeli</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="text-2xs">
                <span className="text-slate-400 font-bold">Netto: </span>
                <span className="font-black text-slate-800 dark:text-white">{idr(net)}</span>
                <span className="text-3xs text-slate-400 ml-1">(@{idr(unitPrice)})</span>
              </div>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-2xs font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer">
                <PlusCircle className="w-4 h-4" /> Tambah
              </button>
            </div>
          </form>

          {/* Import */}
          <div className="space-y-3">
            <h3 className="text-2xs font-black tracking-widest text-slate-400 uppercase">Impor Berkas (CSV / XLSX)</h3>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-all"
            >
              <Upload className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-2xs font-bold text-slate-600 dark:text-slate-300 mt-2">Klik untuk pilih file laporan Shopee</p>
              <p className="text-3xs text-slate-400 mt-0.5">Mendukung .csv dan .xlsx · header otomatis dipetakan</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }}
              />
            </div>
            <button onClick={downloadTemplate} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-3xs font-black uppercase rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Unduh Template CSV
            </button>
          </div>
        </div>
      )}

      {/* Orders table */}
      <h3 className="text-2xs font-black tracking-widest text-slate-400 uppercase mb-2">Daftar Transaksi Terbaru</h3>
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-left text-3xs">
          <thead className="sticky top-0 bg-white dark:bg-slate-800">
            <tr className="border-b dark:border-slate-750 text-slate-400 font-black uppercase">
              <th className="py-2 pr-2">Order ID</th>
              <th className="py-2 pr-2">Produk</th>
              <th className="py-2 pr-2 text-center">Qty</th>
              <th className="py-2 pr-2 text-right">Netto</th>
              <th className="py-2 pr-2 text-center">Status</th>
              {canWrite && <th className="py-2 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 50).map((o) => (
              <tr key={o.order_id} className="border-b dark:border-slate-755 text-slate-600 dark:text-slate-300">
                <td className="py-2 pr-2 font-bold">{o.order_id}</td>
                <td className="py-2 pr-2 truncate max-w-[180px]">{o.product_name}</td>
                <td className="py-2 pr-2 text-center">{o.qty}</td>
                <td className="py-2 pr-2 text-right font-bold">{idr(o.net_sales)}</td>
                <td className="py-2 pr-2 text-center">
                  {canWrite && ALLOWED_NEXT[o.order_status].length > 1 ? (
                    <select
                      value={o.order_status}
                      onChange={(e) => handleStatusChange(o, e.target.value as MarketplaceOrder["order_status"])}
                      title="Ubah status transaksi"
                      className="text-4xs font-black uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
                    >
                      {ALLOWED_NEXT[o.order_status].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`px-1.5 py-0.5 rounded text-4xs font-black uppercase ${
                      o.order_status === "Completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
                      o.order_status === "Cancelled" || o.order_status === "Returned" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                    }`}>{o.order_status}</span>
                  )}
                </td>
                {canWrite && (
                  <td className="py-2 text-center">
                    <button onClick={() => onDeleteOrder(o.order_id)} className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" title="Hapus transaksi">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
