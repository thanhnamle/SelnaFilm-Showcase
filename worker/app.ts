import type { Context } from 'hono';

/** Hono typing shared by the routes and the gate. */
export type App = { Bindings: Env; Variables: { email?: string } };
export type AppContext = Context<App>;
