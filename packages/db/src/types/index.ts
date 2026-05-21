import type { SelectType } from 'kysely';
import type { AllUnionFields } from 'type-fest';

export type DBTablesByType<DB, TB_Type> = {
    [K in keyof DB]:
        DB[K] extends TB_Type
            ? K extends string
                ? K
                : never
            : never
}[keyof DB];

export type DBSelectTypeFromTable<
    DB,
    TB extends keyof DB,
    Fields extends string,
    Default = never,
> = {
    [K in Fields]?:
        K extends keyof AllUnionFields<DB[TB]>
            ? SelectType<AllUnionFields<DB[TB]>[K]> | undefined
            : Default
};

export type DBRequired<
    ObjectFields,
    Fields extends keyof ObjectFields = keyof ObjectFields,
> = {
    [K in keyof ObjectFields]-?:
        K extends Fields
            ? Exclude<ObjectFields[K], undefined>
            : ObjectFields[K]
};
