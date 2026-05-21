import { postRouter } from "~/server/api/routers/post";
import { financeRouter } from "~/server/api/routers/finance";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { bankingRouter } from "~/server/api/routers/banking";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	post: postRouter,
	finance: financeRouter,
	banking: bankingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
