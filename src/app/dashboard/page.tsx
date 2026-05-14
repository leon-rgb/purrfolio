import React from 'react';
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
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 p-6 md:p-10">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purrfolio Dashboard</h1>
          <p className="text-slate-400 mt-1">Willkommen zurück. Hier ist deine finanzielle Übersicht.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-xl">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <LayoutDashboard size={20} />
          </div>
          <div className="pr-4">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Status</p>
            <p className="text-sm font-medium text-emerald-400">Live Synchronisiert</p>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Gesamtvermögen Card */}
        <div className="md:col-span-1 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Wallet size={24} />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              <ArrowUpRight size={14} /> +2.4%
            </span>
          </div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Gesamtvermögen</p>
          <h2 className="text-4xl font-bold mt-2">124.590,42 €</h2>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-slate-300 font-semibold">Giro + Depot + Krypto</span>
          </div>
          {/* Subtile Glow-Effekt im Hintergrund */}
          <div className="absolute -right-8 -bottom-8 h-24 w-24 bg-emerald-500/5 blur-3xl rounded-full" />
        </div>

        {/* 2. Monatliche Cashflow-Kurve (Platzhalter für Chart) */}
        <div className="md:col-span-2 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <TrendingUp size={24} />
              </div>
              <p className="text-slate-50 text-lg font-semibold italic">Cashflow Kurve</p>
            </div>
            <select className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 ring-emerald-500">
              <option>Letzte 6 Monate</option>
              <option>Dieses Jahr</option>
            </select>
          </div>
          {/* Visual Placeholder for a Line Chart */}
          <div className="h-[120px] w-full flex items-end gap-1 px-2">
             {[40, 70, 45, 90, 65, 80, 100, 85, 110, 75, 95, 120].map((h, i) => (
               <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-500/60 rounded-t-sm" style={{ height: `${h}%` }} />
             ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            <span>Jan</span><span>Feb</span><span>Mär</span><span>Apr</span><span>Mai</span><span>Jun</span>
          </div>
        </div>

        {/* 3. Depot-Zusammensetzung */}
        <div className="md:col-span-3 lg:col-span-1 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <PieChart size={24} />
            </div>
            <p className="text-slate-50 text-lg font-semibold italic">Asset Allocation</p>
          </div>
          
          <div className="space-y-4">
            <AllocationItem label="ETFs & Aktien" value="65%" color="bg-emerald-500" icon={<TrendingUp size={14}/>} />
            <AllocationItem label="Kryptowährungen" value="20%" color="bg-orange-500" icon={<Coins size={14}/>} />
            <AllocationItem label="Cash / Notgroschen" value="15%" color="bg-blue-500" icon={<CreditCard size={14}/>} />
          </div>

          <button className="w-full mt-8 py-3 bg-slate-50 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
            Details ansehen
          </button>
        </div>

        {/* 4. Letzte Aktivitäten (Extra für den Premium Look) */}
        <div className="md:col-span-3 lg:col-span-2 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
           <h3 className="text-lg font-semibold mb-4">Letzte Transaktionen</h3>
           <div className="divide-y divide-slate-800">
              <TransactionRow name="Bitvavo Buy (BTC)" date="Heute, 14:20" amount="+0.0024 BTC" type="crypto" />
              <TransactionRow name="ING Gehalt" date="Gestern" amount="+3.450,00 €" type="income" />
              <TransactionRow name="Miete" date="01. Mai" amount="-1.200,00 €" type="expense" />
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