/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from "react";
import { Award, Calculator, Info, ShieldCheck, HeartHandshake, History, Calendar, Coins, Hourglass, RefreshCw } from "lucide-react";
import { ShariaMetrics, ZakatRecord } from "../types";
import { useField } from "../data/DataStore";

interface ShariaRadarProps {
  shariaMetrics: ShariaMetrics;
  complianceScore: number;
  complianceBadge: string;
  cashBalance: number;
  inventoryValue: number;
  zakatRecords: ZakatRecord[];
  onPayZakat: (record: ZakatRecord) => void;
  canPay?: boolean;
}

// Zakat mal constants (ref: BUSINESS_RULES.md §6, AI_SPEC PROMPT-SYARIAH-001)
const NISHAB_GRAMS = 85; // 85 gram emas
const ZAKAT_RATE = 0.025; // 2.5%
const HAUL_DAYS = 354; // 1 tahun hijriah

const today = () => new Date().toISOString().split("T")[0];
const daysSince = (isoDate: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000));

export default function ShariaRadar({
  shariaMetrics,
  complianceScore,
  complianceBadge,
  cashBalance,
  inventoryValue,
  zakatRecords,
  onPayZakat,
  canPay = true
}: ShariaRadarProps) {
  // --- Persisted owner inputs (survive refresh) ---
  const [cashOnHand, setCashOnHand] = useField<number>("zakat.cash", Math.round(cashBalance));
  const [currentLiabilities, setCurrentLiabilities] = useField<number>("zakat.liabilities", 15000000);
  const [goldPricePerGram, setGoldPricePerGram] = useField<number>("zakat.goldPrice", 1470000);
  const [goldSource, setGoldSource] = useField<string>("zakat.goldSource", "Manual");
  const [goldSyncedAt, setGoldSyncedAt] = useField<string | null>("zakat.goldSyncedAt", null);
  const [haulStartDate, setHaulStartDate] = useField<string | null>("zakat.haulStart", null);

  // --- Transient form state ---
  const [payChannel, setPayChannel] = useState("BAZNAS RI");
  const [paidAmount, setPaidAmount] = useState(0);
  const [payDate, setPayDate] = useState(today());
  const [successPayment, setSuccessPayment] = useState(false);
  const [isSyncingGold, setIsSyncingGold] = useState(false);
  const [goldFallback, setGoldFallback] = useState(false);

  // --- Core zakat calculation (F-22 s/d F-24) ---
  const nishabLimit = NISHAB_GRAMS * goldPricePerGram;
  const zakatPool = Math.max(0, cashOnHand + inventoryValue - currentLiabilities); // Harta Wajib Zakat
  const reachedNishab = zakatPool >= nishabLimit;
  const zakatValue = reachedNishab ? Math.round(zakatPool * ZAKAT_RATE) : 0;

  // Haul auto-tracking: start counting when nishab is first reached, reset when it drops below.
  useEffect(() => {
    if (reachedNishab && !haulStartDate) {
      setHaulStartDate(today());
    } else if (!reachedNishab && haulStartDate) {
      setHaulStartDate(null);
    }
  }, [reachedNishab, haulStartDate, setHaulStartDate]);

  const haulDays = haulStartDate ? daysSince(haulStartDate) : 0;
  const haulFulfilled = haulDays >= HAUL_DAYS;
  const haulProgress = Math.min(100, Math.round((haulDays / HAUL_DAYS) * 100));
  const isObligatory = reachedNishab && haulFulfilled; // WAJIB_ZAKAT

  // Keep the editable "paid amount" in sync with the calculated value until the user overrides it.
  useEffect(() => {
    setPaidAmount(zakatValue);
  }, [zakatValue]);

  const status: "WAJIB" | "MENUJU_NISHAB" | "BELUM_NISHAB" = isObligatory
    ? "WAJIB"
    : reachedNishab
      ? "MENUJU_NISHAB"
      : "BELUM_NISHAB";

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);

  // --- Live gold price sync (proxied via /api/gold-price to avoid CORS) ---
  const syncGoldPrice = useCallback(async () => {
    setIsSyncingGold(true);
    try {
      const res = await fetch("/api/gold-price");
      const data = await res.json();
      if (typeof data.pricePerGram === "number" && data.pricePerGram > 0) {
        setGoldPricePerGram(Math.round(data.pricePerGram));
        setGoldSource(data.source ?? "API");
        setGoldSyncedAt(data.updatedAt ?? new Date().toISOString());
        setGoldFallback(Boolean(data.fallback));
      } else {
        setGoldFallback(true);
      }
    } catch {
      setGoldFallback(true);
    } finally {
      setIsSyncingGold(false);
    }
  }, [setGoldPricePerGram, setGoldSource, setGoldSyncedAt]);

  // Auto-sync once if the price has never been fetched from the API before.
  useEffect(() => {
    if (!goldSyncedAt) syncGoldPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePayZakatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isObligatory || paidAmount <= 0) return;

    const newRecord: ZakatRecord = {
      id: `ZAK-${Date.now().toString().slice(-6)}`,
      date: payDate,
      calculated_wealth: zakatPool,
      zakat_amount: paidAmount,
      nishab_status: "Reached",
      payment_status: "Paid",
      channel: payChannel
    };

    onPayZakat(newRecord);
    // BR-ZKT-001: one haul period is confirmed once → restart the haul counter for the next period.
    setHaulStartDate(today());
    setSuccessPayment(true);
    setTimeout(() => setSuccessPayment(false), 4000);
  };

  // Difference between what the owner pays and what was calculated (BR-ZKT-002 / BR-ZKT-003)
  const payDiff = paidAmount - zakatValue;

  const statusBadge = {
    WAJIB: { label: "Wajib Zakat", cls: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/55 text-emerald-700 dark:text-emerald-450" },
    MENUJU_NISHAB: { label: "Menunggu Haul", cls: "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/55 text-amber-700 dark:text-amber-400" },
    BELUM_NISHAB: { label: "Belum Wajib", cls: "bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/55 text-rose-700 dark:text-rose-450" }
  }[status];

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

  const inputCls =
    "w-full text-xs font-black bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-emerald-500 outline-none block mt-0.5 py-0.5";

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

            <div className={`px-3.5 py-1.5 rounded-full border flex flex-col items-center ${
              complianceBadge === "Sangat Patuh"
                ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-700 dark:text-amber-400"
            }`}>
              <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">STATUS</span>
              <span className="text-xs font-black">{complianceBadge} ({complianceScore}/100)</span>
            </div>
          </div>

          <div className="space-y-4">
            {dimensions.map((dim) => (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between text-2xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-350">{dim.label}</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{dim.value}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden relative">
                  <div className={`${dim.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${dim.value}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium leading-tight">{dim.desc}</p>
              </div>
            ))}
          </div>
        </div>

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
                Hisab zakat dagang 2.5% dari harta lancar (Kas + Nilai Stok − Hutang). Nishab mengikuti harga emas 85 gram.
              </p>
            </div>

            <div className={`px-3.5 py-1.5 rounded-full border text-center ${statusBadge.cls}`}>
              <span className="text-[9px] font-black tracking-widest uppercase block text-slate-400">NISHAB</span>
              <span className="text-xs font-black">{statusBadge.label}</span>
            </div>
          </div>

          {/* Editable input grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Kas Bisnis (Saldo)</span>
              <input
                type="number"
                value={cashOnHand}
                onChange={(e) => setCashOnHand(Math.max(0, parseInt(e.target.value) || 0))}
                className={`${inputCls} text-emerald-700 dark:text-emerald-400`}
              />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Buku Persediaan (otomatis)</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-1 py-0.5">{formatIDR(inventoryValue)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Hutang Lancar</span>
              <input
                type="number"
                value={currentLiabilities}
                onChange={(e) => setCurrentLiabilities(Math.max(0, parseInt(e.target.value) || 0))}
                className={`${inputCls} text-red-600`}
              />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border dark:border-slate-750">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                  <Coins className="w-3 h-3 text-amber-500" /> Harga Emas / gram
                </span>
                <button
                  type="button"
                  onClick={syncGoldPrice}
                  disabled={isSyncingGold}
                  title="Sinkronkan harga emas dari API"
                  className="text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingGold ? "animate-spin" : ""}`} />
                </button>
              </div>
              <input
                type="number"
                value={goldPricePerGram}
                onChange={(e) => setGoldPricePerGram(Math.max(0, parseInt(e.target.value) || 0))}
                className={`${inputCls} text-amber-600`}
              />
              <span className={`text-[9px] font-semibold block mt-0.5 leading-tight ${goldFallback ? "text-rose-500" : "text-slate-400"}`}>
                {isSyncingGold
                  ? "Menyinkronkan harga emas…"
                  : goldSyncedAt
                    ? `${goldFallback ? "⚠ " : "● "}${goldSource} · ${new Date(goldSyncedAt).toLocaleDateString("id-ID")}`
                    : "Belum disinkron (klik ikon refresh)"}
              </span>
            </div>
          </div>

          {/* Equation result */}
          <div className="bg-emerald-50/20 dark:bg-slate-900/60 p-4 rounded-xl border border-dotted border-emerald-300 dark:border-slate-750 mt-5 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Harta Wajib Zakat (Kas + Stok − Hutang):</span>
              <span className="text-slate-800 dark:text-slate-200">{formatIDR(zakatPool)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Nishab = 85 gr × {formatIDR(goldPricePerGram)}:</span>
              <span className="text-slate-850 dark:text-slate-200">{formatIDR(nishabLimit)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black border-t dark:border-slate-700/50 pt-2.5">
              <span className="text-slate-700 dark:text-slate-300">Estimasi Zakat Mal (2.5%):</span>
              <span className="text-amber-600 dark:text-amber-400">{formatIDR(zakatValue)}</span>
            </div>
          </div>

          {/* Haul progress — shown once nishab reached but haul not yet fulfilled */}
          {reachedNishab && !haulFulfilled && (
            <div className="mt-4 p-3.5 bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/40 rounded-xl">
              <div className="flex items-center justify-between text-2xs font-black text-amber-700 dark:text-amber-400 mb-2">
                <span className="flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5" /> PROGRESS HAUL (1 Tahun)</span>
                <span>{haulDays} / {HAUL_DAYS} hari</span>
              </div>
              <div className="w-full bg-amber-100 dark:bg-amber-950/40 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${haulProgress}%` }}></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Mulai haul:</span>
                <input
                  type="date"
                  value={haulStartDate ?? today()}
                  max={today()}
                  onChange={(e) => setHaulStartDate(e.target.value)}
                  className="bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-amber-500 outline-none text-slate-700 dark:text-slate-300 font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic mt-2 leading-tight">
                Zakat belum wajib hingga harta bertahan di atas nishab selama 1 tahun penuh (haul). Sesuaikan tanggal mulai bila Anda sudah memiliki harta ini lebih awal.
              </p>
            </div>
          )}

          {/* Read-only roles (Accountant) can view but not confirm payment */}
          {isObligatory && !canPay && (
            <div className="mt-4 border-t border-slate-100 dark:border-slate-850 pt-4 text-3xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3">
              Zakat wajib ditunaikan, namun konfirmasi pembayaran hanya dapat dilakukan oleh <b>Owner</b>.
            </div>
          )}

          {/* Payment form — only when obligatory (nishab + haul terpenuhi) and role may pay */}
          {isObligatory && canPay && (
            <form onSubmit={handlePayZakatSubmit} className="mt-4 border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Nominal Dibayarkan</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-2xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 border dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Tanggal Pembayaran</label>
                  <input
                    type="date"
                    value={payDate}
                    max={today()}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full text-2xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 border dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {payDiff !== 0 && (
                <p className={`text-[10px] font-bold ${payDiff < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {payDiff < 0
                    ? `⚠️ Kurang bayar ${formatIDR(Math.abs(payDiff))} dari kewajiban kalkulasi.`
                    : `✓ Lebih bayar ${formatIDR(payDiff)} (sedekah tambahan, dicatat).`}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
                <div className="w-full sm:flex-1">
                  <label className="block text-3xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Lembaga Amil Zakat Penerima</label>
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
                    <span>Tercatat di Ledger!</span>
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
              </div>
            </form>
          )}

          {/* Historical records */}
          <div className="mt-6 border-t dark:border-slate-750 pt-4">
            <h3 className="text-2xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center space-x-1 mb-2.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>RIWAYAT LEDGER SETORAN ZAKAT (Amanah Ledger)</span>
            </h3>
            <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
              {zakatRecords.length === 0 && (
                <p className="text-3xs text-slate-400 italic py-2">Belum ada setoran zakat tercatat.</p>
              )}
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

        <div className="mt-4 p-2 bg-amber-500/10 rounded-lg border border-amber-300/30 flex items-start space-x-1.5 text-3xs text-amber-800 dark:text-amber-400 leading-normal">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>Haul dihitung 1 tahun (354 hari) sejak harta melewati nishab. Kewajiban zakat 2.5% baru muncul setelah nishab dan haul terpenuhi, dikurangi hutang lancar.</span>
        </div>
      </div>
    </div>
  );
}
