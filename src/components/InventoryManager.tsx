/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Layers3, AlertTriangle, PlayCircle, PlusCircle, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { InventoryItem } from "../types";

interface InventoryManagerProps {
  inventoryItems: InventoryItem[];
  onAddStock: (sku: string, qty: number) => void;
}

export default function InventoryManager({
  inventoryItems,
  onAddStock
}: InventoryManagerProps) {
  const [restockSku, setRestockSku] = useState("");
  const [restockQty, setRestockQty] = useState(10);
  const [successRestock, setSuccessRestock] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockSku) return;

    onAddStock(restockSku, restockQty);
    const item = inventoryItems.find((i) => i.sku === restockSku);
    setSuccessRestock(`Berhasil memasok ${restockQty} unit untuk SKU: ${restockSku}!`);
    setTimeout(() => {
      setSuccessRestock("");
    }, 3000);
  };

  // Automated classifiers
  const lowStockAlerts = inventoryItems.filter((item) => item.stock_ending <= item.minimum_stock && item.stock_ending > 0);
  const outOfStockAlerts = inventoryItems.filter((item) => item.stock_ending <= 0);
  const deadStockAlerts = inventoryItems.filter((item) => item.stock_out === 0 && item.stock_ending > 20);

  // Health Score computation
  const normalStockCount = inventoryItems.filter((item) => item.stock_ending > item.minimum_stock).length;
  const healthScore = Math.round((normalStockCount / inventoryItems.length) * 100);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header Column */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5 gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
              <Layers3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>SECTION 7: INVENTORY CONTROL TOWER</span>
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Pantau tingkat optimal persediaan barang dagang, hilangkan keraguan keterlambatan pesok (gharar supply).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">HEALTH SCORE</span>
            <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-350 dark:border-emerald-900/50 px-3 py-1.5 rounded-full text-emerald-800 dark:text-emerald-400 text-xs font-black">
              <span>{healthScore}% Sehat</span>
            </div>
          </div>
        </div>

        {/* Warning cards alerts if any */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* Out of Stock alert box */}
          <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-950/40 rounded-xl">
            <div className="flex items-center justify-between font-bold text-[10px] text-red-650 dark:text-red-400 uppercase tracking-wider">
              <span>Out of Stock</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span className="text-base font-black text-rose-700 dark:text-rose-455 block mt-0.5">
              {outOfStockAlerts.length} SKU
            </span>
            <p className="text-[10px] text-rose-500 dark:text-rose-400/80 mt-1 leading-snug">
              {outOfStockAlerts.length > 0 
                ? `Segera pasok: ${outOfStockAlerts.map(i => i.sku).join(", ")}` 
                : "Semua SKU memiliki ketersediaan unit."}
            </p>
          </div>

          {/* Low stock alerts */}
          <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-950/40 rounded-xl">
            <div className="flex items-center justify-between font-bold text-[10px] text-amber-650 dark:text-amber-400 uppercase tracking-wider">
              <span>Low Stock Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span className="text-base font-black text-amber-700 dark:text-amber-455 block mt-0.5">
              {lowStockAlerts.length} SKU
            </span>
            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-1 leading-snug">
              {lowStockAlerts.length > 0 
                ? `Hampir habis: ${lowStockAlerts.map(i => i.sku).join(", ")}` 
                : "Tingkat stok aman di atas minimum."}
            </p>
          </div>

          {/* Dead stock alerts */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Dead Stock (&gt;20 psc pasif)</span>
              <Tag className="w-3.5 h-3.5" />
            </div>
            <span className="text-base font-black text-slate-700 dark:text-slate-350 block mt-0.5">
              {deadStockAlerts.length} SKU
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
              {deadStockAlerts.length > 0 
                ? `Kurang laku: ${deadStockAlerts.map(i => i.sku).join(", ")}` 
                : "Nilai putaran sirkulasi inventori stabil."}
            </p>
          </div>
        </div>

        {/* Inventory list table */}
        <div className="overflow-x-auto border rounded-xl dark:border-slate-750 max-h-[200px] overflow-y-auto pr-1">
          <table className="w-full text-left text-3xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-750 font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                <th className="p-2.5">SKU / Nama</th>
                <th className="p-2.5 text-center">Beginning</th>
                <th className="p-2.5 text-center">Stok In</th>
                <th className="p-2.5 text-center">Stok Out</th>
                <th className="p-2.5 text-center">Hasil Akhir</th>
                <th className="p-2.5 text-right">Modal Buku</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => {
                const endingStyle =
                  item.stock_ending < 5
                    ? "bg-red-150 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-extrabold border border-red-300 dark:border-red-900"
                    : item.stock_ending <= 10
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-350";

                const isFastMoving = item.stock_out > 7;

                return (
                  <tr key={item.sku} className="hover:bg-slate-55/40 dark:hover:bg-slate-900/10 border-b dark:border-slate-750 text-2xs">
                    <td className="p-2.5">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200">{item.sku}</div>
                      <div className="text-slate-400 font-medium line-clamp-1 text-[10px]">{item.product_name}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-500">{item.stock_beginning}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-600">+{item.stock_in}</td>
                    <td className="p-2.5 text-center font-bold text-rose-600">-{item.stock_out}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full ${endingStyle}`}>
                        {item.stock_ending} Unit
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-250">
                      {formatIDR(item.cost_price)}
                    </td>
                    <td className="p-2.5 text-center">
                      {isFastMoving ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-4xs font-black uppercase tracking-wider border border-emerald-300 leading-none">
                          ⚡ Fast Moving
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 text-slate-500 text-4xs font-bold uppercase tracking-wider leading-none">
                          🐢 Slow Moving
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESTOCK / PO INPUT SIMULATOR */}
      <div className="mt-5 border-t dark:border-slate-750 pt-4">
        <h3 className="text-2xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-3">
          Restock Supply Order (Amanah Purchase Order)
        </h3>
        
        {successRestock && (
          <div className="mb-3.5 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-400 text-3xs font-bold leading-normal">
            {successRestock}
          </div>
        )}

        <form onSubmit={handleRestockSubmit} className="flex flex-col sm:flex-row gap-3 items-end justify-between">
          <div className="w-full sm:flex-1">
            <label className="block text-3xs font-black text-slate-400 dark:text-slate-500 uppercase mb-1">
              PILIH SKU YANG AKAN DIPASOK
            </label>
            <select
              value={restockSku}
              onChange={(e) => setRestockSku(e.target.value)}
              className="w-full text-3xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 border dark:border-slate-700 rounded-lg outline-none"
            >
              <option value="">-- Pilih Barang Persediaan --</option>
              {inventoryItems.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.sku} - {item.product_name} (Stok: {item.stock_ending})
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-28">
            <label className="block text-3xs font-black text-slate-400 dark:text-slate-500 uppercase mb-1">
              JUMLAH PASOKAN
            </label>
            <input
              type="number"
              required
              min={1}
              value={restockQty}
              onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full text-3xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-205 p-2 border dark:border-slate-700 rounded-lg outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 hover:bg-emerald-500 bg-emerald-600 text-white text-3xs font-black uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pesan Stok Baru</span>
          </button>
        </form>
      </div>

    </div>
  );
}
