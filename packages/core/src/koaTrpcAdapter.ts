import { nodeHTTPRequestHandler } from '@trpc/server/adapters/node-http';

import type { AnyRouter } from '@trpc/server';
import type {
    NodeHTTPCreateContextFnOptions,
    NodeHTTPHandlerOptions,
} from '@trpc/server/adapters/node-http';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Middleware } from 'koa';

declare module 'koa' {
    interface Request {
        body?: any
    }
}

declare module 'http' {
    interface IncomingMessage {
        body?: any
    }
    
    interface ServerResponse {
        body?: any
    }
}

export type CreateTrpcKoaContextOptions = NodeHTTPCreateContextFnOptions<
    IncomingMessage,
    ServerResponse<IncomingMessage>
>;
export type AdditionalMiddlewareOpts = { prefix?: `/${string}` };
export type CreateKoaMiddlewareOptions<TRouter extends AnyRouter> = NodeHTTPHandlerOptions<
    TRouter,
    IncomingMessage,
    ServerResponse<IncomingMessage>
> & AdditionalMiddlewareOpts;

export default function koaTrpc<TRouter extends AnyRouter>(
    opts: CreateKoaMiddlewareOptions<TRouter>,
): Middleware {
    return async (ctx, next) => {
        const { prefix } = opts;
        const { req, res, request } = ctx;
        
        if (prefix && !request.path.startsWith(prefix))
            return next();
        
        // put parsed body (by koa-bodyparser/@koa/bodyparser for example)
        // where nodeHTTPRequestHandler will look for it.
        // https://github.com/BlairCurrey/trpc-koa-adapter/issues/24
        if ('body' in request) {
            req.body = request.body;
        }
        
        // koa uses 404 as a default status but some logic in
        // nodeHTTPRequestHandler assumes default status of 200.
        // https://github.com/trpc/trpc/blob/abc941152b71ff2d68c63156eb5a142174779261/packages/server/src/adapters/node-http/nodeHTTPRequestHandler.ts#L63
        res.statusCode = 200;
        
        return await nodeHTTPRequestHandler({
            ...opts,
            req,
            res,
            path: request.path.slice((prefix?.length ?? 0) + 1),
        });
    };
}