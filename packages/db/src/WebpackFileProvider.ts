import type { Migration, MigrationProvider } from 'kysely/migration';
import type { requireDContext } from '@foul11/awesome';

type RequireContext = Awaited<ReturnType<typeof requireDContext>>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function isFunction(obj: unknown): obj is Function {
    return typeof obj === 'function';
}

function isObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null;
}

function isMigration(obj: unknown): obj is Migration {
    return isObject(obj) && isFunction(obj.up);
}

export class WebpackFileProvider implements MigrationProvider {
    static db_migrations = new Map<string, Record<string, any>>();
    
    #db_name: string;
    
    constructor(db_name: string) {
        this.#db_name = db_name;
    }
    
    getMigrations(): Promise<Record<string, Migration>> {
        const migrations_list: Record<string, Migration> = {};
        const migrations = WebpackFileProvider.db_migrations.get(this.#db_name);
        
        if (!migrations)
            return Promise.resolve(migrations_list);
        
        for (const [ file, exports ] of Object.entries(migrations)) {
            if (isMigration(exports?.default)) {
                migrations_list[file] = exports.default;
            } else if (isMigration(exports)) {
                migrations_list[file] = exports;
            }
        }
        
        return Promise.resolve(migrations_list);
    }
    
    static setupDynamicImport(ctx: RequireContext, db_name?: string) {
        for (const [ fpath, exports ] of ctx.keys().map(m => [ m, ctx(m) ])) {
            const [ , db, file ] = /^.+[\\/]([^\\/]+)[\\/](.+)\.[jt]s$/i.exec(fpath) ?? [];
            
            if (!db_name)
                db_name = db;
            
            if (!db_name || !file)
                continue;
            
            if (WebpackFileProvider.db_migrations.has(db_name)) {
                WebpackFileProvider.db_migrations.get(db_name)!  [file] = exports;
            } else {
                WebpackFileProvider.db_migrations.set(db_name, { [file]: exports });
            }
        }
    }
}