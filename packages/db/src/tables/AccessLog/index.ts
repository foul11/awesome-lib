export * from './schema';

import deepmerge from 'deepmerge';

import { SetString } from '../SetString';
import { BitFields } from '../../BitFields';
import { master_table } from '../../utils';
import { ORM } from '../../ORM';

import type { logger_access_log } from '../../log';

import type { Kysely } from 'kysely';
import type { BitFieldsUnpack } from '../../BitFields';
import type { DBTablesByType } from '../../types';
import type { TableSetString } from '../SetString';
import type { TableAccessLog, TableAccessLogTiming } from './schema';

type DefaultKeyAccessLog = 'access_log';
interface DefaultKyselyAccessLog {
    access_log: TableAccessLog
    access_log_set_ip: TableSetString
    access_log_set_ua: TableSetString
    access_log_set_action: TableSetString
    access_log_timing: TableAccessLogTiming
    access_log_set_timing: TableSetString
}

export interface AccessLogStoreData {
    action: string
    flag: number
    ip?: string | undefined
    meta?: string | undefined
    user_agent?: string | undefined
    timings: Record<string, number> & {
        total: number
        exclude: number
    }
    extended: Record<string, any>
}

export interface AccessLogStore {
    store(data: AccessLogStoreData): Promise<void>
}

export class AccessLogStoreDB implements AccessLogStore {
    protected readonly db: Kysely<DefaultKyselyAccessLog>;
    protected readonly domain: DefaultKeyAccessLog;
    protected readonly logger: typeof logger_access_log | undefined;
    
    private constructor(db: any, domain: any, logger?: typeof logger_access_log) {
        this.db = db;
        this.domain = domain;
        this.logger = logger;
    }
    
    static async create<
        DB,
        Domain extends DBTablesByType<DB, TableAccessLog>,
    >(
        db: Kysely<DB>,
        domain: Domain,
        logger?: typeof logger_access_log,
    ) {
        const master = await master_table(db);
        const tables = [
            `${domain}`,
            `${domain}_set_ip`,
            `${domain}_set_ua`,
            `${domain}_set_action`,
            `${domain}_timing`,
            `${domain}_set_timing`,
        ];
        
        for (const table of tables) {
            const info = master.find(r => r.name == table && r.type == 'table');
            
            if (!info)
                throw new Error(`Table ${table} not found, can't create access log store`);
        }
        
        return new AccessLogStoreDB(db, domain, logger);
    }
    
    async store(data: AccessLogStoreData) {
        const perf_db_start = process.hrtime.bigint();
        await this.db
            .transaction()
            .execute(async (trx) => {
                const access_log_set_ip_id = await SetString.try_store_value_or_throw<DefaultKyselyAccessLog>(data.ip, `${this.domain}_set_ip`, trx);
                const access_log_set_ua_id = await SetString.try_store_value_or_throw<DefaultKyselyAccessLog>(data.user_agent, `${this.domain}_set_ua`, trx);
                const access_log_set_action_id = await SetString.store_value_or_throw<DefaultKyselyAccessLog>(data.action, `${this.domain}_set_action`, trx);
                
                const access_log_id = (
                    await trx
                        .insertInto(`${this.domain}`)
                        .returning('id')
                        .values({
                            flag: data.flag,
                            meta: data.meta,
                            access_log_set_ip_id,
                            access_log_set_ua_id,
                            access_log_set_action_id,
                            ...data.extended,
                        })
                        .executeTakeFirstOrThrow()
                ).id;
                
                for (const [ key, value ] of Object.entries(data.timings)) {
                    const access_log_set_timing_id = await SetString.store_value_or_throw<DefaultKyselyAccessLog>(key, `${this.domain}_set_timing`, trx);
                    
                    await trx
                        .insertInto(`${this.domain}_timing`)
                        .values({
                            access_log_id,
                            access_log_set_timing_id,
                            timing_ns: value,
                        })
                        .executeTakeFirstOrThrow();
                }
            });
        const perf_db_end = process.hrtime.bigint();
        
        this.logger?.silly(`AccessLogStoreDB.store`, {
            runtime: Number(perf_db_end - perf_db_start) / 1e6,
            data,
        });
    }
}

export class AccessLogStoreDBDummy implements AccessLogStore {
    static async create(..._: any[]) {
        return new AccessLogStoreDBDummy();
    }
    
    async store(..._: any[]) { /* NOOP */ }
}

class AccessLogTransaction<
    T extends AccessLogInfo,
> extends ORM {
    protected readonly access_log: AccessLog<T>;
    protected committed = false;
    
    protected readonly action: string;
    protected info: AccessLogInfo & T;
    
    protected readonly timings_start:    Record<string, bigint> = {};
    protected readonly timings_duration: Record<string, bigint> = {};
    
    protected readonly perf_total_start: bigint;
    
    constructor(access_log: AccessLog<T>, action: string, info: AccessLogInfo & T) {
        super();
        
        this.perf_total_start = process.hrtime.bigint();
        this.access_log = access_log;
        this.action = action;
        this.info = info;
    }
    
    perf_start(name: string): this {
        if (this.committed)
            return this;
        
        this.timings_start[name] = process.hrtime.bigint();
        return this;
    }
    
    perf_stop(name: string): this {
        if (this.committed)
            return this;
        
        const start = this.timings_start[name];
        const end = process.hrtime.bigint();
        
        if (!start)
            return this;
        
        this.timings_start[name] = end;
        this.timings_duration[name] = (this.timings_duration[name] || 0n) + (end - start);
        return this;
    }
    
    perf(name: string) {
        return this.timings_duration[name];
    }
    
    update_info(info: AccessLogInfo & T) {
        this.info = deepmerge<AccessLogInfo & T>(this.info, info);
    }
    
    async commit() {
        if (this.committed)
            return;
        
        this.committed = true;
        const { flag, ip, user_agent, ...extended } = this.info;
        
        const perf_total = process.hrtime.bigint() - this.perf_total_start;
        const perf_exclude = perf_total - Object.values(this.timings_duration).reduce((a, b) => a + b, 0n);
        
        return this.access_log.store.store({
            action: this.action,
            flag: this.access_log.flags.pack(flag ?? {}),
            timings: {
                total: Number(perf_total),
                exclude: Number(perf_exclude),
                ...this.timings_duration,
            },
            ip,
            user_agent,
            extended,
        });
    }
}

const accessLogDefaultFlags = {
    rejected: 0,
    internal: 1,
} as const;

type AccessLogInfo = {
    flag?:       BitFieldsUnpack<typeof accessLogDefaultFlags>
    ip?:         string | undefined
    user_agent?: string | undefined
};

export class AccessLog<
    T extends AccessLogInfo,
//     Flags extends FieldFlagsInObj<IntRange<16, 32>>>
> extends ORM {
    public readonly flags: BitFields<typeof accessLogDefaultFlags>;
    public readonly store: AccessLogStore;
    
    protected constructor(store: AccessLogStore) {
        super();
        
        this.store = store;
        this.flags = new BitFields(accessLogDefaultFlags);
    }
    
    static new<T extends Record<string, any>>(options: {
        store: AccessLogStore
        // flags: Flags
    }) {
        return new AccessLog<T & AccessLogInfo>(options.store);
    }
    
    begin(action: string, info: T) {
        return new AccessLogTransaction(this, action, info);
    }
}