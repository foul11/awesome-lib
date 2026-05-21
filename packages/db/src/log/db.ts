/* eslint-disable @stylistic/indent-binary-ops */

import { f_printf, color, loggers, pretty_message, pretty_ms } from '@foul11/awesome-log';

const logger_db = loggers.add<{
    query?: string | undefined
    runtime?: number | bigint | undefined
}>('db', {
    format: f_printf(info => (``
        + `${pretty_message(info, { disable_empty: true })}`
        + `${info.query
                ? `\n${info.query}\n`
                : ``
            }`
        + `${info.runtime
                ? color('string', `(runtime: ${color('ms', pretty_ms(info.runtime))})`)
                : ``
            }`
    ).trim(), {
        meta: { label: 'db' },
        sanitize: [
            'query',
            'runtime',
        ],
    }),
});

export default logger_db;