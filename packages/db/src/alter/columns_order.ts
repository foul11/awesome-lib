import { itAddColumn, tmpTableName } from './utils';
import { get_table_schema } from '../utils';
import { pragma_foreign_keys } from './pragma';


import type { Kysely, AnyColumn } from 'kysely';


/**
 * Alter column order
 */
export async function alter_column_order<DB, TB extends Extract<keyof DB, string>>(
    db: Kysely<DB>,
    table: TB,
    columns_name: AnyColumn<DB, TB>[],
) {
    await pragma_foreign_keys(db, false);
    await db
        .transaction()
        .execute(async (trx) => {
            const alter_table = tmpTableName(table);
            const schema = await get_table_schema(trx, table);
            
            if (!schema)
                throw new Error(`Table ${table} does not exist`);
            
            const schema_columns = new Map(schema.columns.map((c, i) => [ c.name,   i ]));
            const new_columns    = new Map(columns_name  .map((c, i) => [ c as any, i ]));
            
            if (schema_columns.size != new_columns.size || schema_columns.size != columns_name.length)
                throw new Error(`Table ${table} column count mismatch`);
            
            if (![ ...schema_columns.entries() ].some(([ c_name, idx ]) => new_columns.get(c_name) != idx))
                return; // passthrough if column order is the same
            
            let builder = trx.schema.createTable(alter_table);
                builder = itAddColumn(builder, columns_name.map(c =>
                    schema.columns[schema_columns.get(c)!],
                ));
            await builder.execute();
            
            await trx
                .insertInto(alter_table)
                .columns(columns_name)
                .expression(eb => (eb as any)
                    .selectFrom(table)
                    .select(columns_name.map(c => `${table}.${c}`)))
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
