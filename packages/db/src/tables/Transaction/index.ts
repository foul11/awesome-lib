export * from './schema';

import { SetString } from '../SetString';
import { BitFields } from '../../BitFields';
import { master_table } from '../../utils';
import { ORM } from '../../ORM';

import type { Kysely } from 'kysely';
import type { DBTablesByType } from '../../types';
import type { TableSetString } from '../SetString';
import type { TableTransaction } from './schema';

type DefaultKeyTransaction = 'transaction';
interface DefaultKyselyTransaction {
    transaction: TableTransaction
    transaction_set_reason: TableSetString
}

interface TransactionData {
    flag: number
    reason: string
    since_at?: Date
    deadline_at?: Date
    parent_id?: number
}

interface TransactionHistory {
    amount: number
    reason: string | null
    date:   string | null
}

export interface TransactionStore {
    get(fk_id: number): Promise<number>
    set(fk_id: number, value:  number, options: TransactionData): Promise<number | undefined>
    add(fk_id: number, amount: number, options: TransactionData): Promise<number | undefined>
    
    accept(id: number): Promise<boolean>
    reject(id: number): Promise<boolean>
    
    history(fk_id: number): Promise<TransactionHistory[]>
}

export class TransactionStoreDB implements TransactionStore {
    protected readonly db: Kysely<DefaultKyselyTransaction>;
    protected readonly domain: DefaultKeyTransaction;
    
    protected constructor(db: any, domain: any) {
        this.db = db;
        this.domain = domain;
    }
    
    static async create<
        DB,
        Domain extends DBTablesByType<DB, TableTransaction>,
    >(
        db: Kysely<DB>,
        domain: Domain,
    ) {
        const master = await master_table(db);
        const tables = [
            `${domain}`,
            `${domain}_set_reason`,
        ];
        
        for (const table of tables) {
            const info = master.find(r => r.name == table && r.type == 'table');
            
            if (!info)
                throw new Error(`Table ${table} not found, can't create transaction store`);
        }
        
        return new TransactionStoreDB(db, domain);
    }
    
    protected async db_get(fk_id: number, curr_date: Date, db_builder = this.db): Promise<number> {
        const curr_iso = curr_date.toISOString();
        
        return Number((
            await db_builder
                .selectFrom(this.domain)
                .select(sb => sb
                    .fn.sum(sb.ref('amount')).as('sum'))
                .where('fk_id', '=', fk_id)
                .where(eb => eb
                    .or([
                        eb('deadline_at', '>=', curr_iso),
                        eb('deadline_at', 'is', null),
                    ]))
                .where(eb => eb
                    .or([
                        eb('since_at', '<=', curr_iso),
                        eb('since_at', 'is', null),
                    ]))
                .where('created_at', '<=', curr_iso)
                .where('accept_at', 'is not', null)
                .where('reject_at', 'is', null)
                .groupBy('fk_id')
                .executeTakeFirst()
        )?.sum ?? 0);
    }
    
    protected async db_set(
        fk_id: number,
        value: number,
        options: TransactionData,
        db_builder = this.db,
    ): Promise<number | undefined> {
        const curr_date = new Date();
        
        return (
            await db_builder
                .transaction()
                .execute(async (trx) => {
                    const curr_amount = await this.db_get(fk_id, curr_date, trx);
                    return this.db_add(fk_id, value - curr_amount, options, trx);
                })
        );
    }
    
    protected async db_add(
        fk_id: number,
        value: number,
        options: TransactionData,
        db_builder = this.db,
    ): Promise<number | undefined> {
        return (
            await db_builder
                .transaction()
                .execute(async (trx) => {
                    const reason_id = await SetString.store_value_or_throw<DefaultKyselyTransaction>(options.reason, `${this.domain}_set_reason`, trx);
                    
                    const trx_id = await trx
                        .insertInto(this.domain)
                        .returning('id')
                        .values({
                            fk_id,
                            flag: options.flag,
                            amount: value,
                            reason_id,
                            since_at: options?.since_at?.toISOString(),
                            deadline_at: options?.deadline_at?.toISOString(),
                            parent_id: options?.parent_id,
                        })
                        .executeTakeFirst();
                        
                    return trx_id?.id;
                })
        );
    }
    
    protected async db_accept(id: number, db_builder = this.db): Promise<boolean> {
        const curr_date = new Date();
        
        return (
            await db_builder
                .updateTable(this.domain)
                .where('id', '=', id)
                .where('reject_at', 'is', null)
                .where('accept_at', 'is', null)
                .set({
                    accept_at: curr_date.toISOString(),
                })
                .executeTakeFirst()
        ).numUpdatedRows != 0n;
    }
    
    protected async db_reject(id: number, db_builder = this.db): Promise<boolean> {
        const curr_date = new Date();
        
        return (
            await db_builder
                .updateTable(this.domain)
                .where('id', '=', id)
                .where('reject_at', 'is', null)
                .where('accept_at', 'is', null)
                .set({
                    reject_at: curr_date.toISOString(),
                })
                .executeTakeFirst()
        ).numUpdatedRows != 0n;
    }
    
    async get(
        fk_id: number,
    ): Promise<number> {
        const curr_date = new Date();
        return this.db_get(fk_id, curr_date);
    }
    
    async set(
        fk_id: number,
        value: number,
        options: TransactionData,
    ): Promise<number | undefined> {
        return this.db_set(fk_id, value, options);
    }
    
    async add(
        fk_id: number,
        value: number,
        options: TransactionData,
    ): Promise<number | undefined> {
        return this.db_add(fk_id, value, options);
    }
    
    async accept(id: number): Promise<boolean> {
        return this.db_accept(id);
    }
    
    async reject(id: number): Promise<boolean> {
        return this.db_reject(id);
    }
    
    async history(fk_id: number, db_builder = this.db): Promise<TransactionHistory[]> { // FIXME: переписать, не достаточно точные данные, из-за того что добавились столбцы со сгоранием бонусов
        const curr_iso = new Date().toISOString();
        
        return (
            await db_builder
                .selectFrom(this.domain)
                .leftJoin(`${this.domain}_set_reason`, `${this.domain}_set_reason.id`, `${this.domain}.reason_id`)
                .select([
                    `${this.domain}.amount as amount`,
                    `${this.domain}.accept_at as date`,
                    `${this.domain}_set_reason.value as reason`,
                ])
                .where(`${this.domain}.fk_id`, '=', fk_id)
                .where(`${this.domain}.created_at`, '<=', curr_iso)
                .where(`${this.domain}.accept_at`, 'is not', null)
                .where(`${this.domain}.reject_at`, 'is', null)
                .execute()
        );
    }
}

const TransactionDefaultFlags = {
    hidden: 0,
    type: {
        receive: 1,
        spend: 2,
        transfer: 3,
        internal: 4,
        other: 5,
    },
} as const;

export class CurrentTransaction<TransactionItemId extends WithId> extends ORM {
    protected readonly transaction: Transaction<TransactionItemId>;
    protected readonly id: number | undefined;
    
    constructor(transaction: Transaction<TransactionItemId>, id: number | undefined) {
        super();
        
        this.transaction = transaction;
        this.id = id;
    }
    
    async accept(): Promise<boolean> {
        if (!this.id)
            return false;
        
        return this.transaction.store.accept(this.id);
    }
    
    async reject(): Promise<boolean> {
        if (!this.id)
            return false;
        
        return this.transaction.store.reject(this.id);
    }
    
    get_id(): number | undefined {
        return this.id;
    }
}

interface WithId {
    id: number
}

export interface TransactionOptions {
    type: keyof typeof TransactionDefaultFlags['type']
    hidden?: boolean
    reason: string
}

export class Transaction<TransactionItemId extends WithId> extends ORM {
    public readonly flags: BitFields<typeof TransactionDefaultFlags>;
    public readonly store: TransactionStore;
    
    protected constructor(store: TransactionStore) {
        super();
        
        this.store = store;
        this.flags = new BitFields(TransactionDefaultFlags);
    }
    
    static new<
        TransactionItemId extends WithId,
    >(options: {
        store: TransactionStore
    }) {
        return new Transaction<TransactionItemId>(options.store);
    }
    
    transaction_from_id(id: number | undefined) {
        return new CurrentTransaction<TransactionItemId>(this, id);
    }
    
    private transaction_parse_options(options: TransactionOptions): TransactionData {
        return {
            flag: this.flags.pack({
                hidden: options.hidden,
                type: { [options?.type] : true },
            }),
            reason: options?.reason,
        };
    }
    
    async get_sum(fk_obj: TransactionItemId) {
        return this.store.get(fk_obj.id);
    }
    
    async set_transaction(fk_obj: TransactionItemId, value: number, options: TransactionOptions) {
        const trx_id = await this.store.set(fk_obj.id, value, (
            this.transaction_parse_options(options)
        ));
        
        return this.transaction_from_id(trx_id);
    }
    
    async add_transaction(fk_obj: TransactionItemId, value: number, options: TransactionOptions) {
        const trx_id = await this.store.add(fk_obj.id, value, (
            this.transaction_parse_options(options)
        ));
        
        return this.transaction_from_id(trx_id);
    }
    
    async get_history(fk_obj: TransactionItemId) {
        return this.store.history(fk_obj.id);
    }
}