"use client";
import React from 'react';
import { api } from "~/trpc/react";
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Coins, 
  LayoutDashboard 
} from 'lucide-react';

export default function DashboardPage() {
  // 1. Daten abrufen (Hook)
  const { data: balances, isLoading } = api.finance.getBitvavoBalances.useQuery();

  const totalCryptoValue = balances?.reduce((acc, asset) => acc + asset.valueEur, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 p-6 md:p-10">
      
      {/* --- HEADER --- */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purrfolio Dashboard</h1>
          <p className="text-slate-400 mt-1">Live-Daten aus deinen angebundenen Wallets.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-xl">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <LayoutDashboard size={20} />
          </div>
          <div className="pr-4">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Status</p>
            <p className="text-sm font-medium text-emerald-400">
              {isLoading ? "Synchronisiere..." : "Live verbunden"}
            </p>
          </div>
        </div>
      </header>

      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Gesamtvermögen (Statisch, bis wir Kurse berechnen) */}
      <div className="bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
        {/* ... Icon ... */}
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Gesamtvermögen</p>
        <h2 className="text-4xl font-bold mt-2">
          {isLoading ? "---" : `${totalCryptoValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
        </h2>
        <p className="text-xs text-emerald-500 mt-4 italic">Live aus Bitvavo berechnet</p>
      </div>

        {/* 2. Monatliche Cashflow-Kurve (Platzhalter) */}
        <div className="md:col-span-2 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <TrendingUp size={24} />
              </div>
              <p className="text-slate-50 text-lg font-semibold italic">Cashflow Prognose</p>
          </div>
          <div className="h-[120px] w-full flex items-end gap-1 px-2 opacity-50">
             {[40, 70, 45, 90, 65, 80, 100, 85, 110, 75, 95, 120].map((h, i) => (
               <div key={i} className="flex-1 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-sm" style={{ height: `${h}%` }} />
             ))}
          </div>
        </div>

        {/* 3. ECHTE DATEN: Bitvavo Crypto Assets */}
        <div className="bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Coins size={24} />
             </div>
             <p className="text-slate-50 text-lg font-semibold italic">Live Crypto Assets</p>
          </div>

        <div className="space-y-3">
              {isLoading ? (
                <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg" />
              ) : (
                balances?.map((asset) => (
                  <div key={asset.symbol} className="flex justify-between items-center bg-slate-800/30 border border-slate-700/50 p-3 rounded-xl">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{asset.symbol}</span>
                      <span className="text-[10px] text-slate-500">
                        {asset.available} @ {asset.priceEur.toLocaleString('de-DE')} €
                      </span>
                    </div>
                    <span className="text-sm font-mono text-emerald-400 font-semibold">
                      {asset.valueEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                ))
              )}
            </div>

          {/* Deko-Glow im Hintergrund */}
          <div className="absolute -right-4 -top-4 h-16 w-16 bg-orange-500/5 blur-2xl rounded-full" />
        </div>

        {/* 4. Letzte Transaktionen (Platzhalter) */}
        <div className="md:col-span-2 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
           <h3 className="text-lg font-semibold mb-4 text-slate-400">Synchronisierte Aktivitäten</h3>
           <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-600 text-sm italic">Verbinde eine Bank für Transaktionshistorie</p>
           </div>
        </div>

      </div>
    </div>
  );
}

// Helper Components für einen sauberen Code-Vibe
function AllocationItem({ label, value, color, icon }: { label: string, value: string, color: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-400">{icon} {label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: value }} />
      </div>
    </div>
  );
}

function TransactionRow({ name, date, amount, type }: { name: string, date: string, amount: string, type: string }) {
  return (
    <div className="py-4 flex justify-between items-center group cursor-pointer hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700/50 text-slate-400'}`}>
          {type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
      </div>
      <p className={`text-sm font-bold ${amount.startsWith('+') ? 'text-emerald-400' : 'text-slate-100'}`}>
        {amount}
      </p>
    </div>
  );
}