import { sql } from 'kysely';

import type { SQLParser } from '../SQLParser';
import type { ColumnDefinitionBuilder, CreateTableBuilder } from 'kysely';

export type ExtractTableAlias<DB, TE> = TE extends `${string} as ${infer TA}`
    ? TA extends keyof DB
        ? TA
        : never
    : TE extends keyof DB
        ? TE
        : never;

function columnDefinition(col: ColumnDefinitionBuilder, columnDef: ReturnType<typeof SQLParser['sqliteColumnsDef']>[0]) {
    if (columnDef.primary)
        col = col.primaryKey();
    
    if (columnDef.unique)
        col = col.unique();
    
    if (columnDef.auto_increment)
        col = col.autoIncrement();
    
    if (columnDef.not_null)
        col = col.notNull();
    
    if (columnDef.default !== null) {
        if (typeof columnDef.default == 'string' && columnDef.default[0] == '(') {
            col = col.defaultTo(sql.raw(columnDef.default));
        } else {
            col = col.defaultTo(sql.lit(columnDef.default));
        }
    }
    
    if (columnDef.references) {
        if (!columnDef.references.columns.length || columnDef.references.columns.length > 1)
            throw new Error('Only one column can be referenced');
        
        const column_name = columnDef.references.columns[0];
        const schema_name = [
            ...columnDef.references.table.scheme_parts,
            columnDef.references.table.name,
            column_name,
        ].join('.');
        
        col = col.references(schema_name);
        
        if (columnDef.references.constraints) {
            col = col.modifyEnd(sql.raw(` ${columnDef.references.constraints}`));
        }
    }
    
    return col;
}

export function itAddColumn<TABLE_NAME extends string>(builder: CreateTableBuilder<TABLE_NAME, never>, columns: ReturnType<typeof SQLParser['sqliteColumnsDef']>) {
    for (const column of columns) {
        builder = builder.addColumn(
            column.name,
            column.type.toLowerCase() as Lowercase<typeof column.type>,
            col => columnDefinition(col, column),
        );
    }
    
    return builder;
}

export function tmpTableName(table: string) {
    return `alter_${Math.floor(Date.now() / 1000)}_${table}` as any;
}