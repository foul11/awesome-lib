import { itAddColumn, tmpTableName } from './utils';
import { SQLParser } from '../SQLParser';
import { get_table_schema } from '../utils';
import { pragma_foreign_keys } from './pragma';

import type { Kysely, AnyColumn, ColumnDefinitionBuilder, ExpressionBuilder, AliasedExpression, Expression } from 'kysely';
import type { ExtractTableAlias } from './utils';

/**
 * Alter column update settings (e.g. not null)
 */
export async function alter_column_update<
    DB,
    TB extends Extract<keyof DB, string>,
    CN extends AnyColumn<DB, TB>,
>(
    db: Kysely<DB>,
    table: TB,
    column_name: CN,
    column_type: Expression<unknown>,
    col: (col: ColumnDefinitionBuilder) => ColumnDefinitionBuilder,
    eb: ((eb: ExpressionBuilder<DB, ExtractTableAlias<DB, TB>>) => AliasedExpression<any, CN>) | null = null,
) {
    await pragma_foreign_keys(db, false);
    await db
        .transaction()
        .execute(async (trx) => {
            const alter_table = tmpTableName(table);
            const schema = await get_table_schema(trx, table);
            
            if (!schema)
                throw new Error(`Table ${table} does not exist`);
            
            let columns_after: typeof schema.columns | null  = null;
            let columns_before: typeof schema.columns | null = null;
            
            const prev_column_idx = schema.columns.findIndex(c => c.name == column_name);
            
            if (prev_column_idx === -1)
                throw new Error(`Column ${column_name} does not exist`);
            
            columns_after  = schema.columns.slice(0, prev_column_idx);
            columns_before = schema.columns.slice(prev_column_idx + 1);
            
            let builder = trx.schema.createTable(alter_table);
                builder = itAddColumn(builder, columns_after);
                builder = builder.addColumn(column_name, column_type, col);
                builder = itAddColumn(builder, columns_before);
                
            const create_schema = SQLParser.parse(builder.compile().sql)[0];
            
            if (create_schema?.type != 'CREATE_TABLE')
                throw new Error('Invalid builded SQL');
            
            const old_column = schema.columns.find(c => c.name == column_name);
            const new_column = create_schema.columns.find(c => c.name == column_name);
            
            if (!old_column || !new_column)
                throw new Error('new/old column not found');
            
            if (JSON.stringify(old_column) == JSON.stringify(new_column))
                return; // passthrough if column settings are the same
                
            await builder.execute();
            
            await trx
                .insertInto(alter_table)
                .columns([
                    ...columns_after.map(c => c.name),
                    column_name,
                    ...columns_before.map(c => c.name),
                ] as any)
                .expression(() => (trx as any)
                    .selectFrom(table)
                    .select([
                        ...columns_after.map(c => `${table}.${c.name}`),
                        ...(eb ? [ eb ] : [ `${table}.${column_name}` ]),
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
