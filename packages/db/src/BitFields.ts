/* eslint-disable @typescript-eslint/no-use-before-define */
import { ErrorFlagPack, ErrorFlagUnpack } from './Error';

import type { DrainOuterGeneric } from 'kysely';
import type { IntRange } from 'type-fest';

type RecursiveChangeType<T, T_FROM, T_TO> = DrainOuterGeneric<{
    [K in keyof T]: T[K] extends T_FROM
        ? T_TO
        : (
            T[K] extends Record<string, any>
                ? RecursiveChangeType<T[K], T_FROM, T_TO>
                : never
        );
}>;

type RecursiveObject<T, FIELD_TYPE> = DrainOuterGeneric<{
    [K in keyof T]:
        | RecursiveObject<T[K], FIELD_TYPE>
        | FIELD_TYPE;
}>;

type RecursiveUndefinedToOptional<T> = DrainOuterGeneric<{
    [K in keyof T]?: RecursiveUndefinedToOptional<T[K]>;
}>;

type Guarded<F> =
    F extends (x: any) => x is infer T ? T : never;

export type BitFieldsScheme<
    Range extends IntRange<0, 52> = Guarded<typeof BitFields['isValidField']>,
> = RecursiveObject<
    { [key: string]: any },
    Range
>;

export type BitFieldsUnpack<T extends BitFieldsScheme> = (
    RecursiveUndefinedToOptional<
        RecursiveChangeType<T, number, boolean | undefined>
    >
);

function unpack<
    BIT_SCHEME extends BitFieldsScheme,
    BIT_UNPACK,
>(flags: number, from: BIT_SCHEME): BIT_UNPACK {
    const to: any = {};
    
    for (const [ key, val ] of Object.entries(from)) {
        switch (true) {
            case typeof val == 'number':
                if (!BitFields.isValidField(val))
                    throw new ErrorFlagUnpack(`Out of range: pos {${val as any}}`);
                to[key] = BitFields.getBit(flags, val);
                break;
            
            case typeof val == 'object':
                to[key] = unpack(flags, val as any);
                break;
            
            default:
                throw new ErrorFlagUnpack(`Invalid type {${typeof val}}`);
        }
    }
    
    return to;
}
    
function pack<
    BIT_SCHEME extends BitFieldsScheme,
    BIT_UNPACK extends BitFieldsUnpack<BIT_SCHEME>,
>(flags: Partial<BIT_UNPACK>, to: number, from: BIT_SCHEME): number {
    for (const [ key, val ] of Object.entries(from)) {
        switch (true) {
            case typeof val == 'number':
                if (flags && key in flags) {
                    if (!BitFields.isValidField(val))
                        throw new ErrorFlagUnpack(`Out of range: pos {${val as any}}`);
                    to = BitFields.setBit((flags as any)[key], val, to);
                }
                break;
                
            case typeof val == 'object':
                if (flags && key in flags) {
                    to = pack((flags as any)[key], to, val as any);
                }
                break;
                
            default:
                throw new ErrorFlagPack(`Invalid type {${typeof val}}`);
        }
    }
    
    return to;
}

    
function toFlat<
    BIT_SCHEME extends BitFieldsScheme,
    INPUT extends (
        | BIT_SCHEME
        | BitFieldsUnpack<BIT_SCHEME>
    ),
>(flags: INPUT, paths: string[] = []): string[] {
    const out: string[] = [];
    
    for (const [ key, val ] of Object.entries(flags)) {
        switch (true) {
            case typeof val == 'object':
                out.push(...toFlat(val, [ ...paths, key ]));
                break;
            
            case typeof val == 'number':
            case typeof val == 'boolean' && val:
                out.push([ ...paths, key ].join('.'));
                break;
        }
    }
    
    return out;
}

export class BitFields<
    BIT_SCHEME extends BitFieldsScheme,
    BIT_UNPACK extends BitFieldsUnpack<BIT_SCHEME> = BitFieldsUnpack<BIT_SCHEME>,
> {
    bitScheme: BIT_SCHEME;
    
    constructor(flag_bits: BIT_SCHEME) {
        this.bitScheme = flag_bits;
    }
    
    static getBit(input: number, pos: number): boolean {
        return !!((input >> pos) & 0x01);
    }
    
    static setBit(bit: boolean, pos: number, input = 0): number {
        return bit ? (input | (1 << pos)) : (input & ~(1 << pos));
    }
    
    static isValidField(input: number): input is IntRange<0, 52> {
        return typeof input == 'number' && input >= 0 && input < 52;
    }
    
    unpack(flags: number): BIT_UNPACK {
        return unpack<BIT_SCHEME, BIT_UNPACK>(flags, this.bitScheme);
    }
    
    pack(flags: BIT_UNPACK, to = 0): number {
        return pack<BIT_SCHEME, BIT_UNPACK>(flags, to, this.bitScheme);
    }
    
    list(): string[] {
        return toFlat<BIT_SCHEME, BIT_SCHEME>(this.bitScheme);
    }
    
    unpackToList(flags: number): string[] {
        return toFlat<BIT_SCHEME, BIT_UNPACK>(this.unpack(flags));
    }
}
