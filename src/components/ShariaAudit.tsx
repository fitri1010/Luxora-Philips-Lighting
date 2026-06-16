/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Scale, ShieldCheck, AlertTriangle, EyeOff, Truck } from "lucide-react";
import { MarketplaceOrder } from "../types";
import { auditOrders, AuditStatus } from "../utils/shariaAudit";

interface ShariaAuditProps {
  orders: MarketplaceOrder[];
}

const idr = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const statusBadge: Record<AuditStatus, string> = {
  COMPLIANT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-300",
  GHARAR: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-300",
  ZALIM: "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border-rose-300",
  "GHARAR+ZALIM": "bg-rose-200 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 border-rose-400"
};

export default function ShariaAudit({ orders }: ShariaAuditProps) {
  const s = auditOrders(orders);
  const compliancePct = s.total ? Math.round((s.compliant / s.total) * 100) : 100;

  const cards = [
    { label: "Transaksi Diaudit", value: `${s.total}`, icon: <Scale className="w-4 h-4 text-slate-500" />, cls: "border-slate-200 dark:border-slate-750" },
    { label: "Patuh (Compliant)", value: `${s.compliant} (${compliancePct}%)`, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, cls: "border-emerald-300/50" },
    { label: "Terindikasi Gharar", value: `${s.gharar}`, icon: <EyeOff className="w-4 h-4 text-amber-600" />, cls: "border-amber-300/50" },
    { label: "Terindikasi Zalim", value: `${s.zalim}`, icon: <Truck className="w-4 h-4 text-rose-600" />, cls: "border-rose-300/50" }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-start justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>AUDIT GHARAR &amp; ZALIM PER-TRANSAKSI</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Pemeriksaan otomatis tiap pesanan: <b>Gharar</b> (biaya tidak eksplisit) &amp; <b>Zalim</b> (ongkir pembeli melebihi tagihan kurir). Ref: PRD F-20/F-21.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full border bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/55 text-emerald-700 dark:text-emerald-450 text-center">
          <span className="text-[9px] font-black tracking-widest uppercase block text-slate-400">KEPATUHAN</span>
          <span className="text-xs font-black">{compliancePct}%</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((c) => (
          <div key={c.label} className={`p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/30 ${c.cls}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {c.icon}
              <span>{c.label}</span>
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-white block mt-1">{c.value}</span>
          </div>
        ))}
      </div>

      {s.totalOvercharge > 0 && (
        <p className="text-3xs text-rose-600 dark:text-rose-400 font-bold mt-3">
          Total kelebihan ongkir yang harus dikembalikan ke pembeli (bebas zalim): {idr(s.totalOvercharge)}
        </p>
      )}

      {/* Flagged transactions */}
      <div className="mt-5">
        <h3 className="text-2xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2.5">
          Transaksi Terindikasi ({s.flagged.length})
        </h3>

        {s.flagged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25 p-2 rounded-full" />
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-3">Seluruh transaksi bersih</p>
            <p className="text-3xs text-slate-400 mt-1">Tidak ada indikasi gharar maupun zalim.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {s.flagged.map((a) => (
              <div key={a.order.order_id} className="p-3 rounded-xl border border-slate-150 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-extrabold text-slate-800 dark:text-slate-200">{a.order.order_id}</span>
                    <span className="text-[10px] text-slate-400">{a.order.province} · {a.order.sku}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusBadge[a.status]}`}>
                    {a.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {a.detailGharar && (
                    <p className="text-3xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                      <EyeOff className="w-3 h-3 mt-0.5 shrink-0" /> <span>{a.detailGharar}</span>
                    </p>
                  )}
                  {a.detailZalim && (
                    <p className="text-3xs text-rose-700 dark:text-rose-400 flex items-start gap-1.5">
                      <Truck className="w-3 h-3 mt-0.5 shrink-0" /> <span>{a.detailZalim}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-2.5 bg-amber-500/10 rounded-lg border border-amber-300/30 flex items-start gap-1.5 text-3xs text-amber-800 dark:text-amber-400 leading-relaxed">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>Transaksi ber-flag tidak masuk laporan syariah penuh hingga diperbaiki: lengkapi biaya yang hilang (gharar) atau kembalikan kelebihan ongkir ke pembeli (zalim).</span>
      </div>
    </div>
  );
}
