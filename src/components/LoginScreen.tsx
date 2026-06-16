/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Lightbulb, TrendingUp, Loader2, Mail, Lock, User, Store, ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [role, setRole] = useState("OWNER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ name, email, password, role, shopName: shopName || undefined, joinCode: joinCode || undefined });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputWrap = "relative flex items-center";
  const inputCls =
    "w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all";
  const iconCls = "absolute left-3 w-4 h-4 text-slate-400 pointer-events-none";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-7 text-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Lightbulb className="w-8 h-8 text-yellow-300 animate-pulse relative z-10" />
            <TrendingUp className="w-4 h-4 text-emerald-300 absolute bottom-1.5 right-1.5 z-20" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-white flex items-center gap-1.5">💡 LUXORA</h1>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-[#D4AF37] italic mt-1">
            "Illuminate Your Business Decisions with AI"
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-7">
          <h2 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wide">
            {mode === "login" ? "Masuk ke Dashboard" : "Daftar Akun Baru"}
          </h2>
          <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1 mb-5">
            {mode === "login"
              ? "Gunakan email & password Anda untuk mengakses LUXORA."
              : "Buat akun pemilik toko (Owner) untuk mulai memakai LUXORA."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <>
                <div className={inputWrap}>
                  <User className={iconCls} />
                  <input className={inputCls} placeholder="Nama lengkap" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className={inputWrap}>
                  <ShieldCheck className={iconCls} />
                  <select className={`${inputCls} appearance-none`} value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="OWNER">Owner (buat toko baru)</option>
                    <option value="ACCOUNTANT">Accountant (gabung toko)</option>
                    <option value="STAFF">Staff (gabung toko)</option>
                  </select>
                </div>
                {role === "OWNER" ? (
                  <div className={inputWrap}>
                    <Store className={iconCls} />
                    <input className={inputCls} placeholder="Nama toko" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
                  </div>
                ) : (
                  <div className={inputWrap}>
                    <KeyRound className={iconCls} />
                    <input className={`${inputCls} uppercase`} placeholder="Kode Toko (dari Owner)" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />
                  </div>
                )}
              </>
            )}
            <div className={inputWrap}>
              <Mail className={iconCls} />
              <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className={inputWrap}>
              <Lock className={iconCls} />
              <input className={inputCls} type="password" placeholder="Password (min. 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <div className="text-2xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-emerald-500/10"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{mode === "login" ? "Masuk" : "Daftar & Masuk"}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-3xs text-slate-500 dark:text-slate-400">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-5">
          Smart Lighting Business Intelligence Platform · v1.0
        </p>
      </div>
    </div>
  );
}
