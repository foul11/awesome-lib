import f_printf from '../format/printf';
import { loggers, pretty_message } from '../utils';

const logger_app = loggers.add<unknown>('app', {
    format: f_printf(info => (``
        + `${pretty_message(info)}`
    ).trim(), {
        meta: { label: 'app' },
        sanitize: [],
    }),
});

export default logger_app;