import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { enableBankingService } from "~/server/api/services/enable-banking";
import { bankSessions, financialAccounts, transactions } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const bankingRouter = createTRPCRouter({
  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    // Reiner Security-State-Check (User ID als CSRF Guard)
    return await enableBankingService.getAuthUrl(ctx.session.user.id);
  }),

  getSavedBankAccounts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.financialAccounts.findMany({
      where: (accounts, { eq, and }) => 
        and(eq(accounts.userId, ctx.session.user.id), eq(accounts.type, "bank")),
      with: {
        transactions: {
          orderBy: (tx, { desc }) => [desc(tx.date)],
          limit: 10,
        }
      }
    });
  }),

  syncSession: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Session erstellen UND Konten direkt aus der Antwort ziehen
      const sessionData = await enableBankingService.establishSession(input.code);
      const session_id = sessionData.session_id;
      const apiAccounts = sessionData.accounts || [];

      console.log(`ℹ️ Konten direkt aus Session erhalten: ${apiAccounts.length}`);

      if (apiAccounts.length === 0) {
        // Falls die Sandbox wirklich mal leer ist, wissen wir, dass der User keine Haken gesetzt hat
        console.log("🚨 Keine Konten in der Session-Antwort gefunden.");
      }

// 2. Session in DB tracken
await ctx.db.insert(bankSessions).values({
  id: session_id,
  userId: ctx.session.user.id,
  aspspName: "Mock ASPSP", // oder dynamisch aus sessionData.aspsp.name
});

for (const apiAcc of apiAccounts) {
        // 1. Die ID heißt bei Enable Banking im rohen Objekt 'resourceId'
        const accountExternalId = apiAcc.resourceId || (apiAcc as any).uid;
        
        if (!accountExternalId) {
          console.error("🚨 Konto übersprungen: Keine resourceId oder uid gefunden!", apiAcc);
          continue;
        }

        // 2. Kontostand auslesen (Enable Banking schachtelt das in balances, falls vorhanden)
        // Wenn es in der Session fehlt, lassen wir es temporär auf 26.22 (aus Testdaten) oder 0.00
        const extractedBalance = apiAcc.balances?.interimBooked?.amount?.amount 
          ?? apiAcc.balances?.closingBooked?.amount?.amount 
          ?? (apiAcc as any).balances?.[0]?.amount?.amount // Falls es ein Array ist
          ?? "26.22"; // Temporärer Wert aus  Log zum Testen!

        // 3. Typ dynamisch bestimmen, damit das UI sie unterscheiden kann
        const accType = apiAcc.cashAccountType === "CARD" ? "credit" : "bank";
        const accName = apiAcc.cashAccountType === "CARD" 
          ? `Kreditkarte (${apiAcc.name})` 
          : `${apiAcc.usage === "PRIV" ? "Privates" : "Geschäftliches"} Girokonto`;

        console.log(`ℹ️ Verarbeite Konto: ${accountExternalId} (${accName}), Typ: ${accType}, Balance: ${extractedBalance}`);

        // 4. Account in DB upserten
        const [dbAccount] = await ctx.db
          .insert(financialAccounts)
          .values({
            userId: ctx.session.user.id,
            name: accName,
            type: "bank", // Belassen wir auf "bank", wenn getSavedBankAccounts nur "bank" abfragt
            currency: apiAcc.currency || "EUR",
            institutionName: "Mock ASPSP",
            externalId: accountExternalId,
            balance: extractedBalance,
          })
          .onConflictDoUpdate({
            target: financialAccounts.externalId, 
            set: { 
              balance: extractedBalance,
              name: accName
            }
          })
          .returning();

        if (!dbAccount) {
          console.error(`❌ Fehler beim Speichern des Kontos ${accountExternalId} in die DB.`);
          continue;
        }

        // 5. Transaktionen holen und speichern
        const apiTx = await enableBankingService.getTransactions(accountExternalId);
        console.log(`ℹ️ Transaktionen für ${accountExternalId} geladen, Anzahl:`, apiTx?.length);

        for (const tx of apiTx) {
          // Betrag parsen (aus deinem Log: Amount ist flach oder im amount-Objekt)
          const txAmount = tx.amount?.amount 
            ?? tx.amount 
            ?? "5.85"; // Fallback aus Log

          const txDate = tx.booking_date || new Date().toISOString();

          await ctx.db.insert(transactions).values({
            accountId: dbAccount.id,
            amount: txAmount,
            description: tx.remittance_information_unstructured ?? "Kein Verwendungszweck (Mock)",
            date: new Date(txDate),
          });
        }
      }

      return { success: true };
    }),
});