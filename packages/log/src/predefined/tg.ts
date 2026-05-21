/* eslint-disable @stylistic/indent-binary-ops */

import prettyMs from 'pretty-ms';
import f_printf from '../format/printf';

import { color } from '../format/colors';
import { loggers, pretty_message } from '../utils';

const logger_tg = loggers.add<{
    type?: string | undefined
    user?: string | number | undefined
    username?: string | undefined
    runtime?: number | bigint | undefined
}>('tg', {
    format: f_printf(info => (``
        + `${info.user || info.username ? '(' : ''}`
        + `${info.username
                ? `@${color('blue', info.username)}`
                : ``
            }`
        + `${info.user && info.username ? ', ' : ''}`
        + `${info.user
                ? color('label', info.user.toString())
                : ''
            }`
        + `${info.user || info.username ? ') ' : ''}`
        + `${info.type ? `${color('cyan', info.type)}: ` : ''}`
        + `${pretty_message(info, { disable_empty: true, prefix: ' ' })}`
        + `${info.runtime
                ? color('ms', ` took ${prettyMs(info.runtime)}`)
                : ``
            }`
    ).trim(), {
        meta: { label: 'tg' },
        sanitize: [
            'type',
            'user',
            'username',
            'runtime',
        ],
    }),
});

export default logger_tg;