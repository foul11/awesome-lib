/* eslint-disable @stylistic/indent-binary-ops */

import prettyMs from 'pretty-ms';
import f_printf from '../format/printf';

import { color } from '../format/colors';
import { loggers, pretty_message } from '../utils';

const logger_trpc = loggers.add<{
    path?: string | undefined
    ctx?: object | undefined
    input?: object | undefined
    runtime?: number | bigint | undefined
}>('trpc', {
    format: f_printf(info => (``
        + `${info.path
                ? ` ${color('blue', info.path)}`
                : ``
            }`
        + `${info.ctx
                ? ` ${color('gray', JSON.stringify(info.ctx))}`
                : ``
            }`
        + `${info.input
                ? ` ${color('string', JSON.stringify(info.input))}`
                : ``
            }`
        + `${pretty_message(info, { disable_empty: true, prefix: ' ' })}`
        + `${info.runtime
                ? color('ms', ` took ${prettyMs(info.runtime)}`)
                : ``
            }`
    ).trim(), {
        meta: { label: 'trpc' },
        sanitize: [
            'path',
            'ctx',
            'input',
            'runtime',
        ],
    }),
});

export default logger_trpc;