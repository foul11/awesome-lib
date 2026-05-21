import logger_console_log from './predefined/console';

import { inspect } from 'util';
import { pretty_error } from './utils';

import type { AllowedLevels } from './types';

const fabric_console_logger = (lvl: AllowedLevels) => function (...args: any[]) {
    logger_console_log
        .child({ label: 'console.log' })
        .log(lvl, args
            .map(a =>
                pretty_error(a) || inspect(a, { colors: true }),
            )
            .join(' '),
        );
};

let enabled = false;

{
    console._log = console.log;
    console._warn = console.warn;
    console._error = console.error;
    console._debug = console.debug;
}

export function enable() {
    if (enabled)
        return;
    
    enabled = true;
    
    console.log = fabric_console_logger('info');
    console.warn = fabric_console_logger('warn');
    console.error = fabric_console_logger('error');
    console.debug = fabric_console_logger('debug');
}

export function disable() {
    if (!enabled)
        return;
    
    enabled = false;
    
    {
        console.log = console._log!;
        console.warn = console._warn!;
        console.error = console._error!;
        console.debug = console._debug!;
    }
}