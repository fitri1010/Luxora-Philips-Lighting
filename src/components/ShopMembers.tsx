/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from "react";
import { Users, RefreshCw, Copy, UserMinus, ShieldCheck, KeyRound, Crown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS, normalizeRole, Role } from "../auth/permissions";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

export default function ShopMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState(user?.shopJoinCode || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 3500);
  };

  const loadMembers = useCallback(async () => {
    if (!user?.shopId) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("shop_id", user.shopId);
    setMembers((data as Member[]) || []);
    setLoading(false);
  }, [user?.shopId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const ownerId = user?.id; // current user is the owner viewing this page

  const changeRole = async (memberId: string, role: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("set_member_role", { member_id: memberId, new_role: role });
    if (error) flash("Gagal ubah role: " + error.message);
    else {
      flash("Role diperbarui.");
      await loadMembers();
    }
    setBusy(false);
  };

  const removeMember = async (memberId: string, name: string | null) => {
    if (!window.confirm(`Keluarkan ${name || "anggota ini"} dari toko?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("remove_shop_member", { member_id: memberId });
    if (error) flash("Gagal mengeluarkan: " + error.message);
    else {
      flash("Anggota dikeluarkan.");
      await loadMembers();
    }
    setBusy(false);
  };

  const regenerate = async () => {
    if (!window.confirm("Buat kode baru? Kode lama tidak bisa dipakai lagi.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("regenerate_join_code");
    if (error) flash("Gagal: " + error.message);
    else {
      setJoinCode(data as string);
      flash("Kode toko diperbarui.");
    }
    setBusy(false);
  };

  const copyCode = () => {
    if (joinCode) navigator.clipboard?.writeText(joinCode);
    flash("Kode disalin.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Invite card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>UNDANG ANGGOTA TOKO</span>
        </h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Bagikan <b>Kode Toko</b> ini. Anggota mendaftar sendiri (pilih peran Staff/Accountant) lalu memasukkan kode untuk bergabung ke toko Anda.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <span className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300/50 rounded-xl font-mono font-black tracking-[0.3em] text-lg">
            {joinCode || "—"}
          </span>
          <button onClick={copyCode} className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-3xs font-black uppercase rounded-xl cursor-pointer flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Salin
          </button>
          <button onClick={regenerate} disabled={busy} className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-3xs font-black uppercase rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Kode Baru
          </button>
        </div>
        {msg && <p className="text-3xs font-bold text-emerald-600 dark:text-emerald-400 mt-3">{msg}</p>}
      </div>

      {/* Members list */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-705 mb-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>ANGGOTA TOKO ({members.length})</span>
          </h2>
          <button onClick={loadMembers} className="text-slate-400 hover:text-emerald-600 cursor-pointer" title="Muat ulang">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-3xs">
            <thead>
              <tr className="border-b dark:border-slate-750 text-slate-400 font-black uppercase">
                <th className="py-2 pr-2">Nama</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Peran</th>
                <th className="py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isOwnerRow = m.id === ownerId;
                return (
                  <tr key={m.id} className="border-b dark:border-slate-755 text-slate-600 dark:text-slate-300">
                    <td className="py-2.5 pr-2 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {isOwnerRow && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      {m.name || "—"}
                    </td>
                    <td className="py-2.5 pr-2 text-slate-500">{m.email || "—"}</td>
                    <td className="py-2.5 pr-2">
                      {isOwnerRow ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 font-black uppercase text-4xs">
                          {ROLE_LABELS[normalizeRole(m.role)]}
                        </span>
                      ) : (
                        <select
                          value={normalizeRole(m.role)}
                          disabled={busy}
                          onChange={(e) => changeRole(m.id, e.target.value)}
                          className="text-4xs font-black uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 outline-none cursor-pointer"
                        >
                          {(["STAFF", "ACCOUNTANT", "OWNER"] as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {isOwnerRow ? (
                        <span className="text-4xs text-slate-400 italic">Pemilik</span>
                      ) : (
                        <button
                          onClick={() => removeMember(m.id, m.name)}
                          disabled={busy}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                          title="Keluarkan dari toko"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && !loading && (
                <tr><td colSpan={4} className="py-6 text-center text-slate-400 italic">Belum ada anggota lain. Bagikan kode toko untuk mengundang.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg flex items-start gap-1.5 text-3xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>Anggota baru dibuat dengan cara mendaftar sendiri memakai Kode Toko. Owner mengatur peran &amp; mengeluarkan anggota di sini. Data toko dibagikan ke semua anggota (sesuai peran).</span>
        </div>
      </div>
    </div>
  );
}
