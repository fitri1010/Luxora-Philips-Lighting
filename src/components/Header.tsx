/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, Calendar, Globe, Star, ShoppingBag, Sun, Moon, Info, Lightbulb, TrendingUp, Menu, LogOut } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  selectedProvince: string;
  setSelectedProvince: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  provinces: string[];
  categories: string[];
  onMenuToggle?: () => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function Header({
  darkMode,
  setDarkMode,
  selectedProvince,
  setSelectedProvince,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,
  provinces,
  categories,
  onMenuToggle,
  userName,
  userRole,
  onLogout
}: HeaderProps) {
  const displayName = userName || "Pengguna LUXORA";
  const displayRole = userRole || "Owner";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Branding */}
        <div className="flex items-center space-x-3.5">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-500/20">
            {/* Glowing Lightbulb + Analytics Icon Combo */}
            <Lightbulb className="w-6 h-6 text-yellow-300 animate-pulse relative z-10" />
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300 absolute bottom-1 right-1 z-20" />
            <div className="absolute inset-0 bg-[#009966]/20 rounded-xl blur-sm animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl font-black tracking-tight text-slate-850 dark:text-white flex items-center gap-1.5">
                💡 LUXORA
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-extrabold text-[#D4AF37] bg-yellow-500/10 dark:bg-yellow-500/5 rounded-full border border-[#D4AF37]/30">
                ✨ SHARIA BI & AI PLATFORM
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:gap-2">
              <p className="text-[11px] font-extrabold text-slate-650 dark:text-slate-200 leading-none tracking-wide">
                Lighting Sales, POS, Financial & Sharia Analytics System
              </p>
              <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
              <p className="text-[10px] font-medium text-emerald-600 dark:text-[#D4AF37] leading-none italic">
                "Illuminate Your Business Decisions with AI"
              </p>
            </div>
          </div>
        </div>

        {/* Global Search bar */}
        <div className="relative flex-1 max-w-md mx-8 hidden lg:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari transaksi, SKU, pelanggan, atau rekam inventori..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-800"
            title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-emerald-700" />}
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 border-l pl-4 border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{displayName}</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                {displayRole} Role
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-emerald-50 font-black flex items-center justify-center border-2 border-emerald-500/30">
              {initials || "LX"}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar (Logout)"
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-t bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Filter Wilayah & Filter Produk :</span>
        </div>

        {/* Region Filter */}
        <div className="flex items-center space-x-1">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-2.5 py-1.5 font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Semua Provinsi Indonesia</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        {/* Product Category Filter */}
        <div className="flex items-center space-x-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Status Filter */}
        <div className="flex items-center space-x-1">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Semua Status Order</option>
            <option value="Completed">Completed</option>
            <option value="Returned">Returned</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Delivered">Delivered</option>
            <option value="Processing">Processing</option>
          </select>
        </div>

        {/* Quick Reset Filter */}
        {(selectedProvince || selectedCategory || selectedStatus || searchTerm) && (
          <button
            onClick={() => {
              setSelectedProvince("");
              setSelectedCategory("");
              setSelectedStatus("");
              setSearchTerm("");
            }}
            className="ml-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400 font-semibold rounded-lg transition-all cursor-pointer"
          >
            Reset Semua Filter
          </button>
        )}
      </div>
    </header>
  );
}
