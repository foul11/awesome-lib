import { itAddColumn, tmpTableName } from './utils';
import { get_table_schema } from '../utils';
import { pragma_foreign_keys } from './pragma';


import type { Kysely } from 'kysely';


/**
 * Alter column drop
 */
export async function alter_column_drop<DB, TB extends Extract<keyof DB, string>>(
    db: Kysely<DB>,
    table: TB,
    column_name: string,
) {
    await pragma_foreign_keys(db, false);
    await db
        .transaction()
        .execute(async (trx) => {
            const alter_table = tmpTableName(table);
            const schema = await get_table_schema(trx, table);
            
            if (!schema)
                throw new Error(`Table ${table} does not exist`);
            
            if (!schema.columns.find(c => c.name == column_name)?.type)
                return; // passthrough if column not found
            
            const columns = schema.columns.filter(c => c.name != column_name);
            
            let builder = trx.schema.createTable(alter_table);
                builder = itAddColumn(builder, columns);
            await builder.execute();
            
            await trx
                .insertInto(alter_table)
                .columns(columns.map(c => c.name) as any)
                .expression(eb => (eb as any)
                    .selectFrom(table)
                    .select(columns.map(c => `${table}.${c.name}`)))
                .executeTakeFirstOrThrow();
                
            await trx.schema
                .dropTable(table)
                .execute();
                
            await trx.schema
                .alterTable(alter_table)
                .renameTo(table)
                .execute();
        });
    await pragma_foreign_keys(db, true);
}