import type { Context, Middleware } from 'telegraf';

export type MatchedMiddleware<
  C extends Context,
> = Middleware<C & { match: RegExpExecArray }>;

export const toMatchedMiddleware = <
    C extends Context,
>(ctx: C): C & { match: RegExpExecArray } => {
    (ctx as any).match = (ctx as any).match || [];
    return ctx as any;
};