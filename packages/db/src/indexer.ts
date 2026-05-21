import { table_info, master_table } from './utils';

import type { ValueOf } from 'type-fest';
import type { Kysely, AnyColumn } from 'kysely';

export async function indexer<TDB>(
    db: Kysely<TDB>,
    options: {
        exclude?: ValueOf<{ [TB in keyof TDB]: TB extends string ? [ TB, (true | AnyColumn<TDB, TB>[]) ] : never }>[]
        include?: ValueOf<{ [TB in keyof TDB]: TB extends string ? [ TB, (true | AnyColumn<TDB, TB>[]) ] : never }>[]
        cleanupOthers?: boolean
    },
) {
    const master = await master_table(db);
    
    const idx_exclude = new Map<string, true | string[]>(options.exclude || []);
    const idx_include = new Map<string, true | string[]>(options.include || []);
    const cleanupOthers = options.cleanupOthers || false;
    
    const tables = master
        .filter(r => r.type == 'table')
        .filter(r => !options.include || idx_include.has(r.name))
        .map(r => r.name);
    
    const indexes = new Set(master
        .filter(r => r.type == 'index')
        .map(r => r.name),
    );
    
    const isExcluded = (table: string, column: { name: string }) => {
        const exclude = idx_exclude.get(table);
        
        if (exclude === true || exclude?.includes(column.name))
            return true;
        
        return false;
    };
    
    const isIncluded = (table: string, column: { name: string }) => {
        const include = idx_include.get(table);

        if (options.include && !(include == true || include?.includes(column.name)))
            return false;
        
        return true;
    };
    
    for (const table of tables) {
        const info = await table_info(db, table as any);
        
        for (const column of info) {
            const idx_name = `autoIdx_${table}_${column.name}`;
            const skip = !isIncluded(table, column) || isExcluded(table, column) || column.pk;
            
            if (indexes.has(idx_name)) {
                if (cleanupOthers && skip) {
                    await db.schema
                        .dropIndex(idx_name)
                        .execute();
                }
                
                continue;
            }
            
            if (skip)
                continue;
            
            await db.schema
                .createIndex(idx_name)
                .on(table)
                .column(column.name)
                .execute();
        }
    }
}
