/* eslint-disable @stylistic/indent-binary-ops */

import { f_printf, color, pretty_message, pretty_ms } from '@foul11/awesome-log';
import type { LoggerContainer, LoggerContainerExtendLoggers } from '@foul11/awesome-log';

export const extend_logger_db = <T extends LoggerContainer>(loggers: T) => {
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
    
    return loggers as unknown as LoggerContainerExtendLoggers<T, {
        ['db']: typeof logger_db
    }>;
};
