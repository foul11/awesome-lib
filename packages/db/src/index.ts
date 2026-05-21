export * from './alter';
export * from './defaults';
export * from './Error';
export * from './indexer';
export * from './ORM';
export * from './SQLParser';
export * from './utils';
export * from './WebpackFileProvider';
export * from './log';

export type * from './types';

import { WebpackFileProvider } from './WebpackFileProvider';
import { Kysely, SqliteDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import { format as format_sql } from '@foul11/sql-formatter';
import { isWebpack } from '@foul11/awesome';
import { v4 } from 'uuid';

import Sqlite from 'better-sqlite3';
import bindings from 'bindings';
import path from 'path';

import type { logger_db } from './log';
import type { Database } from 'better-sqlite3';
import type { CompiledQuery } from 'kysely';

function create_sqlite(db_path: string): Database {
    const db = new Sqlite(db_path, {
        nativeBinding: isWebpack()
            ? bindings({
                module_root: process.cwd(),
                bindings: 'better_sqlite3.node',
                try: [
                    [ 'module_root', 'dist', 'bindings' ],
                    [ 'module_root', 'bindings' ],
                    [ 'dist', 'bindings' ],
                    [ 'bindings' ],
                ],
                path: true,
            } as any)
            : null,
    });
    
    db.function('new_uuid', () => {
        return v4();
    });
    
    return db;
}

type KyselyDB<DB> = Kysely<DB> & {
    in_migration: boolean
    
    migration_log: string[]
    transaction_logs: string[]
};

function format_sqlite_no_throw(log_kysely_db: typeof logger_db, query: CompiledQuery<unknown> | string) {
    const sql = typeof query === 'string'
        ? query
        : query.sql;
    
    try {
        return format_sql(sql, {
            language: 'sqlite',
            tabWidth: 4,
            indentStyle: 'tabularRight',
            ...(typeof query !== 'string' && {
                params: query.parameters as any,
           }),
        });
    } catch (e) {
        log_kysely_db.error(e as Error);
        return sql;
    }
}

function create_kysely<DB>(db: unknown, log_kysely_db: typeof logger_db) {
    const db_kysely = new Kysely<DB>({
        dialect: new SqliteDialect({
            database: db as Database,
        }),
        log: (event) => {
            db_kysely.transaction_logs.push(event.query.sql);
            
            if (log_kysely_db.isSillyEnabled()) {
                if (!db_kysely.in_migration) {
                    log_kysely_db.silly(`\n${format_sqlite_no_throw(log_kysely_db, event.query)}\n`, {
                        runtime: event.queryDurationMillis,
                    });
                } else {
                    db_kysely.migration_log.push(format_sqlite_no_throw(log_kysely_db, event.query));
                }
            }
            
            if (event.level === 'error') {
                log_kysely_db.error(event.error, {
                    query: db_kysely.transaction_logs.length
                        ? db_kysely.transaction_logs.map(sql => format_sqlite_no_throw(log_kysely_db, sql)).join('\n')
                        : format_sqlite_no_throw(log_kysely_db, event.query),
                    runtime: event.queryDurationMillis,
                });
            }
            
            if (/commit|begin|rollback/.test(event.query.sql)) {
                db_kysely.transaction_logs = [];
            }
        },
    }) as KyselyDB<DB>;
    
    /**
     * Nested transaction hack
     * Catch execute method,
     * replace arg in func to proxy transaction,
     * method transaction() return this transaction
     */
    function proxy_transaction(trx: any) {
        return new Proxy(trx, {
            get(target: any, prop) {
                if (prop === 'transaction')
                    return () => ({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                        execute: (fn: Function) => (
                            fn.apply(target, [ target ])
                        ),
                    });
                
                if (typeof target[prop] == 'function') {
                    return target[prop].bind(target);
                } else {
                    return target[prop];
                }
            },
        });
    }

    const old_transaction = db_kysely.transaction;
    db_kysely.transaction = function (...trx_args) {
        const transaction = old_transaction.call(this, ...trx_args);
        
        return new Proxy(transaction, {
            get(target: any, prop) {
                if (prop === 'execute')
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                    return (fn: Function) => (
                        target.execute((trx: any, ...args: any[]) => (
                            fn.apply(target, [ proxy_transaction(trx), ...args ])
                        ))
                    );
                
                if (typeof target[prop] == 'function') {
                    return target[prop].bind(target);
                } else {
                    return target[prop];
                }
            },
        });
    };
    
    return db_kysely;
}

async function create_migrator<DB>(db_name: string, db: KyselyDB<DB>, log_kysely_db: typeof logger_db) {
    db.in_migration = true;
    db.migration_log = [];
    db.transaction_logs = [];
    
    const migrator = new Migrator({
        db, provider: new WebpackFileProvider(db_name),
    });
    
    async function migrateToLatest() {
        const { error, results } = await migrator.migrateToLatest();
        
        for (const result of results ?? []) {
            if (result.status === 'Success') {
                log_kysely_db.info(`migration "${result.migrationName}" was executed successfully`);
            } else if (result.status === 'Error') {
                log_kysely_db.error(`failed to execute migration "${result.migrationName}"`);
            }
        }
        
        if (error) {
            if (!(error instanceof Error))
                throw error as any;
            
            log_kysely_db.error('failed to migrate');
            log_kysely_db.error(error.stack);
            
            if (log_kysely_db.isDebugEnabled()) {
                log_kysely_db.debug(`\n${db.migration_log.join('\n-------------- NEXT MIGRATION SQL-request --------------\n')}\n`, {});
                
                // eslint-disable-next-line no-debugger
                debugger;
            }
            
            throw error;
        }
    }
    
    log_kysely_db.debug('starting migration to latest');
    await migrateToLatest();
    log_kysely_db.debug('migration to latest completed');
    
    db.in_migration = false;
    db.migration_log = [];
    
    return migrator;
}

export async function create_db<DB>(db_path: string, log_kysely: typeof logger_db) {
    const db_name = path.parse(db_path).name;
    const db_sqlite = create_sqlite(db_path) as unknown;
    const db_log = log_kysely.child({ label5: db_name });
    const db = create_kysely<DB>(db_sqlite, db_log);
    const db_migrator = await create_migrator(db_name, db, db_log);
    
    return {
        db: db as Kysely<DB>,
        db_migrator,
        db_sqlite,
        db_log,
    };
}

export const SqliteError = Sqlite.SqliteError;