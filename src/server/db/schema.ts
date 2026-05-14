import { relations } from "drizzle-orm";
import { index, pgTableCreator, primaryKey, 
	text, 
	varchar,
  	timestamp,
  	numeric,
  	pgEnum}    from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `purrfolio_${name}`);

// Types for accounts
export const accountTypeEnum = pgEnum("account_type", [
  "bank",       // bank account
  "investment", // investment account
  "crypto",    // crypto wallet
]);

// Kategorien für Ausgaben
export const categoryEnum = pgEnum("category", [
  "income", "housing", "food", "transport", "leisure", "crypto_trade", "stock_trade", "other"
]);

export const posts = createTable(
	"post",
	(d) => ({
		id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
		name: d.varchar({ length: 256 }),
		createdById: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => /* @__PURE__ */ new Date())
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("created_by_idx").on(t.createdById),
		index("name_idx").on(t.name),
	],
);

export const users = createTable("user", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.varchar({ length: 255 }),
	email: d.varchar({ length: 255 }).notNull(),
	emailVerified: d
		.timestamp({
			mode: "date",
			withTimezone: true,
		})
		.$defaultFn(() => /* @__PURE__ */ new Date()),
	image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts), // for login
  financialAccounts: many(financialAccounts), // for financial data
}));

export const accounts = createTable(
	"account",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
		provider: d.varchar({ length: 255 }).notNull(),
		providerAccountId: d.varchar({ length: 255 }).notNull(),
		refresh_token: d.text(),
		access_token: d.text(),
		expires_at: d.integer(),
		token_type: d.varchar({ length: 255 }),
		scope: d.varchar({ length: 255 }),
		id_token: d.text(),
		session_state: d.varchar({ length: 255 }),
	}),
	(t) => [
		primaryKey({ columns: [t.provider, t.providerAccountId] }),
		index("account_user_id_idx").on(t.userId),
	],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
	"session",
	(d) => ({
		sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const financialAccounts = createTable("financial_account", (t) => ({
  id: t.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: t.varchar({ length: 255 }).notNull().references(() => users.id),
  name: t.varchar({ length: 256 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  currency: t.varchar({ length: 3 }).notNull().default("EUR"),
  institutionName: t.varchar({ length: 256 }),
  externalId: t.varchar({ length: 256 }),
  createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
}));

export const transactions = createTable("transaction", (t) => ({
  id: t.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: t.varchar({ length: 255 }).notNull().references(() => financialAccounts.id),
  amount: t.numeric({ precision: 15, scale: 2 }).notNull(),
  description: t.text().notNull(),
  date: t.timestamp({ withTimezone: true }).notNull(),
  category: categoryEnum("category").default("other"),
}));

export const holdings = createTable("holding", (t) => ({
  id: t.varchar({ length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: t.varchar({ length: 255 }).notNull().references(() => financialAccounts.id),
  symbol: t.varchar({ length: 20 }).notNull(),
  quantity: t.numeric({ precision: 20, scale: 10 }).notNull(),
  averageBuyPrice: t.numeric({ precision: 15, scale: 2 }),
  updatedAt: t.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const financialAccountRelations = relations(financialAccounts, ({ one, many }) => ({
  user: one(users, { fields: [financialAccounts.userId], references: [users.id] }),
  transactions: many(transactions),
  holdings: many(holdings),
}));