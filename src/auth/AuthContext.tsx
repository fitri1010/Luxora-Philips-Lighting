/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  shopId?: string;
  shopName?: string;
  shopJoinCode?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  shopName?: string; // for OWNER (creates a shop)
  joinCode?: string; // for STAFF/ACCOUNTANT (joins a shop)
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email atau password salah.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email sudah terdaftar.";
  if (m.includes("password should be")) return "Password minimal 6 karakter.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek inbox Anda.";
  return msg;
}

// Build the app user from the Supabase user + their profile (role, shop membership).
async function profileToUser(u: User): Promise<AuthUser> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("name, role, shop_id, shops(name, join_code)")
    .eq("id", u.id)
    .maybeSingle();
  const meta = (u.user_metadata || {}) as Record<string, string>;
  const shop = (prof as { shops?: { name?: string; join_code?: string } } | null)?.shops;
  return {
    id: u.id,
    email: u.email || "",
    name: prof?.name || meta.name || u.email?.split("@")[0] || "Pengguna",
    role: String(prof?.role || meta.role || "OWNER").toUpperCase(),
    shopId: prof?.shop_id || undefined,
    shopName: shop?.name || undefined,
    shopJoinCode: shop?.join_code || undefined
  };
}

/** fetch() wrapper that attaches the Supabase access token to authenticated API calls. */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return fetch(input, { ...init, headers });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data.session ? await profileToUser(data.session.user) : null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
      else profileToUser(session.user).then(setUser);
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(translateError(error.message));
  }, []);

  const register = useCallback(
    async (d: RegisterInput) => {
      const role = (d.role || "OWNER").toUpperCase();
      const { data, error } = await supabase.auth.signUp({
        email: d.email.trim(),
        password: d.password,
        options: { data: { name: d.name.trim(), role, shop_name: d.shopName?.trim() || null } }
      });
      if (error) throw new Error(translateError(error.message));
      if (!data.session || !data.user) {
        throw new Error("Pendaftaran berhasil. Silakan konfirmasi email Anda lalu login.");
      }
      const uid = data.user.id;

      if (role === "OWNER") {
        const { data: shop, error: e1 } = await supabase
          .from("shops")
          .insert({ name: d.shopName?.trim() || "Toko Saya", owner_id: uid })
          .select("id")
          .single();
        if (e1) throw new Error("Gagal membuat toko: " + e1.message);
        const { error: e2 } = await supabase.from("profiles").update({ shop_id: shop.id }).eq("id", uid);
        if (e2) throw new Error("Gagal menautkan toko: " + e2.message);
      } else {
        const { error: e3 } = await supabase.rpc("join_shop_by_code", { code: (d.joinCode || "").trim() });
        if (e3) throw new Error("Kode toko tidak valid: " + e3.message);
      }
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(() => {
    void supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
