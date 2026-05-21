import winston from 'winston';
import { MESSAGE } from 'triple-beam';
import type { Format } from '../types';

interface FPrintfOptions {
    sanitize?: string[]
    meta?: Record<string, any>
}

function f_printf<
    T extends Record<string, any>,
>(
    templateFunction: (info: T) => string,
    printf_opts?: FPrintfOptions,
): Format<T> {
    return winston.format<FPrintfOptions>((info, opts) => {
        info[MESSAGE] = templateFunction(info as any);
        
        if (opts?.sanitize) {
            for (const key of opts.sanitize) {
                delete info[key];
            }
        }
        
        if (opts?.meta) {
            Object.assign(info, opts.meta);
        }
        
        return info;
    })(printf_opts) as any;
}

export default f_printf;