/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Home,
  LineChart,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Package,
  Wrench,
  AlertTriangle,
  Map,
  ShieldAlert,
  Sparkles,
  FileText,
  Sliders,
  ChevronLeft,
  ChevronRight,
  X,
  Lightbulb
} from "lucide-react";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  lowStockCount: number;
  unresolvedRisks: number;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  lowStockCount,
  unresolvedRisks
}: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard Overview",
      icon: <Home className="w-5 h-5" />,
      category: "CORE"
    },
    {
      id: "sales",
      label: "Sales Analytics",
      icon: <LineChart className="w-5 h-5" />,
      category: "PERFORMANCE"
    },
    {
      id: "marketplace",
      label: "Marketplace Analytics",
      icon: <ShoppingBag className="w-5 h-5" />,
      category: "PERFORMANCE"
    },
    {
      id: "pos",
      label: "Cashier (POS)",
      icon: <CreditCard className="w-5 h-5" />,
      category: "OPERATIONS"
    },
    {
      id: "financial",
      label: "Financial Analytics",
      icon: <DollarSign className="w-5 h-5" />,
      category: "FINANCE"
    },
    {
      id: "inventory",
      label: "Inventory Management",
      icon: <Package className="w-5 h-5" />,
      category: "OPERATIONS",
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: "bg-red-500/10 text-red-500 border-red-500/20"
    },
    {
      id: "operational",
      label: "Operational Analytics",
      icon: <Wrench className="w-5 h-5" />,
      category: "OPERATIONS"
    },
    {
      id: "risk",
      label: "Risk Analytics",
      icon: <AlertTriangle className="w-5 h-5" />,
      category: "INTELLIGENCE",
      badge: unresolvedRisks > 0 ? `${unresolvedRisks}` : undefined,
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
    },
    {
      id: "geographic",
      label: "Geographic Analytics",
      icon: <Map className="w-5 h-5" />,
      category: "INTELLIGENCE"
    },
    {
      id: "sharia",
      label: "LUXORA Sharia Intelligence",
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      category: "COMPLIANCE"
    },
    {
      id: "ai_insights",
      label: "LUXORA AI Insights",
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      category: "COMPLIANCE",
      badge: "NEW"
    },
    {
      id: "reports",
      label: "Reports Center",
      icon: <FileText className="w-5 h-5" />,
      category: "REPORTS"
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Sliders className="w-5 h-5" />,
      category: "SYSTEM"
    }
  ];

  // Regroup items by category
  const categories = ["CORE", "PERFORMANCE", "FINANCE", "OPERATIONS", "INTELLIGENCE", "COMPLIANCE", "REPORTS", "SYSTEM"];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/70 dark:bg-slate-900/85 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 shadow-lg">
      {/* Brand Icon Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/10">
            💡
          </div>
          {!isCollapsed && (
            <span className="font-extrabold text-sm tracking-tight text-slate-850 dark:text-white uppercase leading-none truncate whitespace-nowrap">
              LUXORA <span className="text-emerald-500">BI</span>
            </span>
          )}
        </div>
        
        {/* Toggle Collapse on desktop, close on mobile */}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
          }}
          className="hidden md:flex p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links Scrollable list */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {categories.map((cat) => {
          const catItems = menuItems.filter((item) => item.category === cat);
          if (catItems.length === 0) return null;

          return (
            <div key={cat} className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1">
                  {cat}
                </div>
              )}
              <div className="space-y-1">
                {catItems.map((item) => {
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      id={`sidebar-menu-${item.id}`}
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        setIsMobileOpen(false); // Close mobile drawer if clicked
                      }}
                      className={`w-full flex items-center text-left py-2 px-3 rounded-xl transition-all cursor-pointer group relative ${
                        isActive
                          ? "bg-gradient-to-r from-[#009966]/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border-l-4 border-emerald-500 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-l-4 border-transparent"
                      }`}
                    >
                      {/* Active glowing pill */}
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/40"></div>
                      )}

                      <div className={`flex-shrink-0 transition-all ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                        {item.icon}
                      </div>

                      {!isCollapsed && (
                        <span className="ml-3 text-[12px] whitespace-nowrap truncate tracking-tight transition-opacity duration-300">
                          {item.label}
                        </span>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 z-50 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl pointer-events-none whitespace-nowrap">
                          {item.label}
                        </div>
                      )}

                      {/* Item Badges */}
                      {!isCollapsed && item.badge && (
                        <span
                          className={`ml-auto px-1.5 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider max-h-4 flex items-center leading-none ${
                            item.badge === "NEW"
                              ? "bg-yellow-500/10 text-[#D4AF37] border-yellow-500/20"
                              : item.badgeColor || "bg-emerald-500/10 text-emerald-500 border-[#009966]/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Profile representation at the bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0">
            A
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="block text-xs font-extrabold text-slate-800 dark:text-white leading-none whitespace-nowrap truncate">
                Admin Safitri
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1 whitespace-nowrap truncate">
                2310102036.safitri@student
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdropped Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop fixed/collapsible container */}
      <aside
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? "w-[80px]" : "w-[280px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:hidden w-[280px] transition-transform duration-300 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
