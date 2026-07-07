import type winston from 'winston';
import type * as Transport from 'winston-transport';
import type * as logform from 'logform';
import type { OmitIndexSignature } from 'type-fest';

export type AllowedLevels = keyof OmitIndexSignature<winston.config.NpmConfigSetLevels>;

type LatentMsg = any;

interface LogMethod<MetaObj> {
    (level: AllowedLevels, message: LatentMsg, ...meta: MetaObj[]): winston.Logger
    (entry: MetaObj): winston.Logger
    (level: AllowedLevels, message: LatentMsg): winston.Logger
}

interface LeveledLogMethod<MetaObj> {
    (message: LatentMsg, ...meta: MetaObj[]): winston.Logger
    (entry: MetaObj): winston.Logger
    (message: LatentMsg): winston.Logger
}

interface Profiler<MetaObj> {
    logger: Logger<MetaObj>
    start: number
    done(info?: MetaObj): boolean
}

type OmitLoggerMethods =
    | 'log'
    | 'error'
    | 'warn'
    | 'help'
    | 'data'
    | 'info'
    | 'debug'
    | 'prompt'
    | 'http'
    | 'verbose'
    | 'input'
    | 'silly'
    | 'emerg'
    | 'alert'
    | 'crit'
    | 'warning'
    | 'notice'
    | 'startTimer'
    | 'profile'
    | 'child';

type InferLoggerMeta<T> = T extends Logger<infer Meta> ? Meta : DefMeta;

export interface Logger<
    InstMeta,
> extends Omit<winston.Logger, OmitLoggerMethods> {
    defaultMeta?: InstMeta
    
    log: LogMethod<InstMeta>
    
    error: LeveledLogMethod<InstMeta>
    warn: LeveledLogMethod<InstMeta>
    help: LeveledLogMethod<InstMeta>
    data: LeveledLogMethod<InstMeta>
    info: LeveledLogMethod<InstMeta>
    debug: LeveledLogMethod<InstMeta>
    prompt: LeveledLogMethod<InstMeta>
    http: LeveledLogMethod<InstMeta>
    verbose: LeveledLogMethod<InstMeta>
    input: LeveledLogMethod<InstMeta>
    silly: LeveledLogMethod<InstMeta>

    emerg: LeveledLogMethod<InstMeta>
    alert: LeveledLogMethod<InstMeta>
    crit: LeveledLogMethod<InstMeta>
    warning: LeveledLogMethod<InstMeta>
    notice: LeveledLogMethod<InstMeta>
    
    
    startTimer(): Profiler<InstMeta>
    profile(id: string | number, meta?: InstMeta): this
    
    child(options: InstMeta): this
}


type TransformFunction<Meta> = (info: Meta, opts?: unknown) => winston.Logform.TransformableInfo | boolean;

export declare class Format<Meta> {
    constructor(opts?: object);
    
    options?: object;
    transform: TransformFunction<Meta>;
}

interface LoggerOptions<T> {
    levels?: winston.config.AbstractConfigSetLevels
    silent?: boolean
    format?: Format<T>
    level?: string
    exitOnError?: (err: Error) => void | boolean
    defaultMeta?: any
    transports?: Transport[]
    handleExceptions?: boolean
    handleRejections?: boolean
    exceptionHandlers?: any
    rejectionHandlers?: any
}

type OmitContainerMethods =
    | 'add'
    | 'get'
    | 'has'
    | 'close';
    
export interface TransformableInfo extends logform.TransformableInfo {
    message: string
    stack?: string
    cause?: Error
}

export interface DefMeta {
    file?:   string | boolean
    label?:  string | number
    label1?: string | number
    label2?: string | number
    label3?: string | number
    label4?: string | number
    label5?: string | number
}

export interface LoggerContainer<
    Loggers extends { [key: string]: Logger<any> } = Record<string, any>,
> extends Omit<winston.Container, OmitContainerMethods> {
    add<
        LoggerKey extends keyof Loggers,
    >(
        id: LoggerKey,
        options?: LoggerOptions<
            &   TransformableInfo
            &   ([LoggerKey] extends [never]
                    ? DefMeta
                    : InferLoggerMeta<Loggers[LoggerKey]>)
        >,
    ): Loggers[LoggerKey]
    
    add<
        Meta,
        TLogger extends Logger<
            & Meta
            & DefMeta
            & Partial<TransformableInfo>
        > = Logger<
            & Meta
            & DefMeta
            & Partial<TransformableInfo>
        >,
    >(
        id: string,
        options?: LoggerOptions<
            & TransformableInfo
            & InferLoggerMeta<TLogger>
        >,
    ): TLogger
    
    get<LoggerKey extends keyof Loggers>(id: LoggerKey): Loggers[LoggerKey]
    has(id: keyof Loggers): boolean
    close(id?: keyof Loggers): void
}

export type LoggerContainerExtendLoggers<
    Container extends LoggerContainer<any>,
    Loggers extends { [key: string]: Logger<any> },
> = Container extends LoggerContainer<infer OldLoggers>
    ? LoggerContainer<OldLoggers & Loggers>
    : never;

export type LoggerContainerInferLoggers<
    Container extends LoggerContainer<any>,
> = Container extends LoggerContainer<infer Loggers>
    ? Loggers
    : never;

export type LoggerContainerInferLogger<
    Container extends LoggerContainer<any>,
    LoggerKey extends
        Container extends LoggerContainer<infer Loggers>
            ? keyof Loggers
            : never,
> = Container extends LoggerContainer<infer Loggers>
    ? Loggers[LoggerKey]
    : never;