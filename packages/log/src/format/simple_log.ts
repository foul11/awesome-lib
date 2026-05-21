import winston from 'winston';

import { MESSAGE } from 'triple-beam';
import { color } from './colors';

interface FLogPrintfOptions {
    format: winston.Logform.Format
}

const f_simple_log = winston.format<FLogPrintfOptions>((p, opts) => {
    const info = opts
        ? opts.format.transform(p, opts)
        : p;
    
    if (typeof info == 'boolean')
        return info;
    
    const m_timestamp = p.timestamp as string | undefined;
    const m_filename  = p.file as string | undefined;
    const m_label     = p.label as string | undefined;
    const m_level     = p.level;
    const m_message   = info[MESSAGE] as string;
    const m_ms        = p.ms as string | undefined;
    
    info[MESSAGE] = [
        (m_timestamp ? color('timestamp', m_timestamp)  + ' '  : ''),
        (m_label     ? color('label', `[${m_label}]`)   + ' '  : ''),
        (m_filename  ? color('filename', m_filename)    + ' '  : ''),
        (               m_level                          + ': '    ),
        (               m_message                        + '\t'    ),
        (m_ms        ? color('ms', m_ms)                + ' '  : ''),
    ].join('');
    
    return info;
});

export default f_simple_log;