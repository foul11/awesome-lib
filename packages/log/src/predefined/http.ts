/* eslint-disable @stylistic/indent-binary-ops */

import prettyMs from 'pretty-ms';

import f_printf from '../format/printf';
import { color } from '../format/colors';

import { loggers, pretty_message } from '../utils';

const logger_http = loggers.add<{
    runtime?: number | bigint | undefined
    status?: number | undefined
    method?: string | undefined
    user?: Record<string, any> | undefined
    url?: string | undefined
}>('http', {
    format: f_printf(info => (``
        + `${info.status
                ? `${(() => {
                    switch (Math.floor(info.status / 1e2)) {
                        case 1: return  color('cyan',   info.status.toString());
                        case 2: return  color('green',  info.status.toString());
                        case 3: return  color('yellow', info.status.toString());
                        default: return color('red',    info.status.toString());
                    }
                })()}`
                : ``
            }`
        + `${info.method
                ? ` ${color('text', info.method)}`
                : ``
            }`
        + `${info.runtime
                ? `\ttook ${color('ms', prettyMs(info.runtime))}`
                : ``
            }`
        + `${info.url
                ? `\t${color('string', info.url)}`
                : ``
            }`
        + `${info.user
                ? `\t${color('gray', JSON.stringify(info.user))}`
                : ``
            }`
        + `${pretty_message(info, { disable_empty: true, prefix: '\n' })}`
    ).trim(), {
        meta: { label: 'http' },
        sanitize: [
            'runtime',
            'status',
            'method',
            'user',
            'url',
        ],
    }),
});

export default logger_http;