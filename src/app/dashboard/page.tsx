"use client";
import React, { useEffect } from 'react';
import { api } from "~/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  LayoutDashboard,
  Building2,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const utils = api.useUtils();

  // 1. Mutation für den OAuth-Code
  const syncMutation = api.banking.syncSession.useMutation({
    onSuccess: async () => {
      // Erzwingt das Löschen und Neuladen der Bankkonten im tRPC Cache
      await utils.banking.getSavedBankAccounts.invalidate();
      router.replace("/dashboard");
    }
  });

  // 2. OAuth-Callback sofort abfangen und synchronisieren
  useEffect(() => {
    if (code) {
      syncMutation.mutate({ code });
    }
  }, [code]);

  // 3. Live Data Hooks (getSavedBankAccounts wartet, bis der Sync vorbei ist!)
  const { data: cryptoBalances, isLoading: cryptoLoading } = api.finance.getBitvavoBalances.useQuery();
  
  const { data: bankAccounts, isLoading: bankLoading } = api.banking.getSavedBankAccounts.useQuery(
    undefined, 
    {
      // WICHTIG: Führe die Query nicht aus, solange ein Code in der URL steht oder die Mutation läuft
      enabled: !code && !syncMutation.isPending,
    }
  );

  const { data: authUrlData } = api.banking.getAuthUrl.useQuery(undefined, {
    refetchOnWindowFocus: false,
    enabled: !code, // Keine neue Auth-URL generieren, wenn wir gerade aus dem OAuth-Flow kommen
  });

  // 4. Vermögenswerte summieren
  const totalCryptoValue = cryptoBalances?.reduce((acc, asset) => acc + asset.valueEur, 0) ?? 0;
  const totalBankValue = bankAccounts?.reduce((acc, accDb) => acc + parseFloat(accDb.balance), 0) ?? 0;
  const totalPortfolioValue = totalCryptoValue + totalBankValue;

  // Alle Transaktionen aggregieren
  const allBankTransactions = bankAccounts?.flatMap(acc => 
    acc.transactions.map(t => ({
      ...t,
      accountName: acc.name
    }))
  ).sort((a, b) => b.date.getTime() - a.date.getTime()) ?? [];

  const isAnyLoading = cryptoLoading || bankLoading || syncMutation.isPending;

  // 5. Abfang-Zustand: Zeige Lade-Indikator, während die Mock-Daten in die DB wandern
  if (code || syncMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#09090b] text-slate-50 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
        <h2 className="text-xl font-semibold">Verbinde dein Bankkonto...</h2>
        <p className="text-sm text-slate-400">Mock-Daten werden importiert und verschlüsselt.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 p-6 md:p-10">
      
      {/* --- HEADER --- */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purrfolio Dashboard</h1>
          <p className="text-slate-400 mt-1">Live-Daten aus deinen Krypto-Wallets und Bankkonten.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {authUrlData && !bankAccounts?.length && (
            <a 
              href={authUrlData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/10"
            >
              <Building2 size={16} />
              Bankkonto verknüpfen
            </a>
          )}

          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-2 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <LayoutDashboard size={20} />
            </div>
            <div className="pr-4">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Status</p>
              <p className="text-sm font-medium text-emerald-400">
                {isAnyLoading ? "Synchronisiere..." : "Live verbunden"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gesamtvermögen */}
        <div className="bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Gesamtvermögen</p>
          <h2 className="text-4xl font-bold mt-2">
            {isAnyLoading ? "---" : `${totalPortfolioValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          </h2>
          <div className="mt-4 flex flex-col gap-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Crypto Assets:</span>
              <span className="font-mono text-slate-200">{totalCryptoValue.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between">
              <span>Bankkonten:</span>
              <span className="font-mono text-slate-200">{totalBankValue.toLocaleString('de-DE')} €</span>
            </div>
          </div>
        </div>

        {/* Cashflow Kurve */}
        <div className="md:col-span-2 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <TrendingUp size={24} />
              </div>
              <p className="text-slate-50 text-lg font-semibold italic">Portfolio Entwicklung</p>
          </div>
          <div className="h-[120px] w-full flex items-end gap-1 px-2 opacity-50">
              {[40, 70, 45, 90, 65, 80, 100, 85, 110, 75, 95, 120].map((h, i) => (
               <div key={i} className="flex-1 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
          </div>
        </div>

        {/* ECHTE DATEN: Bankkonten Salden */}
        <div className="bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Building2 size={24} />
             </div>
             <p className="text-slate-50 text-lg font-semibold italic">Bankkonten</p>
          </div>
          <div className="space-y-3">
            {bankLoading ? (
              <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg" />
            ) : bankAccounts?.length ? (
              bankAccounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center bg-slate-800/30 border border-slate-700/50 p-3 rounded-xl">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-100">{account.name}</span>
                    <span className="text-[10px] text-slate-500">{account.institutionName}</span>
                  </div>
                  <span className="text-sm font-mono text-blue-400 font-semibold">
                    {parseFloat(account.balance).toLocaleString('de-DE', { minimumFractionDigits: 2 })} {account.currency}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-4">Noch kein Bankkonto verbunden.</p>
            )}
          </div>
        </div>

        {/* ECHTE DATEN: Bitvavo Crypto Assets */}
        <div className="bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <Coins size={24} />
             </div>
             <p className="text-slate-50 text-lg font-semibold italic">Live Crypto Assets</p>
          </div>
          <div className="space-y-3">
              {cryptoLoading ? (
                <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg" />
              ) : (
                cryptoBalances?.map((asset) => (
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
          <div className="absolute -right-4 -top-4 h-16 w-16 bg-orange-500/5 blur-2xl rounded-full" />
        </div>

        {/* Synchronisierte Bank-Aktivitäten */}
        <div className="md:col-span-3 bg-zinc-900/40 border border-slate-800 p-6 rounded-2xl">
           <h3 className="text-lg font-semibold mb-4 text-slate-400">Letzte Kontobewegungen</h3>
           <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto pr-2">
             {allBankTransactions.length ? (
               allBankTransactions.map((tx) => {
                 const isIncome = parseFloat(tx.amount) > 0;
                 return (
                   <div key={tx.id} className="py-3 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                         {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-slate-200 line-clamp-1">{tx.description}</p>
                         <p className="text-[10px] text-slate-500">{tx.accountName} • {new Date(tx.date).toLocaleDateString('de-DE')}</p>
                       </div>
                     </div>
                     <span className={`text-sm font-mono font-semibold ${isIncome ? 'text-emerald-400' : 'text-slate-300'}`}>
                       {parseFloat(tx.amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                     </span>
                   </div>
                 );
               })
             ) : (
               <div className="flex flex-col items-center justify-center h-24 border border-dashed border-slate-800 rounded-xl">
                 <p className="text-slate-600 text-sm italic">Keine Transaktionen synchronisiert.</p>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}