/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, BarChart2, ChevronRight, Activity, Percent } from "lucide-react";

interface SeedHistoryItem {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
  posRevenue: number;
}

interface InteractiveChartsProps {
  historyData: SeedHistoryItem[];
  categoryPerformance: { category: string; sales: number; profit: number }[];
  productMarginalData: { name: string; margin: number; sales: number }[];
}

export default function InteractiveCharts({
  historyData,
  categoryPerformance,
  productMarginalData
}: InteractiveChartsProps) {
  const [metricTab, setMetricTab] = useState<"revenue" | "profit" | "orders">("revenue");

  // Format to IDR Currency Rupiah
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Safe Tooltip formatter
  const formatTooltip = (value: any, name: any) => {
    if (name === "Pendapatan" || name === "Keuntungan" || name === "POS Sales") {
      return [formatIDR(Number(value)), name];
    }
    return [value, name];
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* SECTION 2: EXECUTIVE OVERVIEW CHART PANEL (8 Columns) */}
      <div className="xl:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[380px]">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5 gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>SECTION 2 & 3: EXECUTIVE TREND & SALES ANALYTICS</span>
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Visualisasi terpadu perbandingan target harian perolehan omzet, laba kotor, dan pesanan.
              </p>
            </div>

            {/* Metric switches tabs */}
            <div className="flex bg-slate-55 dark:bg-slate-900 border dark:border-slate-800 p-1 rounded-xl self-stretch sm:self-auto">
              <button
                onClick={() => setMetricTab("revenue")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                  metricTab === "revenue"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Omzet
              </button>
              <button
                onClick={() => setMetricTab("profit")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                  metricTab === "profit"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Laba
              </button>
              <button
                onClick={() => setMetricTab("orders")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                  metricTab === "orders"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Volume
              </button>
            </div>
          </div>

          {/* Area Combined Recharts */}
          <div className="w-full h-64 mt-4 text-[10px] select-none font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" className="opacity-15 dark:opacity-5" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (metricTab !== "orders" ? `${val / 1000000}M` : val)}
                />
                <Tooltip formatter={formatTooltip} contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: "8px" }} />
                <Legend iconSize={8} wrapperStyle={{ paddingTop: "10px" }} />
                
                {metricTab === "revenue" && (
                  <>
                    <Area
                      type="monotone"
                      name="Pendapatan"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradientActive)"
                    />
                    <Line type="monotone" name="POS Sales" dataKey="posRevenue" stroke="#d4af37" strokeWidth={2} dot={{ r: 3 }} />
                  </>
                )}

                {metricTab === "profit" && (
                  <Area
                    type="monotone"
                    name="Keuntungan"
                    dataKey="profit"
                    stroke="#0284c7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradientActive)"
                  />
                )}

                {metricTab === "orders" && (
                  <Bar name="Volume Transaksi" dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic footer summary statistics */}
        <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-705 flex flex-wrap items-center justify-between text-2xs gap-3">
          <div className="flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500">Masa Pengawasan: 7 Hari Siklus Terakhir</span>
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Penjualan Kumulatif Stabil di atas Rata-rata Nasional
          </span>
        </div>
      </div>

      {/* SECTION 6: PRODUCT PERFORMANCE CHART PANEL (4 Columns) */}
      <div className="xl:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[380px]">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2 pb-4 border-b border-slate-50 dark:border-slate-705 mb-4">
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>SECTION 6: PRODUCT MARGIN VALUE</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
            Peringkat margins kontribusi keuntungan kotor per-SKU lampu untuk memandu optimasi subsidi iklan.
          </p>

          {/* Vertical ranking progress rows */}
          <div className="space-y-4 mt-5">
            {productMarginalData.map((item, index) => {
              const fractionPercent = item.margin;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-3xs">
                    <span className="font-extrabold text-slate-700 dark:text-slate-350 truncate max-w-[200px]">
                      {index + 1}. {item.name}
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
                      <Percent className="w-2.5 h-2.5" />
                      <span>{fractionPercent}% Gross Margin</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        fractionPercent > 45
                          ? "bg-emerald-600"
                          : fractionPercent > 35
                          ? "bg-teal-600"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${fractionPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories summaries indicators split */}
        <div className="mt-5 border-t dark:border-slate-750 pt-3.5 space-y-2 text-[10px]">
          <div className="flex justify-between items-center text-slate-500">
            <span className="font-bold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Top Margin Product:</span>
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
              Kubah Masjid LED Slim (48.5%)
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-500">
            <span className="font-bold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Bottom Margin Product:</span>
            </span>
            <span className="font-extrabold text-slate-850 dark:text-slate-100 truncate max-w-[140px]">
              Lampu Meja Kristal Eid (15.5%)
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
