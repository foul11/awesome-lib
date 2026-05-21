import type { IsUndefined } from 'type-fest';

declare module 'logform' {
    type _TransformFunction<T> = (info: TransformableInfo, opts?: T) => TransformableInfo | boolean;
    type _FormatWrap<T> = IsUndefined<T> extends true
        ? (opts?: T) => Format
        : (opts: T | undefined) => Format;
    
    export function format<T>(transform: _TransformFunction<T>): _FormatWrap<T>;
}

declare global {
    interface Console {
        _log?:   (...data: any[]) => void
        _warn?:  (...data: any[]) => void
        _error?: (...data: any[]) => void
        _debug?: (...data: any[]) => void
    }
}