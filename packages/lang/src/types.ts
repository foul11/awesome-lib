import type { Simplify } from 'type-fest';

// from type-fest/source/internal/object
    type IsNull<T> = [T] extends [null] ? true : false;
    type IsUnknown<T> = (
        unknown extends T
            ? IsNull<T> extends false
                ? true
                : false
            : false
    );
    type IsAny<T> = 0 extends 1 & NoInfer<T> ? true : false;
    type BaseKeyFilter<Type, Key extends keyof Type> = Key extends symbol
        ? never
        : Type[Key] extends symbol
            ? never
            : Type[Key] extends Record<string, unknown>
                ? Key
                : [(...arguments_: any[]) => any] extends [Type[Key]]
                    ? never
                    : Key;
    type FilterOptionalKeys<T extends object> = Exclude<
        {
            [Key in keyof T]: IsAny<T[Key]> extends true
                ? never
                : undefined extends T[Key]
                    ? T[Key] extends undefined
                        ? never
                        : BaseKeyFilter<T, Key>
                    : never;
        }[keyof T],
        undefined
    >;
    type FilterDefinedKeys<T extends object> = Exclude<
        {
            [Key in keyof T]: IsAny<T[Key]> extends true
                ? Key
                : IsUnknown<T[Key]> extends true ? Key : undefined extends T[Key]
                    ? never
                    : T[Key] extends undefined
                        ? never
                        : BaseKeyFilter<T, Key>;
        }[keyof T],
        undefined
    >;

    export type UndefinedToOptional<T extends object> = Simplify<
        {
            [Key in keyof Pick<T, FilterDefinedKeys<T>>]: T[Key];
        } & {
            [Key in keyof Pick<T, FilterOptionalKeys<T>>]?: Exclude<T[Key], undefined>;
        }
    >;
// end type-fest/source/internal/object