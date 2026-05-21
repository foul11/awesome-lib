/* eslint-disable @stylistic/indent-binary-ops */

import { f_printf, color, loggers, pretty_message, pretty_ms } from '@foul11/awesome-log';
import type { AccessLogStoreData } from '../tables/AccessLog';

const logger_access_log = loggers.add<{
    data?: AccessLogStoreData | undefined
    runtime?: number | bigint | undefined
}>('access_log', {
    format: f_printf(info => (``
        + `${pretty_message(info, { disable_empty: true })}`
        + `${info.runtime
                ? color('ms', ` took ${pretty_ms(info.runtime).padStart(11, ' ')}`)
                : ' '.repeat(6 + 11)
            }`
        + `${info.data
                ? ` (${color('string', `'${info.data.action}'`)}, total: ${color('ms', pretty_ms(info.data.timings.total / 1e6).padStart(11, ' '))})`
                : ``
            }`
    ).trim(), {
        meta: { label: 'access_log' },
        sanitize: [
            'data',
            'runtime',
        ],
    }),
});

export default logger_access_log;
