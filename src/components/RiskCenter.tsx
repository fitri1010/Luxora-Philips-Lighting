/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertCircle, Trash2, Check, ShieldAlert, Sparkles, SlidersHorizontal, ArrowDownCircle, RefreshCw, PackageCheck, PackageX } from "lucide-react";
import { AnomalyLog, RiskItem } from "../types";

interface RiskCenterProps {
  anomalyLogs: AnomalyLog[];
  riskItems: RiskItem[];
  onResolveAnomaly: (id: string) => void;
  onDismissAnomaly: (id: string) => void;
  onResolveReturn?: (riskId: string, decision: "restock" | "writeoff") => void;
  canResolve?: boolean;
}

export default function RiskCenter({
  anomalyLogs,
  riskItems,
  onResolveAnomaly,
  onDismissAnomaly,
  onResolveReturn,
  canResolve = false
}: RiskCenterProps) {
  
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Group risks metrics
  const totalReturnLosses = riskItems.reduce((acc, current) => acc + current.return_loss, 0);
  const damagedGoodsCount = riskItems.filter(r => r.damaged_goods).length;
  const lostPackageCount = riskItems.filter(r => r.lost_package).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      
      {/* SECTION 9: RISK COMMAND CENTER */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-455" />
            <span>SECTION 9: RISK COMMAND CENTER (Logistics Leakage)</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Mitigasi kerugian logistik pada proses pengiriman, batasi unsur gharar ketidakpastian kondisi barang.
          </p>

          {/* Matrix Heatmap Grid */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            {/* Returns loss block */}
            <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-300/30 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest text-rose-500 block uppercase">
                  Return Financial Losses
                </span>
                <span className="text-base font-black text-rose-700 dark:text-rose-400 mt-1 block">
                  {formatIDR(totalReturnLosses)}
                </span>
              </div>
              <span className="text-[10px] text-slate-450 mt-2 block">
                Akibat klaim pecah barang Jatim
              </span>
            </div>

            {/* Damaged goods count */}
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-300/30 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest text-amber-600 dark:text-amber-500 block uppercase">
                  Damaged Package Rate
                </span>
                <span className="text-base font-black text-amber-700 dark:text-amber-400 mt-1 block">
                  {damagedGoodsCount} Insiden
                </span>
              </div>
              <span className="text-[10px] text-slate-455 mt-2 block">
                Semua terverifikasi Kurir Shopee
              </span>
            </div>

            {/* Lost Package rate */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest text-slate-400 block uppercase">
                  Lost Carrier Packages
                </span>
                <span className="text-base font-black text-slate-700 dark:text-slate-300 mt-1 block">
                  {lostPackageCount} Paket
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">
                Nihil klaim paket hilang kurir
              </span>
            </div>

            {/* Cancel Risk rate */}
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-300/30 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest text-emerald-600 block uppercase">
                  Pre-shipping Cancel Rate
                </span>
                <span className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
                  1.8% Rendah
                </span>
              </div>
              <span className="text-[10px] text-slate-450 mt-2 block">
                Di bawah toleransi system 3%
              </span>
            </div>
          </div>

          {/* Logistics Return audit details list */}
          <div className="mt-5 border-t dark:border-slate-750 pt-4">
            <h3 className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-2">
              Antrian Inspeksi &amp; Kasus Retur (BR-STK-003)
            </h3>
            <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
              {riskItems.length === 0 && (
                <p className="text-3xs text-slate-400 italic py-2">Belum ada kasus retur.</p>
              )}
              {riskItems.map((item) => {
                const pending = item.inspection_status === "PENDING_INSPECTION";
                return (
                  <div key={item.id} className="text-3xs p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border dark:border-slate-75">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col space-y-1">
                        <span className="font-extrabold text-slate-700 dark:text-slate-350">{item.product_name}</span>
                        <span className="text-slate-400">Order: {item.order_id || "POS-STORE"} | SKU: {item.sku}{item.qty ? ` | ${item.qty} pcs` : ""}</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400 leading-tight">{item.return_reason || item.cancel_reason || "Tidak ada alasan tertulis"}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-black text-rose-700 dark:text-rose-450 block">-{formatIDR(item.return_loss)}</span>
                        {item.inspection_status === "RESTOCKED" && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 font-bold uppercase whitespace-nowrap inline-block mt-1">Layak Jual</span>
                        )}
                        {item.inspection_status === "DAMAGED_WRITE_OFF" && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-300 font-bold uppercase whitespace-nowrap inline-block mt-1">Write-Off</span>
                        )}
                        {pending && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-300 font-bold uppercase whitespace-nowrap inline-block mt-1 animate-pulse">Perlu Inspeksi</span>
                        )}
                        {!item.inspection_status && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-300 font-bold uppercase whitespace-nowrap inline-block mt-1">{item.return_status}</span>
                        )}
                      </div>
                    </div>

                    {pending && canResolve && onResolveReturn && (
                      <div className="flex items-center gap-2 justify-end mt-2.5 border-t dark:border-slate-750/50 pt-2">
                        <button
                          onClick={() => onResolveReturn(item.id, "restock")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-4xs font-black uppercase rounded flex items-center gap-1 cursor-pointer"
                        >
                          <PackageCheck className="w-3 h-3" /> Layak Jual (Restock)
                        </button>
                        <button
                          onClick={() => onResolveReturn(item.id, "writeoff")}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-4xs font-black uppercase rounded flex items-center gap-1 cursor-pointer"
                        >
                          <PackageX className="w-3 h-3" /> Tidak Layak (Write-Off)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Audit status update note */}
        <div className="mt-4 p-2 bg-rose-500/5 rounded-lg border border-rose-300/25 flex items-start space-x-1.5 text-3xs text-rose-800 dark:text-rose-400 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <span>Setiap kasus kerusakan fisik wajib diselesaikan secara mufakat (Al-Ishlah) bersama kurir shopee, mengembalikan dana pembeli tanpa denda riba demi memelihara keridhaan muamalah.</span>
        </div>
      </div>

      {/* SECTION 10: ANOMALY DETECTION */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5 gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>SECTION 10: AI ANOMALY DETECTION ENGINE</span>
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Kecerdasan Buatan menyaring pesanan ganda (Double Order), lonjakan biaya rahasia, serta kerugian tak terduga.
              </p>
            </div>
            
            <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/25 px-2 py-1 rounded-lg border border-amber-300/40 text-amber-800 dark:text-amber-400 text-3xs font-black uppercase">
              <span>Dynamic Scanner Active</span>
            </div>
          </div>

          {/* Anomaly list with interactive deduplicator button */}
          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {anomalyLogs.filter(a => a.status === "Flagged").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Check className="w-10 h-10 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25 p-2 rounded-full" />
                <p className="text-xs font-extrabold text-slate-750 dark:text-slate-400 mt-3">
                  Nihil Anomali Terdeteksi!
                </p>
                <p className="text-3xs text-slate-400 mt-1 max-w-[200px]">
                  Semua transaksi bernilai amanah, bebas dari cost spike atau klaim double order.
                </p>
              </div>
            ) : (
              anomalyLogs.filter(a => a.status === "Flagged").map((log) => {
                const isDoubleOrder = log.type === "Double Order";
                const isCostSpike = log.type === "Cost Spike";

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-xl border relative overflow-hidden transition-all duration-300 ${
                      isDoubleOrder
                        ? "border-amber-300 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/5"
                        : "border-red-300 bg-red-50/10 dark:border-red-900/60 dark:bg-red-950/5"
                    }`}
                  >
                    {/* Severity card tag */}
                    <div className="flex items-center justify-between text-3xs font-extrabold uppercase">
                      <span className={`px-1.5 py-0.5 rounded ${
                        log.severity === "high" ? "bg-red-200 text-red-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        ⚠️ SEVERITY: {log.severity}
                      </span>
                      <span className="text-slate-400">{log.date}</span>
                    </div>

                    <h4 className="text-xs font-black text-slate-800 dark:text-white mt-2 flex items-center space-x-1.5">
                      <span>{log.title}</span>
                    </h4>

                    <p className="text-2xs text-slate-500 dark:text-slate-410 mt-1.5 leading-normal">
                      {log.description}
                    </p>

                    {/* Meta specifics */}
                    {log.metadata && (
                      <div className="mt-2 text-3xs font-bold text-slate-450 flex flex-wrap gap-x-4 border-t dark:border-slate-700/50 pt-2">
                        {log.metadata.customer && (
                          <span>Pembeli: <span className="text-slate-700 dark:text-slate-350">{log.metadata.customer}</span></span>
                        )}
                        {log.metadata.sku && (
                          <span>SKU: <span className="text-slate-700 dark:text-slate-350">{log.metadata.sku}</span></span>
                        )}
                        {log.metadata.diff_amount && (
                          <span className="text-red-650 font-black">Spike: +{formatIDR(parseFloat(log.metadata.diff_amount as string))}</span>
                        )}
                      </div>
                    )}

                    {/* Action buttons de-duplicate & resolve */}
                    <div className="mt-4 flex items-center space-x-2 justify-end border-t dark:border-slate-750/50 pt-2.5">
                      <button
                        onClick={() => onDismissAnomaly(log.id)}
                        className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 text-4xs font-black uppercase rounded transition-all cursor-pointer border dark:border-slate-700"
                      >
                        Abaikan (Dismiss)
                      </button>

                      {isDoubleOrder ? (
                        <button
                          onClick={() => onResolveAnomaly(log.id)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-4xs font-black uppercase rounded transition-all shadow-sm tracking-wider cursor-pointer flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Duplikasi & Batalkan Order</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onResolveAnomaly(log.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-4xs font-black uppercase rounded transition-all shadow-sm tracking-wider cursor-pointer flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Tandai Selesai (Resolve)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Anomaly dynamic explanation note */}
        <div className="mt-4 p-2 bg-amber-500/5 rounded-lg border border-amber-300/25 flex items-start space-x-1.5 text-3xs text-amber-805 dark:text-amber-400/80 leading-normal">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-550 shrink-0 mt-0.5 animate-pulse" />
          <span>Double order disaring otomatis: Pelanggan yang memesan item dan sku yang sama dalam slot waktu &lt; 15 menit menggunakan alamat identik. Menghindari klaim penipuan dan kerugian modal ongkir.</span>
        </div>
      </div>

    </div>
  );
}
