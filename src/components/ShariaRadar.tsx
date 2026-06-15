/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, Calculator, Info, ShieldCheck, HeartHandshake, History, Calendar } from "lucide-react";
import { ShariaMetrics, ZakatRecord } from "../types";

interface ShariaRadarProps {
  shariaMetrics: ShariaMetrics;
  complianceScore: number;
  complianceBadge: string;
  cashBalance: number;
  inventoryValue: number;
  zakatRecords: ZakatRecord[];
  onPayZakat: (record: ZakatRecord) => void;
}

export default function ShariaRadar({
  shariaMetrics,
  complianceScore,
  complianceBadge,
  cashBalance,
  inventoryValue,
  zakatRecords,
  onPayZakat
}: ShariaRadarProps) {
  const [currentLiabilities, setCurrentLiabilities] = useState(15000000); // Hutang Lancar state
  const [payChannel, setPayChannel] = useState("BAZNAS RI");
  const [successPayment, setSuccessPayment] = useState(false);

  const nishabLimit = 100000000; // IDR 100,000,000 (85 gr emas standard)
  
  // Zakat assets = Kas + Persediaan - Hutang Lancar
  const zakatPool = Math.max(0, cashBalance + inventoryValue - currentLiabilities);
  const reachedNishab = zakatPool >= nishabLimit;
  const zakatValue = reachedNishab ? Math.round(zakatPool * 0.025) : 0;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handlePayZakatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reachedNishab || zakatValue <= 0) return;

    const newRecord: ZakatRecord = {
      id: `ZAK-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      calculated_wealth: zakatPool,
      zakat_amount: zakatValue,
      nishab_status: "Reached",
      payment_status: "Paid",
      channel: payChannel
    };

    onPayZakat(newRecord);
    setSuccessPayment(true);
    setTimeout(() => {
      setSuccessPayment(false);
    }, 4000);
  };

  // 7 Dimensions for muamalah dashboard representation
  const dimensions = [
    { key: "transparency", label: "Transparansi (As-Shidq)", value: shariaMetrics.transparency, color: "bg-emerald-500", desc: "Akurasi pencatatan margin, tidak ada rekayasa pembukuan perniagaan." },
    { key: "amanah", label: "Amanah (Al-Amanah)", value: shariaMetrics.amanah, color: "bg-teal-500", desc: "Mutu pengemasan, ketepatan janji pengiriman lampu, kepuasan pembeli." },
    { key: "keadilan", label: "Keadilan (Al-Adl)", value: shariaMetrics.keadilan, color: "bg-amber-500", desc: "Keadilan harga, penawaran diskon yang jujur bebas manipulasi (anti-najsy)." },
    { key: "bebas_gharar", label: "Bebas Gharar", value: shariaMetrics.bebas_gharar, color: "bg-emerald-600", desc: "Deskripsi barang lengkap, tidak ada spekulasi ketersediaan stok." },
    { key: "bebas_zalim", label: "Bebas Zalim", value: shariaMetrics.bebas_zalim, color: "bg-emerald-700", desc: "Penilaian yang adil pada jasa kurir gudang, nihil klaim palsu pembeli." },
    { key: "bebas_riba", label: "Bebas Riba", value: shariaMetrics.bebas_riba, color: "bg-amber-600", desc: "Nihil bunga bank konvensional, gerbang kasir syariah (BSI / e-Wallet langsung)." },
    { key: "kepatuhan_zakat", label: "Kepatuhan Zakat", value: shariaMetrics.kepatuhan_zakat, color: "bg-indigo-500", desc: "Kelancaran perhitungan haul dan penyaluran hak zakat dari profit kotor." }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      
      {/* SHARIA COMPLIANCE RADAR GAUGES */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>SHARIA COMPLIANCE ENGINE SCORECARD</span>
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Matriks ketaatan tata niaga Islami (Fiqh Muamalah) berbasis 7 pilar akuntansi Islam terpadu.
              </p>
            </div>

            {/* Badge Indicator */}
            <div className={`px-3.5 py-1.5 rounded-full border flex flex-col items-center ${
              complianceBadge === "Sangat Patuh"
                ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
            }`}>
              <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">STATUS</span>
              <span className="text-xs font-black">{complianceBadge} ({complianceScore}/100)</span>
            </div>
          </div>

          {/* Core score grids instead of easily broken Canvas Radar */}
          <div className="space-y-4">
            {dimensions.map((dim) => (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">{dim.label}</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{dim.value}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className={`${dim.color} h-full rounded-full transition-all duration-1000`}
                    style={{ width: `${dim.value}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium leading-tight">
                  {dim.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sharia footer audit notification */}
        <div className="mt-6 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center space-x-2 text-3xs tracking-tight text-emerald-800 dark:text-emerald-400 uppercase font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sertifikasi KAS-Muamalah: Bebas Riba, Bebas Gharar dan Tidak Mengandung Unsur Zhalim.</span>
        </div>
      </div>

      {/* ZAKAT ENGINE & LEDGER */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>ZAKAT PERNIAGAAN AUTOMATION ENGINE</span>
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Automasi hisab zakat perdagangan 2.5% dari harta lancar (Kas Likuid + Nilai Buku Stok akhir - Hutang Lancar).
              </p>
            </div>
            
            {/* Status Nishab */}
            <div className={`px-3.5 py-1.5 rounded-full border text-center ${
              reachedNishab
                ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/55 text-emerald-700 dark:text-emerald-450"
                : "bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/55 text-rose-700 dark:text-rose-455"
            }`}>
              <span className="text-[9px] font-black tracking-widest uppercase block text-slate-400">NISHAB</span>
              <span className="text-xs font-black">{reachedNishab ? "Sudah Wajib Zakat" : "Belum Wajib"}</span>
            </div>
          </div>

          {/* Calculations Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Kas Bisnis</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-1">{formatIDR(cashBalance)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Buku Persediaan</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-1">{formatIDR(inventoryValue)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750 relative">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Hutang Lancar</span>
              <input
                type="number"
                value={currentLiabilities}
                onChange={(e) => setCurrentLiabilities(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xs font-black text-red-600 bg-transparent border-b border-transparent focus:border-red-500 outline-none block mt-0.5"
              />
              <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">(Ketuk untuk mengedit)</span>
            </div>
          </div>

          {/* Equation result */}
          <div className="bg-emerald-50/20 dark:bg-slate-900/60 p-4 rounded-xl border border-dotted border-emerald-300 dark:border-slate-750 mt-5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Haul Kekayaan Bersih (Harta Lancar):</span>
              <span className="text-slate-800 dark:text-slate-200">{formatIDR(zakatPool)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Batas Nishab Perniagaan (85gr Emas):</span>
              <span className="text-slate-850 dark:text-slate-200">{formatIDR(nishabLimit)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black border-t dark:border-slate-700/50 pt-2.5">
              <span className="text-slate-700 dark:text-slate-300">Estimasi Zakat Mal Terutang (2.5%):</span>
              <span className="text-amber-600 dark:text-amber-400">{formatIDR(zakatValue)}</span>
            </div>
          </div>

          {/* Submit payment to BAZNAS */}
          {reachedNishab && zakatValue > 0 && (
            <form onSubmit={handlePayZakatSubmit} className="mt-4 flex flex-col sm:flex-row gap-3.5 items-end justify-between border-t border-slate-100 dark:border-slate-850 pt-4">
              <div className="w-full sm:flex-1">
                <label className="block text-3xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  LEMBAGA AMIL ZAKAT PENERIMA
                </label>
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="w-full text-2xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 border dark:border-slate-700 rounded-lg outline-none"
                >
                  <option value="BAZNAS RI">BAZNAS RI (Badan Amil Zakat Nasional)</option>
                  <option value="LAZISMU">LAZISMU (Muhammadiyah)</option>
                  <option value="LAZISNU">LAZISNU (NU Care)</option>
                  <option value="DOMPET DHUAFA">DOMPET DHUAFA Syariah</option>
                  <option value="RUMAH ZAKAT">RUMAH ZAKAT</option>
                </select>
              </div>

              {successPayment ? (
                <div className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg text-2xs font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zakat Berhasil Disalurkan & Tercatat!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 hover:bg-emerald-500 bg-emerald-600 text-white text-xs font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Tandai Sudah Dibayarkan</span>
                </button>
              )}
            </form>
          )}

          {/* Historical records */}
          <div className="mt-6 border-t dark:border-slate-750 pt-4">
            <h3 className="text-2xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center space-x-1 mb-2.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>RIWAYAT LEDGER SETORAN ZAKAT (Amanah Ledger)</span>
            </h3>
            <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
              {zakatRecords.map((rec) => (
                <div key={rec.id} className="flex justify-between items-center text-3xs p-2 bg-slate-50 dark:bg-slate-900/40 rounded-lg border dark:border-slate-750">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <div>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 block">{rec.date}</span>
                      <span className="text-slate-400">Saluran: {rec.channel}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 block">{formatIDR(rec.zakat_amount)}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-350 font-bold uppercase">
                      {rec.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-4 p-2 bg-amber-500/10 rounded-lg border border-amber-300/30 flex items-start space-x-1.5 text-3xs text-amber-800 dark:text-amber-400 leading-normal">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>Haul dihitung 1 tahun penuh perdagangan Hijriyah / Masehi. Kewajiban zakat perniagaan dikeluarkan ketika sampai nishab sempurna dan dikurangi kewajiban hutang perolehan modal lancar.</span>
        </div>

      </div>
    </div>
  );
}
