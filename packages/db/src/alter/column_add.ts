import { itAddColumn, tmpTableName } from './utils';
import { get_table_schema } from '../utils';
import { pragma_foreign_keys } from './pragma';


import type { Kysely, AnyColumn, ColumnDefinitionBuilder, ExpressionBuilder, AliasedExpression, Expression } from 'kysely';
import type { ExtractTableAlias } from './utils';

/**
 * Alter column add after column, or first if null
 */
export async function alter_column_add<DB, TB extends Extract<keyof DB, string>, CN extends AnyColumn<DB, TB>>(
    db: Kysely<DB>,
    table: TB,
    column_name: CN,
    column_type: Expression<unknown>,
    after: CN | null,
    col: (col: ColumnDefinitionBuilder) => ColumnDefinitionBuilder,
    eb?: ((eb: ExpressionBuilder<DB, ExtractTableAlias<DB, TB>>) => AliasedExpression<any, CN>),
) {
    await pragma_foreign_keys(db, false);
    await db
        .transaction()
        .execute(async (trx) => {
            const alter_table = tmpTableName(table);
            const schema = await get_table_schema(trx, table);
            
            if (!schema)
                throw new Error(`Table ${table} does not exist`);
            
            if (schema.columns.some(c => c.name == column_name))
                return; // passthrough if column already exists
            
            const after_column_idx = schema.columns.findIndex(c => c.name == after);
            
            let columns_after  = [] as any[];
            let columns_before = [] as any[];
            
            if (after_column_idx !== -1) {
                columns_after  = schema.columns.slice(0, after_column_idx + 1);
                columns_before = schema.columns.slice(after_column_idx + 1);
            } else {
                columns_after = [];
                columns_before = schema.columns;
            }
            
            let builder = trx.schema.createTable(alter_table);
                builder = itAddColumn(builder, columns_after);
                builder = builder.addColumn(column_name, column_type, col);
                builder = itAddColumn(builder, columns_before);
            await builder.execute();
            
            await trx
                .insertInto(alter_table)
                .columns([
                    ...columns_after.map(c => c.name),
                    ...(eb ? [ column_name ] : []),
                    ...columns_before.map(c => c.name),
                ])
                .expression(() => (trx as any)
                    .selectFrom(table)
                    .select([
                        ...columns_after.map(c => `${table}.${c.name}`),
                        ...(eb ? [ eb ] : []),
                        ...columns_before.map(c => `${table}.${c.name}`),
                    ]))
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
