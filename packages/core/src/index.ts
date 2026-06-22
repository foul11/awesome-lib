export * from './envSchema';
export * from './dateParser';
export * from './EventManager';
export * from './requireDContext';

export const regex = (function init_once() {
    const cleanup_regexp = /(?<!\\)(?:\\{2})*[\[\]]|\s+|\/\/[^\r\n]*(?:\r?\n|$)/g;
    // const cleanup_regexp = /(?<!\\)[\[\]]|\s+|\/\/[^\r\n]*(?:\r?\n|$)/g
    return function first_parameter(pattern: any) {
        return function second_parameter(flags: any) {
            flags = flags.raw[0].trim();
            let in_character_class = false;
            const compressed = pattern.raw[0].replace(
                cleanup_regexp,
                function on_each_match(match: any) {
                    // switch (match) {
                    switch (match.replaceAll('\\', '')) {
                        case '[': in_character_class = true; return match;
                        case ']': in_character_class = false; return match;
                        default: return in_character_class ? match : '';
                    }
                },
            );
            return flags ? new RegExp(compressed, flags) : new RegExp(compressed);
        };
    };
})();

type ObjectEntry<T> = { [K in keyof T]-?: [K, T[K]] }[keyof T];
type ObjectEntries<T> = ObjectEntry<T>[];

export function Object_entries<T extends Record<string, any>>(obj: T) {
    return Object.entries(obj) as ObjectEntries<T>;
}

export function Object_fromEntries<K extends PropertyKey, V>(obj: Iterable<[K, V]>) {
    return Object.fromEntries(obj) as { [Key in K]: V };
}

export function Object_keys<T extends Record<string, any>>(obj: T) {
    return Object.keys(obj) as unknown as (keyof T)[];
}

export function array_chunk<T>(array: T[], size: number) {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
        array.slice(i * size, i * size + size),
    );
}

export function Object_groupBy<K extends PropertyKey, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
): Partial<Record<K, T[]>> {
    if (Object.groupBy)
        return Object.groupBy(items, keySelector);
    
    return Array.from(items).reduce((acc, item, index) => {
        const key = keySelector(item, index);
        const collection = acc[key];
        
        if (!collection) {
            acc[key] = [ item ];
        } else {
            collection.push(item);
        }
        
        return acc;
    }, Object.create(null));
}

type StringSnakeToCamel<S> =
    S extends `${infer T}_${infer U}_${infer V}`
        ? `${T}${Capitalize<U>}${Capitalize<StringSnakeToCamel<V>>}`
        : S extends `${infer T}_${infer U}`
            ? `${T}${Capitalize<StringSnakeToCamel<U>>}`
            : S;

type ObjectSnakeToCamel<O> = O extends object ? {
    [K in keyof O as StringSnakeToCamel<K>]: O[K]
} : O;

export function object_snake_to_camel<
    Input extends Record<string, unknown> | null | undefined,
>(obj: Awaited<Input>): ObjectSnakeToCamel<Input> {
    if (!obj)
        return obj as any;
    
    return Object.fromEntries(
        Object
            .entries(obj)
            .map(([ key, value ]) => ([
                key.replace(/(_\w)/g, m => m[1].toUpperCase()),
                value,
            ])),
    ) as any;
}

type StringCamelToSnake<S> =
    S extends `${infer T}${infer U}`
        ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${StringCamelToSnake<U>}`
        : S;
        
type ObjectCamelToSnake<O> = O extends object ? {
    [K in keyof O as StringCamelToSnake<K>]: O[K]
} : O;

export function object_camel_to_snake<
    Input extends Record<string, unknown> | null | undefined,
>(obj: Awaited<Input>): ObjectCamelToSnake<Input> {
    if (!obj)
        return obj as any;
    
    return Object.fromEntries(
        Object
            .entries(obj)
            .map(([ key, value ]) => ([
                key.replace(/([A-Z])/g, m => `_${m.toLowerCase()}`),
                value,
            ])),
    ) as any;
}

export function isTrue(value: any, def = false) {
    if (value === true)
        return true;
    
    if (typeof value === 'string') {
        if (/t(rue)?|y(es)?/i.test(value))
            return true;
        
        if (/f(alse)?|n(o)?/i.test(value))
            return false;
    }
    
    return def;
}

export function isWebpack() {
    if (isTrue(process.env.FLEXILIB_DISABLE_WEBPACK)) {
        return false;
    }
    
    // @ts-expect-error check is webpack, undefined if not
    return typeof __webpack_require__ !== 'undefined';
}

export function isDev() {
    return !!(process.env.NODE_ENV?.toLowerCase()?.slice(0, 3) === 'dev');
}