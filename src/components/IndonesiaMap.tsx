/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Globe, RefreshCw, Layers, TrendingUp } from "lucide-react";

interface ProvinceData {
  name: string;
  revenue: number;
  orders: number;
  returns: number;
  profit: number;
}

interface IndonesiaMapProps {
  provinceMetrics: Record<string, ProvinceData>;
  selectedProvince: string;
  onSelectProvince: (prov: string) => void;
}

export default function IndonesiaMap({
  provinceMetrics,
  selectedProvince,
  onSelectProvince
}: IndonesiaMapProps) {
  // Format to IDR Currency Rupiah
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Provinces list
  const activeProvinces = [
    { name: "DKI Jakarta", x: "32%", y: "75%", island: "Java", color: "fill-emerald-500 hover:fill-emerald-400" },
    { name: "Jawa Barat", x: "28%", y: "72%", island: "Java", color: "fill-emerald-600 hover:fill-emerald-500" },
    { name: "Jawa Tengah", x: "37%", y: "73%", island: "Java", color: "fill-emerald-600 hover:fill-emerald-500" },
    { name: "DI Yogyakarta", x: "39%", y: "78%", island: "Java", color: "fill-amber-500 hover:fill-amber-400" },
    { name: "Jawa Timur", x: "47%", y: "75%", island: "Java", color: "fill-emerald-700 hover:fill-emerald-600" },
    { name: "Sumatera Utara", x: "8%", y: "30%", island: "Sumatras", color: "fill-emerald-800 hover:fill-emerald-700" },
    { name: "Sumatera Selatan", x: "18%", y: "55%", island: "Sumatras", color: "fill-emerald-700 hover:fill-emerald-600" },
    { name: "Kalimantan Timur", x: "55%", y: "42%", island: "Kalimantan", color: "fill-teal-600 hover:fill-teal-500" },
    { name: "Kalimantan Selatan", x: "52%", y: "48%", island: "Kalimantan", color: "fill-teal-700 hover:fill-teal-600" },
    { name: "Sulawesi Selatan", x: "68%", y: "58%", island: "Sulawesi", color: "fill-emerald-800 hover:fill-emerald-700" },
    { name: "Bali", x: "51%", y: "78%", island: "Sunda", color: "fill-amber-600 hover:fill-amber-500" }
  ];

  return (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-700/50 mb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>GEOGRAPHIC ANALYTICS MAP INDONESIA</span>
          </h2>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            Klik pin wilayah untuk filter data transaksi marketplace dan retur secara instan.
          </p>
        </div>
        {selectedProvince && (
          <button
            onClick={() => onSelectProvince("")}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-2xs font-bold rounded-lg transition-all"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Reset Geografis</span>
          </button>
        )}
      </div>

      {/* Main Map Box */}
      <div className="relative flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center min-h-[300px]">
        
        {/* SVG Indonesia Map Visualisation */}
        <div className="relative w-full lg:w-2/3 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-100/50 dark:border-slate-850">
          <svg
            viewBox="0 0 1000 480"
            className="w-full h-auto text-slate-300 dark:text-slate-700 transition-all filter drop-shadow hover:drop-shadow-md"
          >
            {/* Outline of Indonesia Main Islands representation with precise custom vector curves to look pro */}
            <g className="opacity-30 dark:opacity-20 fill-slate-300 dark:fill-slate-650">
              {/* Sumatera island path representation */}
              <path d="M 50 120 L 150 170 L 250 310 L 220 330 L 120 220 L 40 140 Z" />
              {/* Kalimantan path representation */}
              <path d="M 420 160 L 520 160 L 560 210 L 560 270 L 480 300 L 430 250 Z" />
              {/* Java path representation */}
              <path d="M 230 330 L 260 330 L 420 350 L 520 360 L 500 375 L 300 355 L 230 330 Z" />
              {/* Sulawesi path representation */}
              <path d="M 640 180 L 680 180 L 680 230 L 740 230 L 710 260 L 670 260 L 660 315 L 635 315 L 635 240 L 570 240 L 570 210 L 640 210 Z" />
              {/* Bali & Lombok path representation */}
              <path d="M 525 363 L 540 364 L 560 365 L 555 372 L 530 371 Z" />
              {/* Papua path representation */}
              <path d="M 850 250 L 980 260 L 980 360 L 930 360 L 890 320 L 840 300 Z" />
            </g>

            {/* Connecting visual routes for Shopee delivery to JKT hub */}
            <g stroke="#10b981" strokeWidth="1" strokeDasharray="5,5" className="opacity-40">
              <line x1="80" y1="150" x2="320" y2="350" /> {/* Sumut -> JKT */}
              <line x1="180" y1="270" x2="320" y2="350" /> {/* Sumsel -> JKT */}
              <line x1="550" y1="200" x2="320" y2="350" /> {/* Kaltim -> JKT */}
              <line x1="680" y1="290" x2="320" y2="350" /> {/* Sulsel -> JKT */}
              <line x1="470" y1="355" x2="320" y2="350" /> {/* Sby -> JKT */}
            </g>

            {/* Clickable Interactive Nodes / Pins */}
            {activeProvinces.map((prov) => {
              const active = selectedProvince === prov.name;
              const stats = provinceMetrics[prov.name] || { revenue: 0, orders: 0, returns: 0, profit: 0 };
              
              return (
                <g
                  key={prov.name}
                  onClick={() => onSelectProvince(prov.name)}
                  className="cursor-pointer group/node"
                >
                  {/* Outer waves pulse */}
                  <circle
                    cx={prov.x}
                    cy={prov.y}
                    r={active ? "18" : "11"}
                    className={`transition-all duration-300 stroke-2 opacity-50 ${
                      active
                        ? "stroke-amber-500 fill-amber-500/20 animate-ping"
                        : "stroke-emerald-500 fill-emerald-500/10 group-hover/node:scale-125"
                    }`}
                  />
                  
                  {/* Solid inner pin indicator */}
                  <circle
                    cx={prov.x}
                    cy={prov.y}
                    r={active ? "8" : "6"}
                    className={`transition-all duration-300 ${
                      active
                        ? "fill-amber-500 stroke-white stroke-2"
                        : stats.returns > 0 && prov.name === "Jawa Timur"
                        ? "fill-rose-500 animate-pulse"
                        : "fill-emerald-600 group-hover/node:fill-emerald-400 stroke-white stroke-1"
                    }`}
                  />

                  {/* Text Title Labels above major nodes */}
                  <text
                    x={prov.x}
                    y={parseFloat(prov.y) - 15 + "%"}
                    textAnchor="middle"
                    className={`text-[9px] font-black tracking-wider pointer-events-none select-none transition-colors ${
                      active
                        ? "fill-amber-600 dark:fill-amber-400 font-extrabold"
                        : "fill-slate-600 dark:fill-slate-400 group-hover/node:fill-emerald-600"
                    }`}
                  >
                    {prov.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Overlay info */}
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-800/95 border border-slate-100 dark:border-slate-700/50 p-2.5 rounded-lg text-[10px] space-y-1 shadow-sm leading-normal">
            <div className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center space-x-1 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
              <span>Kunci Hijau: Rendah Retur</span>
            </div>
            <div className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center space-x-1 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
              <span>Kunci Merah: Tinggi Retur (Jatim)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Province Metrics Panel */}
        <div className="w-full lg:w-1/3 flex flex-col justify-between h-full bg-slate-50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-150/50 dark:border-slate-700/60 self-stretch">
          <div>
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center space-x-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>Detail Wilayah: {selectedProvince || "Semua Wilayah"}</span>
            </h3>

            {selectedProvince ? (
              <div className="space-y-4 mt-4">
                {/* Revenue Card */}
                <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-750">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block">PENDAPATAN WILAYAH</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white block mt-0.5">
                    {formatIDR(provinceMetrics[selectedProvince]?.revenue || 0)}
                  </span>
                </div>

                {/* Grid for orders & profit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-750">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider block">ORDERS</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">
                      {provinceMetrics[selectedProvince]?.orders || 0} Paket
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-750">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider block">LABA ESTIMASI</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatIDR(provinceMetrics[selectedProvince]?.profit || 0)}
                    </span>
                  </div>
                </div>

                {/* Returns rate inside selected */}
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-700 dark:text-rose-400">JUMLAH BARANG DIRETUR</span>
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-100 dark:bg-rose-900/50 px-1.5 rounded-full">
                      {(provinceMetrics[selectedProvince]?.returns || 0)} Unit
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1.5 leading-relaxed">
                    {selectedProvince === "Jawa Timur" 
                      ? "Peringatan: Daerah ini memiliki return rate tertinggi akibat pengemasan kaca lampu pecah di jalan. Diperlukan sharia packing kayu tumpuk."
                      : "Status logistik aman. Belum terdeteksi adanya spike kerugian pengemasan di provinsi ini."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Globe className="w-10 h-10 text-slate-300 dark:text-slate-600 animate-spin" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-3 max-w-[200px]">
                  Silakan pilih pin lokasi atau saksikan data gabungan nasional Indonesia.
                </p>
              </div>
            )}
          </div>

          {/* Quick National Summary bottom list */}
          {!selectedProvince && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Top Provinsi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">DKI Jakarta</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Sumbangsih Sumatra:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">12% Omzet</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Potensi Bali (Amanah):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">100% Terkirim</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
