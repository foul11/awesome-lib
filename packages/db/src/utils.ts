import { sql } from 'kysely';
import { SQLParser } from './SQLParser';

import type { Kysely } from 'kysely';

export async function table_info<DB>(db: Kysely<DB>, table: Extract<keyof DB, string>) {
    return (
        (await sql`SELECT * FROM pragma_table_info('${sql.raw(table)}')`.execute(db))
            .rows.map((r: any) => ({ ...r, notnull: !!r.notnull, pk: !!r.pk, type: r.type.toUpperCase() }))
    ) as {
        cid: number
        name: string
        type: 'INTEGER' | 'REAL' | 'TEXT' | 'BLOB' | 'NUMERIC'
        notnull: boolean
        dflt_value: string | null
        pk: boolean
    }[];
}

export async function master_table(db: Kysely<any>) {
    return (
        (await db
            .selectFrom('sqlite_master')
            .selectAll()
            .execute()
        ).filter((r: any) => r.name != 'sqlite_sequence')
    ) as {
        type: 'index' | 'table'
        name: string
        tbl_name: string
        rootpage: number
        sql: string
    }[];
}

export async function get_table_schema<DB>(db: Kysely<DB>, table: Extract<keyof DB, string>) {
    const master = (await master_table(db)).find(r => r.name == table);
    
    if (!master)
        return false;
    
    const schema = SQLParser.parse(master.sql)[0];
    
    if (schema?.type != 'CREATE_TABLE')
        return false;
    
    return schema;
}