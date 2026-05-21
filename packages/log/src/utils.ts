import winston from 'winston';
import transport from 'winston-transport';

import f_colors, { color } from './format/colors';
import f_pretty_log from './format/pretty_log';
import f_file from './format/file';
import f_ms from './format/ms';
import f_labels from './format/labels';

import { isDev } from '@foul11/awesome';
import { get_curr_level } from './env';
import { inspect } from 'util';

import type { AllowedLevels, Logger, LoggerContainer } from './types';
import type { Constructor } from 'type-fest';
import type { InspectOptions } from 'util';

const { combine: f_combine, timestamp: f_timestamp } = winston.format;

type TransportFilter =
    | Constructor<winston.transport>
    | ((transport: winston.transport) => boolean);

function isTransportConstructor(value: any): value is Constructor<winston.transport> {
    return typeof value === 'function' && value.prototype instanceof transport;
}

export function set_logger_level(logger: winston.Logger | Logger<any>, new_level: AllowedLevels, filter?: TransportFilter) {
    if (typeof filter === 'undefined') {
        filter = () => true;
    }
    
    if (isTransportConstructor(filter)) {
        filter = t => t instanceof transport;
    }
    
    for (const t of logger.transports) {
        if (filter(t)) {
            t.level = new_level;
        }
    }
}

export const loggers = new winston.Container({
    levels: winston.config.npm.levels,
    transports: [
        new winston.transports.Console({
            forceConsole: true,
            level: get_curr_level(winston.config.npm.levels),
            format: f_combine(
                ...isDev() ? [
                    f_timestamp(),
                    f_ms(),
                ] : [],
                
                f_file({ start_frame: 10 }),
                f_colors(),
                f_labels({ label: 'global' }),
                f_pretty_log(),
            ),
        }),
    ],
}) as LoggerContainer;

export const pretty_error = (err: any, opts?: InspectOptions) => {
    if (typeof err === 'object'         && 'message' in err &&
        typeof err.message === 'object' && 'stack'   in err.message
    ) {
        err = err.message;
    }
    
    if (err instanceof Error) {
        // FIXME: Проверить, и не пытаться очищать остальные поля ошибки, потому что теряется контекст, error: type, errno, code
        // const new_err = new Error(err.message, {
        //     cause: err.cause,
        // });
        
        // new_err.stack = err.stack!;
        // new_err.name = err.name;
        
        return inspect(err, { colors: true, ...opts });
    }
    
    return undefined;
};

interface PrettyMessageOptions {
    disable_empty?: boolean
    prefix?: string
    suffix?: string
}

function format_message(msg: string, opts?: Pick<PrettyMessageOptions, 'prefix' | 'suffix'>) {
    return [ opts?.prefix, msg, opts?.suffix ].filter(Boolean).join('');
}

export const pretty_message = (info: any, opts?: InspectOptions & PrettyMessageOptions) => {
    const err = pretty_error(info, opts);
    
    if (err)
        return format_message(err, opts);
    
    if (typeof info.message === 'string') {
        return format_message(info.message, opts);
    }
    
    if (opts?.disable_empty && info.message === undefined) {
        return ``;
    }
    
    return format_message(
        inspect(info.message, { colors: true, ...opts }),
        opts
    );
};

export const version_to_string = (version: { Version?: string | undefined, DateUTC?: string | undefined, CommitHash?: string | undefined }) => {
    const format_date = (utc: string) =>
        new Date(utc)
            .toISOString()
            .replaceAll(/T|\.\d{3}Z/gi, ' ')
            .trim();
    
    return ``
        + (version.DateUTC ? `build: ${color('date', format_date(version.DateUTC))}; ` : '')
        + (version.Version ? `version: ${color('number', version.Version)}; ` : '')
        + (version.CommitHash ? `from commit: ${color('string', version.CommitHash)}` : '');
};