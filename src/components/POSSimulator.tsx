/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShoppingCart, Plus, Minus, User, ShieldCheck, CheckCircle2, CreditCard, Banknote } from "lucide-react";
import { POSTransaction, InventoryItem } from "../types";

interface POSSimulatorProps {
  inventoryItems: InventoryItem[];
  onAddTransaction: (tx: POSTransaction) => void;
  posHistory: POSTransaction[];
}

export default function POSSimulator({
  inventoryItems,
  onAddTransaction,
  posHistory
}: POSSimulatorProps) {
  // Input fields state
  const [selectedSku, setSelectedSku] = useState(inventoryItems[0]?.sku || "");
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState("Ahmad Pelanggan POS");
  const [cashierName, setCashierName] = useState("Ahmad Cashier");
  const [paymentMethod, setPaymentMethod] = useState<POSTransaction["payment_method"]>("QRIS");
  const [successMsg, setSuccessMsg] = useState("");

  const activeProduct = inventoryItems.find((item) => item.sku === selectedSku);
  const sellingPrice = activeProduct ? Math.round(activeProduct.cost_price * 1.95) : 0; // POS Price with healthy markup
  const totalAmount = sellingPrice * qty;

  // Checkout process handler
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    if (activeProduct.stock_ending < qty) {
      alert(`Stok tidak mencukupi! Tersisa hanya ${activeProduct.stock_ending} unit.`);
      return;
    }

    const newTx: POSTransaction = {
      transaction_id: `POS-${Date.now().toString().slice(-8)}`,
      cashier_name: cashierName,
      transaction_date: new Date().toISOString(),
      customer_name: customerName,
      product_name: activeProduct.product_name,
      qty,
      selling_price: sellingPrice,
      total_amount: totalAmount,
      payment_method: paymentMethod
    };

    onAddTransaction(newTx);
    setSuccessMsg(`Transaksi berkelanjutan berhasil! Tunai/Elektronik diterima via ${paymentMethod}.`);
    
    // Reset values with small delay
    setTimeout(() => {
      setSuccessMsg("");
      setQty(1);
    }, 3000);
  };

  // Payment method options
  const paymentGateways: { value: POSTransaction["payment_method"]; type: string; label: string }[] = [
    { value: "QRIS", type: "Digital", label: "QRIS Sharia Link" },
    { value: "Cash", type: "Cash", label: "Cash (Tunai)" },
    { value: "GoPay", type: "Digital", label: "GoPay Wallet" },
    { value: "OVO", type: "Digital", label: "OVO Cash" },
    { value: "DANA", type: "Digital", label: "DANA Syariah" },
    { value: "ShopeePay", type: "Digital", label: "ShopeePay" },
    { value: "Transfer", type: "Bank", label: "BSI Bank Transfer" }
  ];

  // Grouped cashier stats
  const cashiers = ["Ahmad Cashier", "Farhan Cashier"];
  const salesByCashier = cashiers.reduce((acc, name) => {
    const total = posHistory
      .filter((tx) => tx.cashier_name === name)
      .reduce((sum, item) => sum + item.total_amount, 0);
    acc[name] = total;
    return acc;
  }, {} as Record<string, number>);

  // Payment Breakdown count
  const paymentBreakdown = posHistory.reduce((acc, tx) => {
    acc[tx.payment_method] = (acc[tx.payment_method] || 0) + tx.total_amount;
    return acc;
  }, {} as Record<string, number>);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      
      {/* COLUMN 1: Interactive checkout terminal */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600 dark:bg-emerald-500"></div>
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>KAS POS OFFLINE SIMULATOR STANDARD TERMINAL</span>
        </h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          E-POS Syariat Gateway: Tidak ada denda keterlambatan pembayaran, bebas gharar, akad jual beli as-Salam jelas.
        </p>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-4 mt-5">
          {/* Cashier and Customer fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                KASIR (Akuntan)
              </label>
              <select
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Ahmad Cashier">Ahmad Cashier</option>
                <option value="Farhan Cashier">Farhan Cashier</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                NAMA PELANGGAN
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Product and Quantity fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 border-slate-50 dark:border-slate-705">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                PILIH PRODUK LAMPU HIAS
              </label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {inventoryItems.map((item) => (
                  <option key={item.sku} value={item.sku}>
                    {item.product_name} (Stok: {item.stock_ending} Psc)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 text-center">
                KUANTITAS
              </label>
              <div className="flex items-center justify-between border dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1 text-slate-500 dark:hover:text-white cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-slate-800 dark:text-white">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(activeProduct?.stock_ending || 99, qty + 1))}
                  className="p-1 text-slate-500 dark:hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Payment gateways selection */}
          <div className="border-t pt-4 border-slate-50 dark:border-slate-705">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
              AKAD PEMBAYARAN & GERBANG TRANSAKSI
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentGateways.map((gate) => {
                const selected = paymentMethod === gate.value;
                return (
                  <button
                    key={gate.value}
                    type="button"
                    onClick={() => setPaymentMethod(gate.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-16 ${
                      selected
                        ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-3xs tracking-widest font-black uppercase text-slate-400 dark:text-slate-500 leading-tight">
                        {gate.type}
                      </span>
                      {selected && <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold leading-none mt-2">{gate.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculation Summary & Submit Button */}
          <div className="border-t pt-5 border-slate-100 dark:border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">
                Total Jual Akad (Khas Jual)
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-white block mt-0.5 animate-pulse">
                {formatIDR(totalAmount)}
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-emerald-550/10 cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesaikan Transaksi (Ijab Qabul)</span>
            </button>
          </div>
        </form>
      </div>

      {/* COLUMN 2: POS Analytics Display */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>SECTION 4 & 5: REPORT ANALYTICAL GATEWAY</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Metrik arus kas offline terbagi per-kasir (Amanah Audited) dan proporsi kanal keuangan.
          </p>

          {/* Cashier performance metrics */}
          <div className="space-y-3.5 mt-5">
            <h3 className="text-2xs font-bold text-slate-400 tracking-widest uppercase">
              Pendapatan Berdasarkan Kasir (POS Performance)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {cashiers.map((cashier) => {
                const total = salesByCashier[cashier] || 0;
                const percent = posHistory.length > 0 
                  ? Math.round((total / posHistory.reduce((s, o) => s + o.total_amount, 0)) * 100) 
                  : 50;
                return (
                  <div key={cashier} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border dark:border-slate-750">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">{cashier}</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white block mt-1">{formatIDR(total)}</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 dark:bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-1">{percent}% dari kas POS</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Donut/Bar fractions */}
          <div className="mt-6">
            <h3 className="text-2xs font-bold text-slate-400 tracking-widest uppercase mb-3">
              Fractions Metode Pembayaran (Payment Analytics)
            </h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {paymentGateways.map((gate) => {
                const totalValue = paymentBreakdown[gate.value] || 0;
                const totalPOSSales = posHistory.reduce((s, x) => s + x.total_amount, 0) || 1;
                const fraction = Math.round((totalValue / totalPOSSales) * 100);
                
                return (
                  <div key={gate.value} className="flex items-center justify-between text-2xs">
                    <span className="font-bold text-slate-500 dark:text-slate-450 flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        gate.value === "QRIS" ? "bg-emerald-500" :
                        gate.value === "Cash" ? "bg-amber-500" :
                        gate.value === "GoPay" ? "bg-indigo-500" :
                        "bg-teal-500"
                      }`}></span>
                      <span>{gate.value}</span>
                    </span>
                    
                    {/* Visual Bar */}
                    <div className="flex-1 mx-4 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          gate.value === "QRIS" ? "bg-emerald-500" :
                          gate.value === "Cash" ? "bg-amber-550" :
                          gate.value === "GoPay" ? "bg-indigo-500" :
                          "bg-teal-500"
                        }`}
                        style={{ width: `${fraction}%` }}
                      ></div>
                    </div>

                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatIDR(totalValue)} ({fraction}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Operational logs footer card */}
        <div className="mt-5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 tracking-tight flex items-center space-x-1 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sistem POS terenkripsi: Amanah Audited</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold">Log: {posHistory.length} TX</span>
        </div>

      </div>
    </div>
  );
}
