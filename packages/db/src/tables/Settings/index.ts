export * from './schema';

import { master_table } from '../../utils';
import { ORM } from '../../ORM';

import type { Kysely } from 'kysely';
import type { DBTablesByType } from '../../types';
import type { TableSettings } from './schema';

type DefaultKeyPermission = 'settings';
interface DefaultKyselyPermission {
    settings: TableSettings
}

export interface SettingsStore {
    getKV(key: string): Promise<string | undefined>
    setKV(key: string, value: string): Promise<void>
    hasKV(key: string): Promise<boolean>
    unsetKV(key: string): Promise<void>
}

export class SettingsStoreDB implements SettingsStore {
    protected readonly db: Kysely<DefaultKyselyPermission>;
    protected readonly domain: DefaultKeyPermission;
    
    private constructor(db: any, domain: any) {
        this.db = db;
        this.domain = domain;
    }
    
    static async create<
        DB,
        Domain extends DBTablesByType<DB, TableSettings>,
    >(
        db: Kysely<DB>,
        domain: Domain,
    ) {
        const master = await master_table(db);
        const info = master.find(r => r.name == domain && r.type == 'table');
        
        if (!info)
            throw new Error(`Table ${domain} not found, can't create settings store`);
        
        return new SettingsStoreDB(db, domain);
    }
    
    async getKV(key: string): Promise<any> {
        return (
            await this.db
                .selectFrom(this.domain)
                .select('value')
                .where('key', '=', key)
                .executeTakeFirst()
        )?.value;
    }
    
    async setKV(key: string, value: string): Promise<void> {
        return void (
            await this.db
                .insertInto(this.domain)
                .values({
                    key,
                    value,
                })
                .onConflict(oc => oc
                    .doUpdateSet({ value }))
                .executeTakeFirst()
        );
    }
    
    async hasKV(key: string): Promise<boolean> {
        return (
            await this.db
                .selectFrom(this.domain)
                .select('id')
                .where('key', '=', key)
                .executeTakeFirst()
        ) != null;
    }
    
    async unsetKV(key: string): Promise<void> {
        return void (
            await this.db
                .deleteFrom(this.domain)
                .where('key', '=', key)
                .executeTakeFirst()
        );
    }
}

type DefaultsObject = {
    [key: string]: any
};

export class Settings<SettingsObject extends DefaultsObject> extends ORM {
    protected readonly store: SettingsStore;
    protected readonly defaults: SettingsObject;
    
    private constructor(store: SettingsStore, defaults: any) {
        super();
        
        this.store = store;
        this.defaults = defaults;
    }
    
    static new<
        Defaults extends DefaultsObject,
    >(options: {
        store: SettingsStore
        defaults: Defaults
    }) {
        return new Settings<Defaults>(options.store, options.defaults);
    }
    
    async get<K extends keyof SettingsObject>(key: K & string): Promise<SettingsObject[K]> {
        const value = await this.store.getKV(key);
        
        if (value !== undefined)
            return JSON.parse(value);
        
        return this.defaults[key];
    }
    
    async set<K extends keyof SettingsObject>(key: K & string, value: SettingsObject[K]): Promise<void> {
        await this.store.setKV(key, JSON.stringify(value));
    }
    
    async unset<K extends keyof SettingsObject>(key: K & string): Promise<void> {
        await this.store.unsetKV(key);
    }
    
    async has<K extends keyof SettingsObject>(key: K & string): Promise<boolean> {
        return await this.store.hasKV(key);
    }
}