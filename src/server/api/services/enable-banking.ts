import { env } from "~/env";
import jwt from "jsonwebtoken";

export interface EnableBankingAccount {
  resourceId: string;
  name?: string;
  usage?: string;
  cashAccountType?: string;
  uid: string;
  title: string;
  currency: string;
  balances: {
    interimBooked?: { amount: { amount: string } };
    closingBooked?: { amount: { amount: string } };
  };
}

export interface EnableBankingTransaction {
  uid: string;
  booking_date: string;
  amount: { amount: string };
  remittance_information_unstructured?: string;
}

class EnableBankingService {
  private getAuthHeader(): string {
    const now = Math.floor(Date.now() / 1000);
    // Verarbeitet Newlines im Private Key korrekt
    const privateKey = env.ENABLE_BANKING_PRIVATE_KEY.replace(/\\n/g, "\n");

    const token = jwt.sign(
      {
        iss: "enablebanking.com",
        aud: "api.enablebanking.com",
        iat: now,
        exp: now + 300,
      },
      privateKey,
      { 
        algorithm: "RS256", 
        keyid: env.ENABLE_BANKING_APP_ID 
      }
    );

    return `Bearer ${token}`;
  }

async getAuthUrl(state: string): Promise<string> {
    const response = await fetch("https://api.enablebanking.com/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Application-Id": env.ENABLE_BANKING_APP_ID,
        "Authorization": this.getAuthHeader(),
      },
     body: JSON.stringify({
  access: { 
    // balances und transactions müssen Booleans sein
    balances: true, 
    transactions: true,
    // Die Scopes lassen wir zur Sicherheit als Fallback drin
    scopes: ["balances", "transactions"],
    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() 
  },
  aspsp: { 
    name: "Mock ASPSP",
    country: "FI"       
  },
  state: state,
  redirect_url: env.ENABLE_BANKING_REDIRECT_URI,
}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 ENABLE BANKING DETAIL-FEHLER:", errorText);
      throw new Error(`Enable Banking Auth Error: ${response.statusText}`);
    }

    const data = await response.json() as { url: string };
    return data.url;
  }

  async establishSession(code: string) {
    const response = await fetch("https://api.enablebanking.com/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this.getAuthHeader(),
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Failed to establish session");
    }

    // 💡 Die API liefert hier { session_id: "...", accounts: [...], aspsp: {...} }
    const data = await response.json() as { 
      session_id: string; 
      accounts: EnableBankingAccount[];
    };
    
    console.log("🎉 SESSION DATA EMPFANGEN. Konten gefunden:", data.accounts?.length || 0);
    
    // Wir geben das komplette Objekt zurück, nicht nur die ID!
    return data; 
  }

// In src/server/api/services/enable-banking.ts
  async getTransactions(accountId: string): Promise<EnableBankingTransaction[]> {
    const response = await fetch(`https://api.enablebanking.com/accounts/${accountId}/transactions`, {
      headers: { 
        "Authorization": this.getAuthHeader(), 
      },
    });
    
    if (!response.ok) return [];
    const data = await response.json() as { transactions: EnableBankingTransaction[] };
    return data.transactions;
  }
}

export const enableBankingService = new EnableBankingService();