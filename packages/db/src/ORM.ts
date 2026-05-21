import { ErrorUnknown } from './Error';

import type { AnyColumn, Kysely, SelectType, UpdateKeys } from 'kysely';

type KeysMatching<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T];

export class ORM {
    static async getWhereId<
        DB,
        TB extends KeysMatching<DB, { id: any }>,
        CN extends AnyColumn<DB, TB>,
    >(
        id: number,
        table: TB,
        column: CN,
        db_builder: Kysely<DB>,
    ): Promise<SelectType<DB[TB][CN]>> {
        const res = await (db_builder as any)
            .selectFrom(table)
            .select(column as any)
            .where('id', '=', id as any)
            .executeTakeFirst();
        
        if (!res)
            throw new ErrorUnknown(`Failed to get column ${String(column)} from ${String(table)}`);
        
        return (res as any)[column];
    }
    
    static async setWhereId<
        DB,
        TB extends KeysMatching<DB, { id: any }>,
        UCN extends UpdateKeys<DB[TB]>,
    >(
        id: number,
        table: TB,
        value: UCN,
        db_builder: Kysely<DB>,
    ): Promise<boolean> {
        const result = await (db_builder as any)
            .updateTable(table as any)
            .set(value)
            .where('id', '=', id as any)
            .executeTakeFirst();
        return result.numUpdatedRows == 1n;
    }
}
