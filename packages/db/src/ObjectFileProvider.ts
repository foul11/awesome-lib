import type { Migration, MigrationProvider } from 'kysely/migration';

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

type TMigration = Migration & { default?: Migration };

export class ObjectFileProvider implements MigrationProvider {
    constructor(private migrations: Record<string, TMigration>) {
        
    }
    
    getMigrations(): Promise<Record<string, Migration>> {
        const migrations_list: Record<string, Migration> = {};
        const migrations = this.migrations;
        
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
}