import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import crypto from "crypto";

// --- Typen für TypeScript ---
interface BitvavoBalance {
  symbol: string;
  available: string;
  inOrder: string;
}

interface BitvavoTicker {
  market: string;
  price: string;
}

export const financeRouter = createTRPCRouter({
  getBitvavoBalances: protectedProcedure.query(async () => {
    
    // Hilfsfunktion für sichere Bitvavo-Aufrufe
    const fetchFromBitvavo = async (endpoint: string) => {
      const timestamp = Date.now().toString();
      const method = "GET";
      const signatureString = timestamp + method + endpoint;
      const signature = crypto
        .createHmac("sha256", env.BITVAVO_API_SECRET)
        .update(signatureString)
        .digest("hex");

      const response = await fetch(`https://api.bitvavo.com${endpoint}`, {
        headers: {
          "Bitvavo-Access-Key": env.BITVAVO_API_KEY,
          "Bitvavo-Access-Signature": signature,
          "Bitvavo-Access-Timestamp": timestamp,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Bitvavo API Error on ${endpoint}: ${response.statusText}`);
      }
      return response.json();
    };

    try {
      // 1. Beide Endpunkte abrufen (Bestände & Preise)
      const balances = (await fetchFromBitvavo("/v2/balance")) as BitvavoBalance[];
      const tickers = (await fetchFromBitvavo("/v2/ticker/price")) as BitvavoTicker[];

      // 2. Leere Bestände herausfiltern
      const activeBalances = balances.filter(b => parseFloat(b.available) > 0);

      // 3. Bestände mit EUR-Preisen verknüpfen
      const withValues = activeBalances.map(asset => {
        // Bei EUR-Beständen (Fiat) ist der Preis logischerweise 1
        if (asset.symbol === "EUR") {
          const amount = parseFloat(asset.available);
          return {
            symbol: asset.symbol,
            available: asset.available,
            priceEur: 1,
            valueEur: amount
          };
        }

        // Suche den passenden Ticker (z.B. "BTC-EUR")
        const priceData = tickers.find(t => t.market === `${asset.symbol}-EUR`);
        const price = priceData ? parseFloat(priceData.price) : 0;
        const amount = parseFloat(asset.available);
        
        return {
          symbol: asset.symbol,
          available: asset.available,
          priceEur: price,
          valueEur: amount * price
        };
      });

      // 4. (Optional) Nach höchstem Euro-Wert absteigend sortieren
      return withValues.sort((a, b) => b.valueEur - a.valueEur);

    } catch (error) {
      console.error("Finance Router Error:", error);
      return [];
    }
  }),
});