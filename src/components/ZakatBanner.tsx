/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Coins, Hourglass, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import { useField } from "../data/DataStore";

// Dashboard zakat status banner (PRD F-25, PB-SYR-004).
// Reads the same per-user zakat inputs as the Zakat module so figures stay consistent.

const HAUL_DAYS = 354;
const daysSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

interface ZakatBannerProps {
  inventoryValue: number;
  defaultCash: number;
  onGoToZakat: () => void;
}

export default function ZakatBanner({ inventoryValue, defaultCash, onGoToZakat }: ZakatBannerProps) {
  const [cash] = useField<number>("zakat.cash", Math.round(defaultCash));
  const [liabilities] = useField<number>("zakat.liabilities", 15000000);
  const [goldPrice] = useField<number>("zakat.goldPrice", 1470000);
  const [haulStart] = useField<string | null>("zakat.haulStart", null);

  const nishab = 85 * goldPrice;
  const hwz = Math.max(0, cash + inventoryValue - liabilities);
  const reached = hwz >= nishab;
  const haulDays = haulStart ? daysSince(haulStart) : 0;
  const haulFulfilled = haulDays >= HAUL_DAYS;
  const due = reached ? Math.round(hwz * 0.025) : 0;
  const status: "WAJIB" | "MENUJU" | "BELUM" = reached && haulFulfilled ? "WAJIB" : reached ? "MENUJU" : "BELUM";

  const idr = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

  const progressToNishab = Math.min(100, Math.round((hwz / (nishab || 1)) * 100));

  const theme = {
    WAJIB: {
      box: "bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/20 border-emerald-300 dark:border-emerald-900/60",
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      tag: "WAJIB ZAKAT",
      tagCls: "bg-emerald-600 text-white",
      cta: "Tunaikan Zakat"
    },
    MENUJU: {
      box: "bg-amber-50 dark:bg-amber-950/15 border-amber-300 dark:border-amber-900/50",
      icon: <Hourglass className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      tag: "MENUNGGU HAUL",
      tagCls: "bg-amber-500 text-white",
      cta: "Lihat Progres Haul"
    },
    BELUM: {
      box: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-750",
      icon: <Info className="w-6 h-6 text-slate-500 dark:text-slate-400" />,
      tag: "BELUM WAJIB",
      tagCls: "bg-slate-500 text-white",
      cta: "Buka Kalkulator Zakat"
    }
  }[status];

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${theme.box}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="shrink-0 mt-0.5">{theme.icon}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${theme.tagCls}`}>
                {theme.tag}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" /> Status Zakat Mal Perniagaan
              </span>
            </div>

            {status === "WAJIB" && (
              <p className="text-2xs text-slate-700 dark:text-slate-300 font-semibold mt-1.5 leading-relaxed">
                Harta Anda telah mencapai nishab &amp; haul. Kewajiban zakat:{" "}
                <b className="text-emerald-700 dark:text-emerald-400">{idr(due)}</b> (2,5% dari {idr(hwz)}).
              </p>
            )}
            {status === "MENUJU" && (
              <p className="text-2xs text-slate-700 dark:text-slate-300 font-semibold mt-1.5 leading-relaxed">
                Harta sudah melewati nishab ({idr(hwz)} ≥ {idr(nishab)}), menunggu haul{" "}
                <b className="text-amber-700 dark:text-amber-400">{haulDays}/{HAUL_DAYS} hari</b>.
              </p>
            )}
            {status === "BELUM" && (
              <p className="text-2xs text-slate-600 dark:text-slate-400 font-semibold mt-1.5 leading-relaxed">
                Harta lancar <b>{idr(hwz)}</b> belum mencapai nishab <b>{idr(nishab)}</b> ({progressToNishab}%).
                Belum ada kewajiban zakat.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onGoToZakat}
          className="shrink-0 self-start sm:self-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-2xs font-extrabold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
        >
          <span>{theme.cta}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {status === "BELUM" && (
        <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressToNishab}%` }} />
        </div>
      )}
    </div>
  );
}
