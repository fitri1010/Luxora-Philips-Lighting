/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useField, useResetData } from "./data/DataStore";
import { usePersistentState } from "./hooks/usePersistentState";
import { useAuth } from "./auth/AuthContext";
import { can, canAccessMenu } from "./auth/permissions";
import { auditOrders } from "./utils/shariaAudit";
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Wallet,
  Activity,
  ArrowUpRight,
  ShoppingBag,
  CreditCard,
  Percent,
  TrendingDown,
  Scale,
  Brain,
  Shield,
  Loader2,
  Lock,
  Compass,
  FileDown,
  Maximize2,
  Users,
  Settings,
  HelpCircle,
  Truck,
  FileText,
  BadgeInfo,
  Calendar,
  LineChart,
  UserSquare,
  DollarSign,
  Package,
  Trash2
} from "lucide-react";

// Types
import { MarketplaceOrder, POSTransaction, InventoryItem, RiskItem, ZakatRecord, AnomalyLog, BusinessRecommendation } from "./types";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ExecutiveKPI from "./components/ExecutiveKPI";
import AIInsightCenter from "./components/AIInsightCenter";
import InteractiveCharts from "./components/InteractiveCharts";
import POSSimulator from "./components/POSSimulator";
import IndonesiaMap from "./components/IndonesiaMap";
import ShariaRadar from "./components/ShariaRadar";
import ShariaAudit from "./components/ShariaAudit";
import ZakatBanner from "./components/ZakatBanner";
import OrderManager from "./components/OrderManager";
import InventoryManager from "./components/InventoryManager";
import RiskCenter from "./components/RiskCenter";
import ReportCenter from "./components/ReportCenter";
import ShopMembers from "./components/ShopMembers";
import AICopilot from "./components/AICopilot";

export default function App() {
  // Authenticated user + logout (gated by AuthProvider in main.tsx)
  const { user, logout } = useAuth();
  const resetData = useResetData();
  const role = user?.role;

  // --- MASTER STATE SYSTEM ---
  // New accounts start empty; data is added via input/import or seeded per-account.
  const [orders, setOrders] = useField<MarketplaceOrder[]>("orders", []);
  const [posHistory, setPosHistory] = useField<POSTransaction[]>("pos", []);
  const [inventory, setInventory] = useField<InventoryItem[]>("inventory", []);
  const [risks, setRisks] = useField<RiskItem[]>("risks", []);
  const [zakatHistory, setZakatHistory] = useField<ZakatRecord[]>("zakat", []);

  // Recommendations state
  const [recommendations, setRecommendations] = useField<BusinessRecommendation[]>("recommendations", []);

  // Active filters from Header component
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const [darkMode, setDarkMode] = useField("darkMode", false);
  const [searchTerm, setSearchTerm] = useState("");

  // ENTERPRISE SIDEBAR NAVIGATION STATE
  // Remember the last open menu across reloads (UI nav state → localStorage, per browser)
  const [activeMenu, setActiveMenu] = usePersistentState("activeMenu", "dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // SETTINGS DYNAMIC VALUES
  const [companyName, setCompanyName] = useField("companyName", "LUXORA Lighting Indo");
  const [shopeeStore, setShopeeStore] = useField("shopeeStore", "luxora.official");
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useField("notificationsEnabled", true);
  const [aiModelTemp, setAiModelTemp] = useField("aiModelTemp", 0.4);
  const [isConfigSynced, setIsConfigSynced] = useState(false);

  // OPERATIONAL BUDGET SLIDERS
  const [sliderPackingCost, setSliderPackingCost] = useState(15); // Percentage of optimasi reduction

  // AI INSTANT PREDICTION GENERATOR
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [aiInsights, setAiInsights] = useField<string[]>("aiInsights", []);

  const provinces = [
    "All Provinces", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta",
    "Jawa Timur", "Sumatera Utara", "Sumatera Selatan", "Kalimantan Timur",
    "Kalimantan Selatan", "Sulawesi Selatan", "Bali"
  ];
  const categories = [
    "All Categories", "Mosque Aesthetics", "Wall Sconce", "Table Lamp",
    "Floodlight", "Ceiling Light", "Lanterns"
  ];

  // AI Copilot state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Anomaly logs state
  const [anomalies, setAnomalies] = useField<AnomalyLog[]>("anomalies", []);

  // --- INTERACTION HANDLERS ---
  
  // POS Simulator checkout handler
  const handleAddPOSTransaction = (newTx: POSTransaction) => {
    setPosHistory((prev) => [newTx, ...prev]);

    // Live update stock levels for the SKU purchased
    setInventory((prevInv) =>
      prevInv.map((item) => {
        const isMatch = item.product_name === newTx.product_name;
        if (isMatch) {
          return {
            ...item,
            stock_out: item.stock_out + newTx.qty,
            stock_ending: Math.max(0, item.stock_ending - newTx.qty)
          };
        }
        return item;
      })
    );
  };

  // Add a new product (Master SKU) to inventory
  const handleAddProduct = (item: InventoryItem) => {
    setInventory((prev) => (prev.some((i) => i.sku === item.sku) ? prev : [...prev, item]));
  };

  // Inventory PO restock handler
  const handleAddNewStock = (sku: string, qty: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.sku === sku) {
          return {
            ...item,
            stock_in: item.stock_in + qty,
            stock_ending: item.stock_ending + qty
          };
        }
        return item;
      })
    );
  };

  // Zakat payoff handler
  const handleAddNewZakatPayment = (newRec: ZakatRecord) => {
    setZakatHistory((prev) => [newRec, ...prev]);
  };

  // Marketplace order input/import handlers (F-01, PB-TRX-005)
  const handleAddOrders = (newOrders: MarketplaceOrder[]) => {
    setOrders((prev) => {
      const existing = new Set(prev.map((o) => o.order_id));
      const fresh = newOrders.filter((o) => !existing.has(o.order_id)); // dedup (BR-TRX-005)
      return [...fresh, ...prev];
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
  };

  const handleUpdateOrderStatus = (orderId: string, status: MarketplaceOrder["order_status"]) => {
    setOrders((prev) => prev.map((o) => (o.order_id === orderId ? { ...o, order_status: status } : o)));

    // BR-STK-003: a Returned order enters the inspection queue (layak jual vs write-off).
    if (status === "Returned") {
      const ord = orders.find((o) => o.order_id === orderId);
      if (ord) {
        setRisks((prev) => {
          if (prev.some((r) => r.order_id === orderId && r.inspection_status === "PENDING_INSPECTION")) return prev;
          const newRisk: RiskItem = {
            id: `RSK-${Date.now().toString(36).toUpperCase()}`,
            order_id: orderId,
            product_name: ord.product_name,
            sku: ord.sku,
            qty: ord.qty,
            return_status: "Pending",
            return_reason: "Menunggu inspeksi kondisi barang",
            damaged_goods: false,
            lost_package: false,
            return_loss: 0,
            date: new Date().toISOString().split("T")[0],
            inspection_status: "PENDING_INSPECTION"
          };
          return [newRisk, ...prev];
        });
      }
    }
  };

  // Resolve a return inspection (BR-STK-003): restock layak-jual or write-off rugi.
  const handleResolveReturn = (riskId: string, decision: "restock" | "writeoff") => {
    const risk = risks.find((r) => r.id === riskId);
    if (!risk) return;
    const invItem = inventory.find((i) => i.sku === risk.sku);
    const ord = orders.find((o) => o.order_id === risk.order_id);
    const qty = risk.qty || ord?.qty || 1;
    const logistics = (ord?.shipping_forwarded_to_courier ?? 20000) + (ord?.handling_fee ?? 2000);
    const cogs = invItem ? invItem.cost_price * qty : 0;

    if (decision === "restock") {
      if (invItem) {
        setInventory((prev) =>
          prev.map((i) =>
            i.sku === risk.sku
              ? { ...i, stock_return: i.stock_return + qty, stock_ending: i.stock_ending + qty }
              : i
          )
        );
      }
      setRisks((prev) =>
        prev.map((r) =>
          r.id === riskId
            ? { ...r, inspection_status: "RESTOCKED", return_status: "Approved", damaged_goods: false, return_loss: logistics, return_reason: "Barang layak jual, dikembalikan ke stok (rugi logistik)" }
            : r
        )
      );
    } else {
      setRisks((prev) =>
        prev.map((r) =>
          r.id === riskId
            ? { ...r, inspection_status: "DAMAGED_WRITE_OFF", return_status: "Approved", damaged_goods: true, return_loss: logistics + cogs, return_reason: "Barang rusak / tidak layak jual (write-off)" }
            : r
        )
      );
    }
  };

  // Resolve double-order duplicate or cost anomalies
  const handleResolveAnomaly = (id: string) => {
    const activeAnomaly = anomalies.find((a) => a.id === id);

    if (activeAnomaly && activeAnomaly.type === "Double Order") {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.order_id !== "SPX-671239824-JKT")
      );

      setInventory((prevInv) =>
        prevInv.map((item) => {
          if (item.sku === "LMP-KUB-LED-01") {
            return {
              ...item,
              stock_out: Math.max(0, item.stock_out - 2),
              stock_ending: item.stock_ending + 2
            };
          }
          return item;
        })
      );
    }

    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Resolved" as const } : a))
    );
  };

  const handleDismissAnomaly = (id: string) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Ignored" as const } : a))
    );
  };

  // Recommendations dismiss/execute handler
  const handleExecuteRecommendation = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  // DYNAMIC AI INSIGHT GENERATION
  const handleGenerateAIInsight = () => {
    setIsGeneratingInsight(true);
    setTimeout(() => {
      const randomizedInsights = [
        "Lampu Kubah Masjid LED Lumina Slim menunjukkan kenaikan penjualan berkelanjutan sebesar 12% di wilayah Jawa Tengah. Kebutuhan stok disarankan dinaikkan (+10 unit).",
        "Peringatan Logistik: Rata-rata waktu transit pengiriman ke Kalimantan Timur meningkat 1.2 hari akibat kepadatan pelabuhan. Disarankan menginformasikan pembeli sejak awal.",
        "Rasio iklan (Ads ROAS) pada kategori Lampu Dinding Sconce meningkat ke 4.8x setelah mengaktifkan kata kunci spesifik Islami. Tingkatkan anggaran harian sebesar 15%.",
        "Zakat perniagaan bulan Juni selesai dihitung secara akurat. Pengeluaran kas teratur untuk zakat terbukti memiliki korelasi positif terhadap pertumbuhan barakah usaha.",
        "Tingkat pembatalan (Cancel Rate) turun ke level historis terendah (1.8%) seiring dengan peningkatan kecepatan respons admin POS dalam memvalidasi alamat ganda."
      ];
      const selected = randomizedInsights[Math.floor(Math.random() * randomizedInsights.length)];
      setAiInsights((prev) => [selected, ...prev]);
      setIsGeneratingInsight(false);
    }, 1200);
  };

  // --- DYNAMIC FINANCIAL CALCULATIONS ---
  const activeFinancials = useMemo(() => {
    const filteredOrdersList = orders.filter((order) => {
      const matchProv =
        selectedProvince === "All Provinces" ? true : order.province === selectedProvince;
      const matchCat =
        selectedCategory === "All Categories" ? true : order.category === selectedCategory;
      const matchStatus =
        selectedStatus === "All Statuses" ? true : order.order_status === selectedStatus;
      return matchProv && matchCat && matchStatus;
    });

    const orderGross = filteredOrdersList
      .filter((o) => o.order_status !== "Cancelled")
      .reduce((sum, order) => sum + order.net_sales, 0);

    const posGross = posHistory.reduce((sum, tx) => sum + tx.total_amount, 0);
    const grossRevenue = orderGross + posGross;

    const returnsLoss = risks
      .filter((r) => r.return_status === "Approved")
      .reduce((s, r) => s + r.return_loss, 0);

    const netRevenue = Math.max(0, grossRevenue - returnsLoss);

    const skuToCostMap = inventory.reduce((acc, item) => {
      acc[item.sku] = item.cost_price;
      return acc;
    }, {} as Record<string, number>);

    const ordersCogs = filteredOrdersList
      .filter((o) => o.order_status !== "Cancelled" && o.order_status !== "Returned")
      .reduce((sum, o) => sum + (o.qty * (skuToCostMap[o.sku] || 90000)), 0);

    const posCogs = posHistory.reduce((sum, tx) => {
      const invItem = inventory.find((item) => item.product_name === tx.product_name);
      const cost = invItem ? invItem.cost_price : 75000;
      return sum + tx.qty * cost;
    }, 0);

    const totalCogs = ordersCogs + posCogs;
    const grossProfit = Math.max(0, netRevenue - totalCogs);

    // Apply slider simulation reduction on packaging portion of OPEX (standard packing cost portion = 180,000)
    const baseOpex = 850000 + 220000 + 110000 + 55000 + 154000 + 22000; // standard opex sans packing
    const simulatedPackingPortion = Math.round(180000 * (1 - sliderPackingCost / 100));
    const opexBase = baseOpex + simulatedPackingPortion;
    
    const netProfit = Math.max(0, grossProfit - opexBase);

    const totalInventoryAssetValue = inventory.reduce(
      (sum, item) => sum + item.stock_ending * item.cost_price,
      0
    );

    return {
      grossRevenue,
      returnsLoss,
      netRevenue,
      totalCogs,
      grossProfit,
      opexBase,
      netProfit,
      totalInventoryAssetValue,
      filteredOrdersList
    };
  }, [orders, posHistory, inventory, risks, selectedProvince, selectedCategory, selectedStatus, sliderPackingCost]);

  // --- SHARIA COMPLIANCE SCORE (computed from real operational data) ---
  // 7 muamalah dimensions (ref: types.ts ShariaMetrics, BUSINESS_RULES §6).
  const shariaCompliance = useMemo(() => {
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

    // Order outcomes
    const completed = orders.filter((o) => o.order_status === "Completed" || o.order_status === "Delivered").length;
    const returned = orders.filter((o) => o.order_status === "Returned").length;
    const cancelled = orders.filter((o) => o.order_status === "Cancelled").length;
    const finalized = completed + returned + cancelled;

    // Open anomalies (recording integrity)
    const flaggedCostSpikes = anomalies.filter((a) => a.status === "Flagged" && a.type === "Cost Spike").length;
    const flaggedDoubles = anomalies.filter((a) => a.status === "Flagged" && a.type === "Double Order").length;

    // Customer harm (damaged / lost packages)
    const damaged = risks.filter((r) => r.damaged_goods).length;
    const lost = risks.filter((r) => r.lost_package).length;

    // Fulfillment uncertainty
    const lowStock = inventory.filter((i) => i.stock_ending <= i.minimum_stock).length;

    // Pricing fairness — average contribution margin (selling assumed 1.95× cost, as elsewhere)
    const margins = inventory.map((i) => {
      const sell = i.cost_price * 1.95;
      return ((sell - i.cost_price) / sell) * 100;
    });
    const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;

    // Riba-free payment share (all supported gateways are interest-free)
    const ribaFreeMethods = ["QRIS", "OVO", "GoPay", "DANA", "ShopeePay", "Transfer", "Cash"];
    const ribaFreeCount = posHistory.filter((t) => ribaFreeMethods.includes(t.payment_method)).length;
    const ribaFreeShare = posHistory.length ? ribaFreeCount / posHistory.length : 1;

    // Zakat timeliness — days since most recent paid record
    const paidZakat = zakatHistory.filter((z) => z.payment_status === "Paid");
    const lastZakatDays = paidZakat.length
      ? Math.min(...paidZakat.map((z) => Math.floor((Date.now() - new Date(z.date).getTime()) / 86_400_000)))
      : Infinity;

    const transparency = clamp(100 - flaggedCostSpikes * 12 - flaggedDoubles * 5);
    const amanah = clamp(finalized ? (completed / finalized) * 100 : 100);
    const keadilan = clamp(100 - Math.max(0, avgMargin - 50) * 2);
    // Real per-transaction audit (F-20/F-21): gharar = hidden fees, zalim = shipping overcharge
    const audit = auditOrders(orders);
    const bebas_gharar = clamp(audit.total ? (1 - audit.gharar / audit.total) * 100 : 100);
    const bebas_zalim = clamp(audit.total ? (1 - audit.zalim / audit.total) * 100 : 100);
    void lowStock; void damaged; void lost; void cancelled; // retained for other potential use
    const bebas_riba = clamp(ribaFreeShare * 100);
    const kepatuhan_zakat = clamp(
      lastZakatDays <= 365 ? 100 : lastZakatDays <= 400 ? 85 : paidZakat.length ? 65 : 45
    );

    const metrics = { transparency, amanah, keadilan, bebas_gharar, bebas_zalim, bebas_riba, kepatuhan_zakat };
    const score = clamp(
      (transparency + amanah + keadilan + bebas_gharar + bebas_zalim + bebas_riba + kepatuhan_zakat) / 7
    );
    const badge =
      score >= 90 ? "Sangat Patuh" : score >= 75 ? "Patuh" : score >= 60 ? "Cukup Patuh" : "Perlu Perbaikan";

    return { metrics, score, badge };
  }, [orders, posHistory, inventory, risks, zakatHistory, anomalies]);

  // Props contextual data object for AI and Reports
  const aiDataContext = useMemo(() => {
    return {
      revenueTotal: activeFinancials.netRevenue,
      grossProfitTotal: activeFinancials.grossProfit,
      netProfitTotal: activeFinancials.netProfit,
      opexTotal: activeFinancials.opexBase,
      inventoryAssetValue: activeFinancials.totalInventoryAssetValue,
      posTransactionsCount: posHistory.length,
      unresolvedAnomalies: anomalies.filter((a) => a.status === "Flagged"),
      lowStockSkus: inventory
        .filter((item) => item.stock_ending <= item.minimum_stock)
        .map((i) => i.sku),
      shariaScore: shariaCompliance.score,
      shariaBadge: shariaCompliance.badge
    };
  }, [activeFinancials, posHistory, anomalies, inventory, shariaCompliance]);

  const historicalHistoryTrend = useMemo(() => {
    return [
      { date: "06-08", revenue: 2100000, profit: 890000, orders: 4, posRevenue: 400000 },
      { date: "06-09", revenue: 2450000, profit: 1100000, orders: 5, posRevenue: 520000 },
      { date: "06-10", revenue: 2900000, profit: 1350000, orders: 6, posRevenue: 640000 },
      { date: "06-11", revenue: 3200000, profit: 1420000, orders: 8, posRevenue: 780000 },
      { date: "06-12", revenue: 3750000, profit: 1680000, orders: 10, posRevenue: 980000 },
      { date: "06-13", revenue: 3950000, profit: 1820000, orders: 12, posRevenue: 1100000 },
      {
        date: "06-14",
        revenue: activeFinancials.netRevenue,
        profit: activeFinancials.netProfit,
        orders: activeFinancials.filteredOrdersList.length,
        posRevenue: posHistory.reduce((s, t) => s + t.total_amount, 0)
      }
    ];
  }, [activeFinancials, posHistory]);

  const productMarginsRanking = useMemo(() => {
    return inventory.map((item) => {
      const activeSellingPrice = item.cost_price * 1.95;
      const marginFraction = Math.round(
        ((activeSellingPrice - item.cost_price) / activeSellingPrice) * 100
      );
      return {
        name: item.product_name,
        margin: marginFraction,
        sales: item.stock_out
      };
    }).sort((a, b) => b.margin - a.margin);
  }, [inventory]);

  const computedProvinceMetrics = useMemo(() => {
    const provinceList = [
      "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
      "Sumatera Utara", "Sumatera Selatan", "Kalimantan Timur", "Kalimantan Selatan",
      "Sulawesi Selatan", "Bali"
    ];

    const initialMetrics: Record<string, { name: string; revenue: number; orders: number; returns: number; profit: number }> = {};
    provinceList.forEach(prov => {
      initialMetrics[prov] = {
        name: prov,
        revenue: 0,
        orders: 0,
        returns: 0,
        profit: 0
      };
    });

    orders.forEach(order => {
      if (initialMetrics[order.province]) {
        initialMetrics[order.province].orders += 1;
        if (order.order_status === "Returned") {
          initialMetrics[order.province].returns += order.net_sales;
        } else if (order.order_status !== "Cancelled") {
          initialMetrics[order.province].revenue += order.net_sales;
          initialMetrics[order.province].profit += Math.round(order.net_sales * 0.45);
        }
      }
    });

    return initialMetrics;
  }, [orders]);

  const kpiMetrics = useMemo(() => {
    const returnVal = parseFloat((((activeFinancials.returnsLoss / (activeFinancials.grossRevenue || 1)) * 100) || 0).toFixed(1));
    return {
      grossSales: activeFinancials.grossRevenue,
      netSales: activeFinancials.netRevenue,
      orderCount: activeFinancials.filteredOrdersList.length + posHistory.length,
      grossProfit: activeFinancials.grossProfit,
      netProfit: activeFinancials.netProfit,
      cashBalance: activeFinancials.netProfit,
      returnRate: returnVal,
      cancelRate: 1.8,
      inventoryTurnover: 0.85,
      adsRoi: 4.5,
      shariaScore: shariaCompliance.score,
      shariaBadge: shariaCompliance.badge
    };
  }, [activeFinancials, posHistory, shariaCompliance]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(item => item.stock_ending <= item.minimum_stock).length;
  }, [inventory]);

  const unresolvedRisks = useMemo(() => {
    return anomalies.filter(anom => anom.status === "Flagged").length;
  }, [anomalies]);

  // RBAC guard: if the role cannot access the active menu, fall back to dashboard.
  useEffect(() => {
    if (!canAccessMenu(role, activeMenu)) {
      setActiveMenu("dashboard");
    }
  }, [role, activeMenu]);

  // Master formatters
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Breadcrumb path dictionary
  const getBreadcrumb = () => {
    switch (activeMenu) {
      case "dashboard":
        return ["Dashboard", "Overview"];
      case "sales":
        return ["Dashboard", "Sales Analytics"];
      case "marketplace":
        return ["Dashboard", "Marketplace Analytics"];
      case "pos":
        return ["Dashboard", "Cashier (POS)"];
      case "financial":
        return ["Dashboard", "Financial Analytics"];
      case "inventory":
        return ["Dashboard", "Inventory Management"];
      case "operational":
        return ["Dashboard", "Operational Analytics"];
      case "risk":
        return ["Dashboard", "Risk Analytics"];
      case "geographic":
        return ["Dashboard", "Geographic Analytics"];
      case "sharia":
        return ["Dashboard", "LUXORA Sharia Intelligence"];
      case "ai_insights":
        return ["Dashboard", "LUXORA AI Insights"];
      case "reports":
        return ["Dashboard", "Reports Center"];
      case "users":
        return ["Dashboard", "Manajemen Toko"];
      case "settings":
        return ["Dashboard", "Settings"];
      default:
        return ["Dashboard", "Overview"];
    }
  };

  return (
    <div id="luxora-enterprise-root" className={`min-h-screen ${darkMode ? "dark" : ""} bg-[#F5F7FA] dark:bg-slate-905 text-slate-800 dark:text-slate-100 transition-colors duration-200`}>
      
      {/* 280px or 80px fixed left sidebar navigation wrapper */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        lowStockCount={lowStockCount}
        unresolvedRisks={unresolvedRisks}
        role={role}
        userName={user?.name}
        userEmail={user?.email}
      />

      {/* Main Container spacing adjusting dynamically on desktop */}
      <div className={`transition-all duration-300 min-h-screen flex flex-col justify-between ${
        isCollapsed ? "md:pl-[80px]" : "md:pl-[280px]"
      }`}>
        
        <div>
          {/* TOP MODERN HEADER */}
          <Header
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            provinces={provinces}
            categories={categories}
            onMenuToggle={() => setIsMobileOpen(true)}
            userName={user?.name}
            userRole={user?.role}
            onLogout={logout}
          />

          {/* BREADCRUMB PATHWAY BAR */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-6 py-2.5 border-b border-slate-200/50 dark:border-slate-800/60 text-3xs font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 flex items-center space-x-1.5 selection:bg-emerald-500/10">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {getBreadcrumb().map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <ChevronRight className="w-2.5 h-2.5 text-slate-350 dark:text-slate-650" />}
                <span className={idx === getBreadcrumb().length - 1 ? "text-emerald-600 dark:text-emerald-400 font-black" : ""}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* DYNAMIC VIEW ROUTING MAIN CONTAINER */}
          <main className="px-4 md:px-6 lg:px-8 py-7 space-y-7 max-w-7xl mx-auto">
            
            {/* 1. DASHBOARD OVERVIEW */}
            {activeMenu === "dashboard" && (
              <div className="space-y-6 animate-fade-in">

                {/* Zakat status banner (PRD F-25) — finance roles only */}
                {can(role, "finance:view") && (
                  <ZakatBanner
                    inventoryValue={activeFinancials.totalInventoryAssetValue}
                    defaultCash={activeFinancials.netProfit}
                    onGoToZakat={() => setActiveMenu("sharia")}
                  />
                )}

                {/* Core Executive Metrics */}
                <ExecutiveKPI metrics={kpiMetrics} hideFinancials={!can(role, "finance:view")} />

                {/* Finance/Sharia panels — hidden from roles without finance access (Staff) */}
                {can(role, "finance:view") && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Business Health Meter Box (5 Columns) */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-3 border-b dark:border-slate-750">
                        <h2 className="text-sm font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5 leading-none">
                          <Activity className="w-4 h-4 text-emerald-650 dark:text-emerald-400" />
                          <span>BUSINESS HEALTH SCORE</span>
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Sangat Sehat
                        </span>
                      </div>

                      <div className="flex items-center gap-6 my-6">
                        {/* Radial Indicator circle */}
                        <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="42" className="stroke-slate-100 dark:stroke-slate-750 fill-none" strokeWidth="8" />
                            <circle cx="48" cy="48" r="42" className="stroke-[#009966] fill-none" strokeWidth="8" strokeDasharray="264" strokeDashoffset={264 - (264 * shariaCompliance.score) / 100} strokeLinecap="round" />
                          </svg>
                          <div className="text-center">
                            <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{shariaCompliance.score}%</span>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">BARAKAH</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="font-extrabold text-slate-750 dark:text-slate-200">Kepatuhan Operasi & Muamalah</p>
                          <p className="text-3xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                            Analisis otomatis mengukur keselarasan harga barang (no gharar), kelancaran POS kasir harian, ketepatan pembayaran Zakat Mal, dan optimasi nisbah kepuasan pembeli.
                          </p>
                        </div>
                      </div>

                      {/* Micro Checklist list of indicators */}
                      <div className="space-y-2 pt-3 border-t dark:border-slate-750 text-3xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Bebas Riba (Safe Local QRIS Gateways)
                          </span>
                          <span className="font-black text-emerald-600">{shariaCompliance.metrics.bebas_riba}/100</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Amanah Transaksi (Fulfillment Rate)
                          </span>
                          <span className="font-black text-emerald-600">{shariaCompliance.metrics.amanah}/100</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Bebas Gharar (Stok & Kepastian)
                          </span>
                          <span className="font-black text-amber-500">{shariaCompliance.metrics.bebas_gharar}/100</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-rose-500" /> Bebas Zalim (Risiko Retur/Rusak)
                          </span>
                          <span className="font-black text-rose-500">{shariaCompliance.metrics.bebas_zalim}/100</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-4 leading-none">
                      • Terakhir dipindai oleh LUXORA AI Analytics Engine: Hari ini
                    </p>
                  </div>

                  {/* AI INSIGHT SUMMARY (7 Columns) */}
                  <div className="lg:col-span-7">
                    <AIInsightCenter dataContext={aiDataContext} />
                  </div>

                </div>
                )}

                {/* QUICK NAVIGATION CARDS GRID (Apen modul related) */}
                <div className="space-y-3">
                  <h3 className="text-2xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    QUICK NAVIGATION CONTROL PANEL
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    
                    <button
                      onClick={() => setActiveMenu("sales")}
                      className="group text-left p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28"
                    >
                      <LineChart className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-all" />
                      <div>
                        <h4 className="text-2xs font-black text-slate-800 dark:text-white leading-none">Sales Analytics</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-2 font-medium">Tren grafik harian & laba (+10.8%)</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveMenu("marketplace")}
                      className="group text-left p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28"
                    >
                      <ShoppingBag className="w-6 h-6 text-[#009966] group-hover:scale-110 transition-all" />
                      <div>
                        <h4 className="text-2xs font-black text-slate-800 dark:text-white leading-none">Shopee Store</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-2 font-medium">Promosi ads ROI 4.5x & konversi digital</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveMenu("pos")}
                      className="group text-left p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28"
                    >
                      <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-all" />
                      <div>
                        <h4 className="text-2xs font-black text-slate-800 dark:text-white leading-none">Cashier POS</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-2 font-medium">Checkout offline & riwayat mesin kas</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveMenu("financial")}
                      className="group text-left p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28"
                    >
                      <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-all" />
                      <div>
                        <h4 className="text-2xs font-black text-slate-800 dark:text-white leading-none">Financial Audit</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-2 font-medium">Waterfall margin, HPP/COGS & kas luar</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveMenu("inventory")}
                      className="group text-left p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28"
                    >
                      <Package className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-all" />
                      <div>
                        <h4 className="text-2xs font-black text-slate-800 dark:text-white leading-none">Inventory Control</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-2 font-medium">Safety stock & pengadaan reorder barang</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveMenu("sharia")}
                      className="group text-left p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28"
                    >
                      <Award className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-all" />
                      <div>
                        <h4 className="text-2xs font-black text-slate-800 dark:text-white leading-none">Sharia Compliance</h4>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-2 font-medium">Kalkulator zakat perniagaan & legalitas</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Consolidated Trend Plots */}
                <InteractiveCharts
                  historyData={historicalHistoryTrend}
                  categoryPerformance={[]}
                  productMarginalData={productMarginsRanking}
                />

              </div>
            )}

            {/* 2. SALES ANALYTICS */}
            {activeMenu === "sales" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b dark:border-slate-750 pb-4 mb-5">
                    <div>
                      <h2 className="text-sm font-black text-slate-850 dark:text-white">TREND PENJUALAN GABUNGAN</h2>
                      <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1">Eksplorasi historis omzet harian terhadap volume total pesanan</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-3xs font-extrabold uppercase">
                      Pertumbuhan Omzet Bulanan +10.8%
                    </div>
                  </div>

                  <InteractiveCharts
                    historyData={historicalHistoryTrend}
                    categoryPerformance={[]}
                    productMarginalData={productMarginsRanking}
                  />
                </div>

                {/* Sales Breakdown by Product Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="p-5 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-2xl shadow-sm md:col-span-1">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white pb-3 border-b dark:border-slate-750">KONTRIBUSI KATEGORI LAMPU</h3>
                    <div className="space-y-3 mt-4 text-xs font-bold">
                      <div className="flex justify-between items-center text-3xs">
                        <span className="text-slate-500">🕌 Mosque Aesthetics</span>
                        <span className="text-emerald-600 dark:text-emerald-400">45% Volume</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#009966] h-full" style={{ width: "45%" }}></div>
                      </div>

                      <div className="flex justify-between items-center text-3xs">
                        <span className="text-slate-500">💡 Wall Sconce Lamp</span>
                        <span className="text-indigo-600 dark:text-indigo-400">20% Volume</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: "20%" }}></div>
                      </div>

                      <div className="flex justify-between items-center text-3xs">
                        <span className="text-slate-500">✨ Table Lamp Eid Series</span>
                        <span className="text-amber-600 dark:text-amber-500">18% Volume</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: "18%" }}></div>
                      </div>

                      <div className="flex justify-between items-center text-3xs">
                        <span className="text-slate-500">🗺️ Glass Lanterns/Sconce</span>
                        <span className="text-slate-600">17% Volume</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-650 h-full" style={{ width: "17%" }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-2xl shadow-sm md:col-span-2">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white pb-3 border-b dark:border-slate-750">SALES ENGINE DISTRIBUTION COOPERATIVES</h3>
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left text-3xs text-slate-500 font-bold border-collapse">
                        <thead>
                          <tr className="border-b dark:border-slate-750 uppercase text-slate-400">
                            <th className="pb-2">Kanal Distribusi</th>
                            <th className="pb-2 text-center">Pesanan</th>
                            <th className="pb-2 text-right">Rerata Tiket</th>
                            <th className="pb-2 text-right">Kontribusi Omzet</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b dark:border-slate-755">
                            <td className="py-2.5 flex items-center gap-1.5 text-slate-750 dark:text-slate-200 font-extrabold">🟢 Marketplace Shopee</td>
                            <td className="py-2.5 text-center">{orders.length} Order</td>
                            <td className="py-2.5 text-right">{formatIDR(265000)}</td>
                            <td className="py-2.5 text-right font-black text-slate-800 dark:text-white">{formatIDR(activeFinancials.grossRevenue - posHistory.reduce((s,t)=>s+t.total_amount, 0))}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 flex items-center gap-1.5 text-slate-750 dark:text-slate-200 font-extrabold">💳 Kasir POS Offline</td>
                            <td className="py-2.5 text-center">{posHistory.length} Transaksi</td>
                            <td className="py-2.5 text-right">{formatIDR(189000)}</td>
                            <td className="py-2.5 text-right font-black text-slate-800 dark:text-white">{formatIDR(posHistory.reduce((s,t)=>s+t.total_amount, 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. MARKETPLACE ANALYTICS */}
            {activeMenu === "marketplace" && (
              <div className="space-y-6 animate-fade-in">

                {/* Transaction input / import (F-01, PB-TRX-005) */}
                <OrderManager
                  orders={orders}
                  inventoryItems={inventory}
                  onAddOrders={handleAddOrders}
                  onDeleteOrder={handleDeleteOrder}
                  onUpdateStatus={handleUpdateOrderStatus}
                  canWrite={can(role, "transactions:write")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <span className="text-slate-450 dark:text-slate-550 text-[10px] font-black uppercase tracking-wider block">Shopee Net Profits</span>
                    <span className="text-xl font-black block mt-1.5">{formatIDR(Math.round(activeFinancials.netRevenue * 0.8))}</span>
                    <p className="text-3xs text-emerald-600 font-extrabold mt-1">▲ 82% dari total omzet gabungan</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <span className="text-slate-450 dark:text-slate-550 text-[10px] font-black uppercase tracking-wider block">Shopee Conversion-to-basket</span>
                    <span className="text-xl font-black block mt-1.5">3.8% Rate</span>
                    <p className="text-3xs text-slate-400 font-extrabold mt-1">Melampaui rata-rata industri (2.5%)</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <span className="text-slate-450 dark:text-slate-550 text-[10px] font-black uppercase tracking-wider block">Active Shopee Ad keywords</span>
                    <span className="text-xl font-black block mt-1.5">4.5x ROAS</span>
                    <p className="text-3xs text-yellow-600 dark:text-[#D4AF37] font-extrabold mt-1">Efisiensi bersertifikasi sangat baik</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-slate-850 dark:text-white pb-3 border-b dark:border-slate-750">INTEGRATIVE SHOPEE SELLER ADS OPTIMIZER</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 text-xs">
                    
                    <div className="space-y-4">
                      <p className="text-slate-500 font-semibold leading-relaxed">
                        Kami melacak rasio pengembalian modal belanja iklan (ROAS) dari mesin pencari internal Shopee Seller Ads. Kampanye Anda dioptimasi untuk mengurangi kata kunci berbiaya tinggi dengan ketiadaan pembelian riil.
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border dark:border-slate-750">
                        <div className="flex justify-between text-3xs font-black uppercase pb-2 border-b dark:border-slate-750 mb-2">
                          <span>Target Keyword Kampanye</span>
                          <span>ROAS Real</span>
                        </div>
                        <div className="space-y-2 text-3xs font-bold text-slate-600 dark:text-slate-300">
                          <div className="flex justify-between">
                            <span>Lampu Kubah Masjid LED JKT</span>
                            <span className="text-emerald-600">5.8x ROAS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lampu Sconce Ruang Tamu</span>
                            <span className="text-indigo-650">4.1x ROAS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lampu Hias Meja Eid Kristal</span>
                            <span className="text-amber-500">2.9x ROAS (Suboptimal)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-2xs font-black text-slate-800 dark:text-white uppercase">Voucher & Affiliate Performance Tracker</h4>
                      
                      <div className="p-4 rounded-xl border dark:border-slate-750">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="border-r dark:border-slate-750 pr-2">
                            <span className="text-3xs text-slate-400 font-black block uppercase">Voucher Code Claimed</span>
                            <strong className="text-lg font-black text-slate-800 dark:text-white block mt-1">104 Klaim</strong>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Rata-rata diskon IDR 12.000</span>
                          </div>
                          <div className="pl-2">
                            <span className="text-3xs text-slate-400 font-black block uppercase">Affiliate Ambassador</span>
                            <strong className="text-lg font-black text-slate-800 dark:text-white block mt-1">18 Influencer</strong>
                            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Sumbangkan +IDR 2.4M Omzet</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* 4. CASHIER (POS) */}
            {activeMenu === "pos" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Integration of POS-specific indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="text-3xs uppercase font-black text-slate-400 block tracking-wider">Total POS Cash Revenue</span>
                    <strong className="text-lg font-black block mt-1 text-emerald-600">{formatIDR(posHistory.reduce((s,t)=>s+t.total_amount, 0))}</strong>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="text-3xs uppercase font-black text-slate-400 block tracking-wider">Daily Tx Volume</span>
                    <strong className="text-lg font-black block mt-1 text-slate-800 dark:text-white">{posHistory.length} Transaksi</strong>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="text-3xs uppercase font-black text-slate-400 block tracking-wider">Busiest Hour</span>
                    <strong className="text-lg font-black block mt-1 text-amber-500">17:00 - 20:00</strong>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-xl shadow-sm">
                    <span className="text-3xs uppercase font-black text-slate-400 block tracking-wider">Payment split</span>
                    <strong className="text-lg font-black block mt-1 text-indigo-500">65% QRIS Gate</strong>
                  </div>
                </div>

                <POSSimulator
                  inventoryItems={inventory}
                  onAddTransaction={handleAddPOSTransaction}
                  posHistory={posHistory}
                />
              </div>
            )}

            {/* 5. FINANCIAL ANALYTICS */}
            {activeMenu === "financial" && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="p-5 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black text-slate-850 dark:text-white pb-3 border-b dark:border-slate-750">LUXORA AUDIT LAPORAN LABA RUGI</h3>
                  
                  {/* Detailed SaaS tabular ledger audit */}
                  <div className="mt-5 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Gross Sales (Marketplace + POS Offline)</span>
                      <strong className="text-slate-800 dark:text-slate-100">{formatIDR(activeFinancials.grossRevenue)}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Kurangi retur & pembatalan (Disapproved order loss)</span>
                      <strong className="text-rose-600">({formatIDR(activeFinancials.returnsLoss)})</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-705 border-b dark:border-slate-750 pb-2">
                      <span className="font-extrabold text-slate-650 dark:text-slate-300">Pendapatan Bersih (Net Revenue)</span>
                      <strong className="text-teal-600 dark:text-teal-400 font-extrabold">{formatIDR(activeFinancials.netRevenue)}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-500 mt-2">
                      <span>Harga Pokok Penjualan (HPP / COGS total)</span>
                      <strong className="text-slate-855 dark:text-slate-100">({formatIDR(activeFinancials.totalCogs)})</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-705 border-b dark:border-slate-750 pb-2">
                      <span className="font-extrabold text-slate-650 dark:text-slate-300">Keuntungan Kotor (Gross Profit)</span>
                      <strong className="text-slate-850 dark:text-white font-extrabold">{formatIDR(activeFinancials.grossProfit)}</strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-500 mt-2">
                      <span>Biaya Operasional (Opex terhitung: Iklan, Kemasan, Admin)</span>
                      <strong className="text-slate-855 dark:text-slate-100">({formatIDR(activeFinancials.opexBase)})</strong>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 dark:border-slate-700">
                      <span className="font-black text-emerald-600 dark:text-emerald-400">Keuntungan Bersih Rezeki (Net Profit)</span>
                      <strong className="text-lg font-black text-emerald-650 dark:text-emerald-400">{formatIDR(activeFinancials.netProfit)}</strong>
                    </div>
                  </div>
                </div>

                {/* Simulated waterfall visualization */}
                <div className="p-5 bg-white dark:bg-slate-800 border dark:border-slate-800 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase mb-4">FINANCIAL COGS WATERFALL FLOW</h3>
                  
                  <div className="flex flex-col md:flex-row items-stretch justify-around gap-4 h-64 mt-6">
                    {/* Bar 1: Gross Omzet */}
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <span className="text-3xs text-slate-400 font-bold mb-1.5">{formatIDR(activeFinancials.grossRevenue)}</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t-xl" style={{ height: "90%" }}></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 mt-2 text-center leading-none">Gross Revenue</span>
                    </div>

                    {/* Bar 2: COGS reduction */}
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <span className="text-3xs text-rose-500 font-bold mb-1.5">-{formatIDR(activeFinancials.totalCogs)}</span>
                      <div className="w-full bg-rose-600/60 rounded-t-xl" style={{ height: `${(activeFinancials.totalCogs / (activeFinancials.grossRevenue || 1)) * 90}%` }}></div>
                      <span className="text-[10px] font-black text-slate-650 dark:text-slate-300 mt-2 text-center leading-none">Total COGS (HPP)</span>
                    </div>

                    {/* Bar 3: OPEX reduction */}
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <span className="text-3xs text-rose-500 font-bold mb-1.5">-{formatIDR(activeFinancials.opexBase)}</span>
                      <div className="w-full bg-red-800/40 rounded-t-xl" style={{ height: `${(activeFinancials.opexBase / (activeFinancials.grossRevenue || 1)) * 90}%` }}></div>
                      <span className="text-[10px] font-black text-slate-650 dark:text-slate-300 mt-2 text-center leading-none">Operational Costs</span>
                    </div>

                    {/* Bar 4: Net Clean Profit */}
                    <div className="flex-1 flex flex-col justify-end items-center">
                      <span className="text-3xs text-emerald-600 font-black mb-1.5">{formatIDR(activeFinancials.netProfit)}</span>
                      <div className="w-full bg-emerald-600 rounded-t-xl" style={{ height: `${(activeFinancials.netProfit / (activeFinancials.grossRevenue || 1)) * 90}%` }}></div>
                      <span className="text-[10px] font-black text-[#009966] mt-2 text-center leading-none">Net Clean Profit</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 6. INVENTORY MANAGEMENT */}
            {activeMenu === "inventory" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Inventory Assets Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Book Valuation Asset</span>
                    <strong className="text-xl font-black block mt-1.5">{formatIDR(activeFinancials.totalInventoryAssetValue)}</strong>
                    <p className="text-3xs text-slate-500 font-bold mt-1">Dihitung berdasarkan Harga Pokok Pembian (COGS)</p>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-[#D4AF37]/25 shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent">
                    <span className="text-[10px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-wider block">Low Stock Warning Limit</span>
                    <strong className="text-xl font-black block mt-1.5 text-amber-500">{lowStockCount} SKU Terancam Habis</strong>
                    <p className="text-3xs text-slate-500 font-bold mt-1">Segera kirimkan Purchase Order penambahan produk!</p>
                  </div>
                </div>

                <InventoryManager
                  inventoryItems={inventory}
                  onAddStock={handleAddNewStock}
                  onAddProduct={handleAddProduct}
                  canWrite={can(role, "stock:write")}
                />
              </div>
            )}

            {/* 7. OPERATIONAL ANALYTICS */}
            {activeMenu === "operational" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <h3 className="text-sm font-black text-slate-850 dark:text-white pb-3 border-b dark:border-slate-750">BIAYA OPERASIONAL RIIL (OPEX LEDGER)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-3xs border-b dark:border-slate-755 pb-1">
                        <span>Biaya Admin Komisi Shopee (4.25%)</span>
                        <span className="text-slate-800 dark:text-slate-100">IDR 850.000</span>
                      </div>
                      <div className="flex justify-between items-center text-3xs border-b dark:border-slate-755 pb-1">
                        <span>Layanan Penjual Shopee Cashless</span>
                        <span className="text-slate-800 dark:text-slate-100">IDR 220.000</span>
                      </div>
                      <div className="flex justify-between items-center text-3xs border-b dark:border-slate-755 pb-1">
                        <span>Diskon Belanja Subsidi Iklan</span>
                        <span className="text-slate-800 dark:text-slate-100">IDR 110.000</span>
                      </div>
                      <div className="flex justify-between items-center text-3xs border-b dark:border-slate-755 pb-1">
                        <span>Biaya Asuransi Transit Barang Kaca</span>
                        <span className="text-slate-800 dark:text-slate-100">IDR 55.000</span>
                      </div>
                      <div className="flex justify-between items-center text-3xs border-b dark:border-slate-755 pb-1">
                        <span>Gaji Admin POS offline & Kas Toko</span>
                        <span className="text-slate-800 dark:text-slate-100">IDR 154.000</span>
                      </div>
                    </div>

                    {/* Operational optimization simulation slider */}
                    <div className="p-5 rounded-xl border dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 space-y-4">
                      <div>
                        <h4 className="text-2xs font-extrabold text-[#009966] uppercase">Interactive Packing Cost Optimizer</h4>
                        <p className="text-3xs text-slate-450 mt-1 font-medium leading-relaxed">
                          Gunakan slider simulasi di bawah ini untuk melihat perkiraan peningkatan margin jika biaya kemasan kayu packing dikurangi (misal nego produsen lokal).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-3xs">
                          <span>Persentase Hemat Kemasan</span>
                          <span className="text-emerald-600 font-extrabold">{sliderPackingCost}% Penghematan</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={sliderPackingCost}
                          onChange={(e) => setSliderPackingCost(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-205 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#009966]"
                        />
                      </div>

                      <div className="pt-2.5 border-t dark:border-slate-700 flex justify-between items-center text-3xs">
                        <span>Simulasi Menghemat OPEX:</span>
                        <strong className="text-emerald-600">{formatIDR(Math.round(180000 * (sliderPackingCost/100)))}</strong>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 8. RISK ANALYTICS */}
            {activeMenu === "risk" && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-rose-950/20 shadow-sm">
                    <span className="text-3xs font-black uppercase text-rose-600 block">Total Claims Return Loss</span>
                    <strong className="text-lg font-black block mt-1.5 text-rose-600">{formatIDR(activeFinancials.returnsLoss)}</strong>
                    <p className="text-3xs text-slate-500 font-bold mt-1">Sebab paling utama: Barang pecah di pelabuhan</p>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <span className="text-3xs font-black uppercase text-slate-400 block">Anomaly Flags</span>
                    <strong className="text-lg font-black block mt-1.5">{unresolvedRisks} Menunggu</strong>
                    <p className="text-3xs text-slate-500 font-bold mt-1">Selesasikan guna rilis modal tertahan syariah</p>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <span className="text-3xs font-black uppercase text-slate-400 block">Shopee Cancel Rate</span>
                    <strong className="text-lg font-black block mt-1.5">1.8% Rate</strong>
                    <p className="text-3xs text-emerald-600 font-extrabold mt-1">Sangat aman (di bawah batas penalti Shopee 3.0%)</p>
                  </div>
                </div>

                <RiskCenter
                  anomalyLogs={anomalies}
                  riskItems={risks}
                  onResolveAnomaly={handleResolveAnomaly}
                  onDismissAnomaly={handleDismissAnomaly}
                  onResolveReturn={handleResolveReturn}
                  canResolve={can(role, "risk:resolve")}
                />
              </div>
            )}

            {/* 9. GEOGRAPHIC ANALYTICS */}
            {activeMenu === "geographic" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <div className="pb-3 border-b dark:border-slate-750 mb-4 text-xs font-extrabold">
                    <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase">INDONESIA SALES GEOGRAPHIC COVERAGE</h3>
                    <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">Hover provinsi pada visual peta interaktif di bawah ini untuk melihat perolehan omzet dan tingkat kerusakan barang logistik ekspedisi.</p>
                  </div>
                  
                  <IndonesiaMap
                    provinceMetrics={computedProvinceMetrics}
                    selectedProvince={selectedProvince}
                    onSelectProvince={setSelectedProvince}
                  />
                </div>
              </div>
            )}

            {/* 10. LUXORA SHARIA INTELLIGENCE */}
            {activeMenu === "sharia" && (
              <div className="space-y-6 animate-fade-in">
                <ShariaRadar
                  shariaMetrics={shariaCompliance.metrics}
                  complianceScore={shariaCompliance.score}
                  complianceBadge={shariaCompliance.badge}
                  cashBalance={activeFinancials.netProfit}
                  inventoryValue={activeFinancials.totalInventoryAssetValue}
                  zakatRecords={zakatHistory}
                  onPayZakat={handleAddNewZakatPayment}
                  canPay={can(role, "zakat:pay")}
                />
                <ShariaAudit orders={orders} />
              </div>
            )}

            {/* 11. LUXORA AI INSIGHTS */}
            {activeMenu === "ai_insights" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b dark:border-slate-750 mb-5 gap-3">
                    <div>
                      <h2 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-1.5 leading-none">
                        <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                        <span>LUXORA AI INSIGHT ENGINE</span>
                      </h2>
                      <p className="text-3xs text-slate-400 dark:text-slate-505 mt-1 leading-relaxed">
                        Kami menyajikan analisis prediktif berbasis pemodelan bahasa besar yang disinkronisasi dengan margin real.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateAIInsight}
                      disabled={isGeneratingInsight}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-2xs font-extrabold uppercase tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10 min-w-44"
                    >
                      {isGeneratingInsight ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>Generate New Insight</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* List of dynamic generated AI insights */}
                  <div className="space-y-4">
                    {aiInsights.map((ins, index) => (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-750/70 border-l-4 border-l-emerald-600 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-3xs font-black mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-2xs text-slate-750 dark:text-slate-200 leading-relaxed font-semibold">
                          {ins}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated prediction forecasting graphs meters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm text-xs font-bold">
                    <h4 className="text-2xs font-black text-slate-800 dark:text-white uppercase border-b dark:border-slate-750 pb-2 mb-3">
                      Sales Trend 30-Day Forecast
                    </h4>
                    <p className="text-3xs text-slate-450 leading-relaxed font-semibold">
                      Model memprediksi peningkatan permintaan Lampu Kubah Masjid dan Lentera Eid Series sebesar <b>+15%</b> karena masuknya bulan suci mendatang. Safety stock harus segera diamankan ke pemasok utama.
                    </p>
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-990/20 text-[#009966] text-3xs rounded-lg font-black tracking-wide">
                      Akurasi Prediksi Model: 89.2% (Historical Validation)
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm text-xs font-bold">
                    <h4 className="text-2xs font-black text-slate-800 dark:text-white uppercase border-b dark:border-slate-750 pb-2 mb-3">
                      Logistics Return Risk Forecast
                    </h4>
                    <p className="text-3xs text-slate-450 leading-relaxed font-semibold">
                      Risiko barang pecah pada rute pengiriman ke Sumatera Barat diprediksi naik ke level moderat akibat gelombang musim hujan dan guncangan kargo kapal laut.
                    </p>
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-3xs rounded-lg font-black tracking-wide">
                      Mitigasi: Tambahkan asuransi & kemasan peti kayu double premium.
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 12. REPORTS CENTER */}
            {activeMenu === "reports" && (
              <div className="space-y-6 animate-fade-in">
                <ReportCenter
                  orders={orders}
                  posHistory={posHistory}
                  inventoryItems={inventory}
                  riskItems={risks}
                  zakatRecords={zakatHistory}
                  netSales={activeFinancials.netRevenue}
                  grossProfit={activeFinancials.grossProfit}
                  netProfit={activeFinancials.netProfit}
                  opexTotal={activeFinancials.opexBase}
                />
              </div>
            )}

            {/* SHOP / USER MANAGEMENT (Owner only) */}
            {activeMenu === "users" && <ShopMembers />}

            {/* 13. SETTINGS */}
            {activeMenu === "settings" && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-800 shadow-sm">
                  <h3 className="text-sm font-black text-slate-850 dark:text-white pb-3 border-b dark:border-slate-750 uppercase">LUXORA SYSTEM OPTIONS</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-5 text-xs">
                    
                    {/* General Company Details Form */}
                    <div className="space-y-4">
                      <h4 className="text-2xs font-extrabold uppercase text-slate-400">Company & Store Profile</h4>
                      
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="font-extrabold text-slate-500">Nama Perusahaan Dashboard</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border dark:border-slate-700 rounded-xl"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-extrabold text-slate-500">Username Toko Shopee</label>
                          <input
                            type="text"
                            value={shopeeStore}
                            onChange={(e) => setShopeeStore(e.target.value)}
                            className="p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border dark:border-slate-700 rounded-xl font-mono"
                          />
                        </div>

                        {/* Shop join code — share with Staff/Accountant to join this shop */}
                        <div className="flex flex-col gap-1">
                          <label className="font-extrabold text-slate-500">Kode Toko (untuk undang Staff/Accountant)</label>
                          <div className="flex items-center gap-2">
                            <span className="flex-1 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300/50 rounded-xl font-mono font-black tracking-widest text-center">
                              {user?.shopJoinCode || "—"}
                            </span>
                            <button
                              type="button"
                              onClick={() => { if (user?.shopJoinCode) navigator.clipboard?.writeText(user.shopJoinCode); }}
                              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-3xs font-black uppercase rounded-xl cursor-pointer"
                            >
                              Salin
                            </button>
                          </div>
                          <span className="text-3xs text-slate-400">Bagikan kode ini agar tim bergabung ke toko yang sama.</span>
                        </div>
                      </div>
                    </div>

                    {/* Notification and Theme triggers */}
                    <div className="space-y-5">
                      <h4 className="text-2xs font-extrabold uppercase text-slate-400">System Preferences</h4>
                      
                      <div className="space-y-3 font-semibold">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-750">
                          <div>
                            <span className="block text-2xs font-black">Notifikasi Anomali Real-Time</span>
                            <span className="block text-3xs text-slate-450 font-medium mt-0.5">Bunyikan alarm jika ada double order masuk</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isNotificationsEnabled}
                            onChange={(e) => setIsNotificationsEnabled(e.target.checked)}
                            className="w-4 h-4 text-[#009966] accent-[#009966] rounded cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-750">
                          <div>
                            <span className="block text-2xs font-black">Mode Tampilan Gelap (Dark Theme)</span>
                            <span className="block text-3xs text-slate-450 font-medium mt-0.5">Sesuaikan kenyamanan mata saat redup malam</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                            className="w-4 h-4 text-[#009966] accent-[#009966] rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 border-t dark:border-slate-750 pt-6 text-xs">
                    
                    {/* User accounts list table representation */}
                    <div className="space-y-3">
                      <h4 className="text-2xs font-extrabold uppercase text-slate-400">Roster User & Hak Akses</h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-3xs font-bold border-collapse">
                          <thead>
                            <tr className="border-b dark:border-slate-750 text-slate-400">
                              <th className="pb-1">Nama</th>
                              <th className="pb-1">Peran</th>
                              <th className="pb-1 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b dark:border-slate-755 text-slate-700 dark:text-slate-300">
                              <td className="py-2">Safitri</td>
                              <td className="py-2 text-emerald-600 dark:text-emerald-400">Financial Auditor (Creator)</td>
                              <td className="py-2 text-center text-emerald-600">Aktif</td>
                            </tr>
                            <tr className="border-b dark:border-slate-755 text-slate-705 dark:text-slate-400">
                              <td className="py-2">Ahmad Hakim</td>
                              <td className="py-2">Muamalah Advisor</td>
                              <td className="py-2 text-center text-emerald-600">Aktif</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* AI Configuration details (masking keys / temp) */}
                    <div className="space-y-4">
                      <h4 className="text-2xs font-extrabold uppercase text-slate-400">AI Model Configuration</h4>
                      
                      <div className="space-y-3 font-semibold text-3xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between">
                            <span>Creativity Index (Model Temperature)</span>
                            <span className="text-emerald-650">{aiModelTemp}</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={aiModelTemp}
                            onChange={(e) => setAiModelTemp(Number(e.target.value))}
                            className="w-full h-1 bg-slate-205 dark:bg-slate-700 rounded-lg cursor-pointer accent-[#009966]"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 pt-2">
                          <label className="text-slate-450 uppercase">Gemini API Key Secret (Encrypted)</label>
                          <input
                            type="password"
                            disabled
                            value="••••••••••••••••••••••••••••••••"
                            className="p-2 bg-slate-100 dark:bg-slate-900 border dark:border-slate-750 rounded text-slate-400 font-mono disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Data Management — reset persisted localStorage data */}
                  <div className="mt-8 border-t dark:border-slate-750 pt-6">
                    <h4 className="text-2xs font-extrabold uppercase text-rose-500">Manajemen Data</h4>
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-300/60 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/10">
                      <div>
                        <span className="block text-2xs font-black text-slate-800 dark:text-slate-100">Reset Seluruh Data ke Awal</span>
                        <span className="block text-3xs text-slate-450 font-medium mt-0.5 max-w-md leading-relaxed">
                          Menghapus semua data yang tersimpan di browser ini (transaksi POS, stok, riwayat zakat, anomali, pengaturan) dan mengembalikan data contoh bawaan. Tindakan ini tidak dapat dibatalkan.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Yakin ingin menghapus SEMUA data dan kembali ke data contoh awal? Tindakan ini tidak dapat dibatalkan."
                          );
                          if (confirmed) {
                            resetData().finally(() => window.location.reload());
                          }
                        }}
                        className="shrink-0 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 font-extrabold text-2xs uppercase text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t dark:border-slate-750 flex justify-end gap-3.5">
                    <button
                      onClick={() => {
                        setIsConfigSynced(true);
                        setTimeout(() => setIsConfigSynced(false), 2000);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-2xs uppercase text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      {isConfigSynced ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved Completely!</span>
                        </>
                      ) : (
                        <span>Simpan Konfigurasi & Hubungkan Toko</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* PREMIUM SAAS FOOTER */}
        <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-7 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-sm font-black tracking-tight text-slate-850 dark:text-white">
                💡 LUXORA
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                Smart Lighting Business Intelligence Platform
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-xs font-semibold">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Powered by: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">LUXORA AI Analytics Engine</strong>
              </span>
              <span className="hidden md:inline text-slate-200 dark:text-slate-800">|</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2.5 py-1 rounded text-3xs font-black tracking-wider leading-none">
                VERSION 1.0
              </span>
            </div>
          </div>
        </footer>

        {/* AI COPILOT LAUNCH FLOATER */}
        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="fixed right-6 bottom-6 p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all shadow-xl hover:scale-105 z-50 cursor-pointer flex items-center space-x-2 border border-emerald-450"
        >
          <MessageSquare className="w-5.5 h-5.5 text-white animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider pr-1">LUXORA AI</span>
        </button>

        {/* FLOATING COPILOT CONVERSATION DRAWER */}
        <AICopilot
          dataContext={aiDataContext}
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />

      </div>

    </div>
  );
}
