/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Star, AlertTriangle, ShieldCheck, ShoppingBag, ArrowUpRight, Scale } from "lucide-react";
import { authFetch } from "../auth/AuthContext";

interface AIInsightCenterProps {
  dataContext: any;
}

export default function AIInsightCenter({ dataContext }: AIInsightCenterProps) {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto trigger insight on load
  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataContext })
      });
      const result = await response.json();
      setInsights(result.insights);
    } catch (err) {
      console.error("AI Insights Center Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [dataContext]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5 gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>LUXORA AI • SYSTEM INSIGHT ENGINE</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
            Real-time multi-dimensional assessment: <b>Sales Insight</b>, <b>Inventory Prediction</b>, <b>Profit Forecast</b>, <b>Return Risk</b>, <b>Ads Efficiency</b>, <b>Sharia Compliance Advisor</b>, and <b>Business Health Monitoring</b>.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-3xs font-extrabold uppercase rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Menelaah..." : "Penelusuran Audit AI"}</span>
        </button>
      </div>

      {isLoading || !insights ? (
        // Premium skeletal shimmer loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="p-4 bg-slate-55 dark:bg-slate-900 rounded-xl space-y-2 h-36">
              <div className="w-1/3 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="w-3/4 h-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        // Loaded dynamic insights grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Executive Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-750 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-slate-600 dark:text-slate-300">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>RINGKASAN EKSEKUTIF</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.executiveSummary}
              </p>
            </div>
          </div>

          {/* Business Opportunity */}
          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-350/20 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-emerald-700 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                <span>PELUANG BISNIS</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.businessOpportunity}
              </p>
            </div>
          </div>

          {/* Key Risk */}
          <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-350/20 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>RISIKO UTAMA</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.keyRisk}
              </p>
            </div>
          </div>

          {/* Operational Efficiency */}
          <div className="p-4 bg-teal-500/5 rounded-xl border border-teal-350/20 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-teal-700 dark:text-teal-400">
                <Scale className="w-3.5 h-3.5 text-teal-500" />
                <span>EFISIENSI BIAYA</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.operationalEfficiency}
              </p>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-indigo-700 dark:text-indigo-400">
                <Star className="w-3.5 h-3.5 text-indigo-500" />
                <span>ANALISIS MARGIN LABA</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.profitAnalysis}
              </p>
            </div>
          </div>

          {/* Inventory Analysis */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-750 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-slate-600 dark:text-slate-350">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>ANALISIS PERSEDIAAN</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.inventoryAnalysis}
              </p>
            </div>
          </div>

          {/* Sharia Audit */}
          <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-350/20 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-amber-700 dark:text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>SHARIA MUAMALAH AUDIT</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.shariaAudit}
              </p>
            </div>
          </div>

          {/* Marketplace Strategy */}
          <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-350/20 flex flex-col justify-between h-36">
            <div>
              <div className="flex items-center space-x-1.5 text-2xs font-extrabold text-emerald-800 dark:text-emerald-400">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>STRATEGI MARKETPLACE</span>
              </div>
              <p className="text-3xs text-slate-400 dark:text-slate-400 mt-2 line-clamp-4 leading-relaxed font-semibold">
                {insights.marketplaceStrategy}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
