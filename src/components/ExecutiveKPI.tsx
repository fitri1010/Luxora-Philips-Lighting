/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Wallet, RefreshCw, XSquare, Activity, Award, BarChart3, HelpCircle } from "lucide-react";

interface KPIMetrics {
  grossSales: number;
  netSales: number;
  orderCount: number;
  grossProfit: number;
  netProfit: number;
  cashBalance: number;
  returnRate: number;
  cancelRate: number;
  inventoryTurnover: number;
  adsRoi: number;
  shariaScore: number;
  shariaBadge: string;
}

interface ExecutiveKPIProps {
  metrics: KPIMetrics;
  hideFinancials?: boolean;
}

// Cards that expose money / compliance figures — hidden from non-finance roles (Staff).
const FINANCIAL_CARD_IDS = [
  "kpi-revenue", "kpi-net-revenue", "kpi-gross-profit", "kpi-net-profit", "kpi-cash", "kpi-ads-roi", "kpi-sharia-score"
];

export default function ExecutiveKPI({ metrics, hideFinancials = false }: ExecutiveKPIProps) {
  // Format to IDR Currency Rupiah
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const cardStyle = "relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between";

  const items = [
    {
      id: "kpi-revenue",
      title: "Gross Revenue",
      value: formatIDR(metrics.grossSales),
      subtitle: "Jumlah total omzet kotor",
      formula: "SUM(Semua Penjualan Marketplace & POS)",
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      colorClass: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600",
      trend: "+12.4% vs bulan lalu",
      isPositive: true
    },
    {
      id: "kpi-net-revenue",
      title: "Net Revenue",
      value: formatIDR(metrics.netSales),
      subtitle: "Pendapatan bersih realisasi",
      formula: "Gross Sales - Returns - Cancels",
      icon: <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      colorClass: "bg-teal-50 dark:bg-teal-950/20 text-teal-600",
      trend: "+10.8% vs bulan lalu",
      isPositive: true
    },
    {
      id: "kpi-orders",
      title: "Total Orders",
      value: `${metrics.orderCount} Transaksi`,
      subtitle: "Gabungan Shopee & POS Offline",
      formula: "COUNT(order_id) + COUNT(transaction_id)",
      icon: <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      colorClass: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600",
      trend: "+8.5% volume mingguan",
      isPositive: true
    },
    {
      id: "kpi-gross-profit",
      title: "Gross Profit (Laba Kotor)",
      value: formatIDR(metrics.grossProfit),
      subtitle: "Laba kotor setelah modal barang",
      formula: "Net Revenue - COGS (Modal Barang)",
      icon: <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      colorClass: "bg-blue-50 dark:bg-blue-950/20 text-blue-600",
      trend: "Margin Kontribusi 43.1%",
      isPositive: true
    },
    {
      id: "kpi-net-profit",
      title: "Net Profit (Laba Bersih)",
      value: formatIDR(metrics.netProfit),
      subtitle: "Laba bersih setelah semua biaya",
      formula: "Gross Profit - Operational Expenses (OPEX)",
      icon: <Activity className="w-5 h-5 text-emerald-500" />,
      colorClass: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500",
      trend: `Margin Bersih: ${((metrics.netProfit / metrics.netSales) * 100).toFixed(1)}%`,
      isPositive: true
    },
    {
      id: "kpi-cash",
      title: "Cash Balance",
      value: formatIDR(metrics.cashBalance),
      subtitle: "Kas Likuid Perniagaan",
      formula: "Kas Masuk - OPEX - Pembayaran Supplier",
      icon: <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-500" />,
      colorClass: "bg-amber-50 dark:bg-amber-950/20 text-amber-600",
      trend: "Likuiditas Sangat Aman",
      isPositive: true
    },
    {
      id: "kpi-return-rate",
      title: "Return Rate",
      value: `${metrics.returnRate.toFixed(1)}%`,
      subtitle: "Rasio retur pengiriman",
      formula: "(Jumlah Returned / Total Orders) × 100",
      icon: <RefreshCw className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      colorClass: "bg-rose-50 dark:bg-rose-950/20 text-rose-600",
      trend: "Risiko utama pecah barang",
      isPositive: metrics.returnRate < 5
    },
    {
      id: "kpi-cancel-rate",
      title: "Cancel Rate",
      value: `${metrics.cancelRate.toFixed(1)}%`,
      subtitle: "Rasio pesanan dibatalkan",
      formula: "(Jumlah Cancelled / Total Orders) × 100",
      icon: <XSquare className="w-5 h-5 text-red-600 dark:text-red-400" />,
      colorClass: "bg-red-50 dark:bg-red-950/20 text-red-600",
      trend: "Di bawah toleransi 3%",
      isPositive: metrics.cancelRate < 3
    },
    {
      id: "kpi-turnover",
      title: "Inventory Turnover",
      value: `${metrics.inventoryTurnover.toFixed(1)}x`,
      subtitle: "Perputaran stok per bulan",
      formula: "COGS / Rata-rata Nilai Inventori",
      icon: <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-500" />,
      colorClass: "bg-orange-50 dark:bg-orange-950/20 text-orange-600",
      trend: "Ideal: 3-4x per tahun",
      isPositive: true
    },
    {
      id: "kpi-ads-roi",
      title: "Ads ROAS",
      value: `${metrics.adsRoi.toFixed(1)}x`,
      subtitle: "Rasio pengembalian biaya iklan",
      formula: "Omzet Iklan / Biaya Iklan Keywords",
      icon: <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />,
      colorClass: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600",
      trend: "Target minimal: 3.0x",
      isPositive: metrics.adsRoi >= 3
    },
    {
      id: "kpi-sharia-score",
      title: "Sharia Score",
      value: `${metrics.shariaScore}/100`,
      subtitle: metrics.shariaBadge,
      formula: "Rata-rata 7 Kriteria Kepatuhan Muamalah",
      icon: <Award className="w-5 h-5 text-yellow-500" />,
      colorClass: "bg-amber-100/60 dark:bg-amber-950/30 text-amber-600",
      trend: "Bebas Riba & Gharar Certified",
      isPositive: true
    }
  ];

  const visibleItems = hideFinancials
    ? items.filter((item) => !FINANCIAL_CARD_IDS.includes(item.id))
    : items;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {visibleItems.map((item) => (
        <div
          id={item.id}
          key={item.id}
          className={`${cardStyle} ${
            item.title === "Sharia Score"
              ? "xl:col-span-2 border-amber-300 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/5"
              : "xl:col-span-1"
          }`}
        >
          {/* Card Accent Gradient */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-100 dark:from-slate-800/50 to-transparent pointer-events-none rounded-bl-3xl"></div>

          {/* Icon and Tooltip */}
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${item.colorClass}`}>
              {item.icon}
            </div>
            
            <div className="group relative cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              {/* Tooltip Content */}
              <div className="absolute right-0 bottom-full mb-2 w-48 p-2 text-[10px] bg-slate-900 text-white rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg text-center font-normal leading-normal">
                <span className="font-bold block border-b border-white/20 pb-1 mb-1">Rumus Akuntansi:</span>
                {item.formula}
              </div>
            </div>
          </div>

          {/* Metric Value */}
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {item.title}
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none block mt-1">
              {item.value}
            </span>
          </div>

          {/* Subtitle & Trend */}
          <div className="mt-3 border-t border-slate-50 dark:border-slate-700/50 pt-2 flex flex-col">
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
              {item.subtitle}
            </span>
            <div className="flex items-center space-x-1 mt-1">
              {item.isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              )}
              <span className={`text-[10px] font-bold ${item.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {item.trend}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
