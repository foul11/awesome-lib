import winston from 'winston';
import pretty_ms from 'pretty-ms';

import { loggers, set_logger_level, pretty_error, pretty_message, version_to_string } from './utils';
import { enable as enable_console_hook, disable as disable_console_hook } from './console.log';
import { is_console_caller } from './env';

import f_colors, { color } from './format/colors';
import f_pretty_log from './format/pretty_log';
import f_printf from './format/printf';
import f_file from './format/file';
import f_ms from './format/ms';
import f_labels from './format/labels';
import f_simple_log from './format/simple_log';

import './predefined/app';
import './predefined/console';
import './predefined/http';
import './predefined/tg';
import './predefined/trpc';

import type logger_app from './predefined/app';
import type logger_console from './predefined/console';
import type logger_http from './predefined/http';
import type logger_tg from './predefined/tg';
import type logger_trpc from './predefined/trpc';

import type { LoggerContainer } from './types';

const { combine: f_combine, timestamp: f_timestamp } = winston.format;

const typed_loggers = loggers as LoggerContainer<{
    ['app']: typeof logger_app
    ['console']: typeof logger_console
    ['http']: typeof logger_http
    ['tg']: typeof logger_tg
    ['trpc']: typeof logger_trpc
}>;

if (is_console_caller()) {
    enable_console_hook();
}

export type {
    LoggerContainer,
    LoggerContainerExtendLoggers,
    LoggerContainerInferLoggers,
    LoggerContainerInferLogger,
} from './types';

export {
    f_colors,
    f_pretty_log,
    f_file,
    f_labels,
    f_ms,
    f_printf,
    f_simple_log,
    f_combine,
    f_timestamp,
    
    color,
    set_logger_level,
    pretty_error,
    pretty_message,
    version_to_string,
    
    typed_loggers as loggers,
    
    enable_console_hook,
    disable_console_hook,
    
    pretty_ms,
};