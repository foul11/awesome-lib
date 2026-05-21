import { itAddColumn, tmpTableName } from './utils';
import { get_table_schema } from '../utils';
import { pragma_foreign_keys } from './pragma';


import type { Kysely, AnyColumn } from 'kysely';


/**
 * Alter column rename
 */
export async function alter_column_rename<DB, TB extends Extract<keyof DB, string>>(
    db: Kysely<DB>,
    table: TB,
    column_name: string,
    new_column_name: AnyColumn<DB, TB>,
) {
    await pragma_foreign_keys(db, false);
    await db
        .transaction()
        .execute(async (trx) => {
            const alter_table = tmpTableName(table);
            const schema = await get_table_schema(trx, table);
            
            if (!schema)
                throw new Error(`Table ${table} does not exist`);
            
            const columns = schema.columns;
            
            if (columns.some(c => c.name === new_column_name))
                return; // passthrough if column already exists
            
            let builder = trx.schema.createTable(alter_table);
                builder = itAddColumn(builder, columns.map(c => ({ ...c, name: c.name == column_name ? new_column_name : c.name })));
            await builder.execute();
            
            await trx
                .insertInto(alter_table)
                .columns(columns.map(c => c.name == column_name ? new_column_name : c.name) as any)
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