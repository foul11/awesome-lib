export * from './schema';

import { ORM } from '../../ORM';

import type { Kysely } from 'kysely';
import type { DBTablesByType } from '../../types';
import type { TableSetString } from './schema';

type DefaultKeySetString = 'default_set';
interface DefaultKyselySetString {
    default_set: TableSetString
}

export class SetString extends ORM {
    static async store_value_or_throw<
        DB,
        Domain extends DBTablesByType<DB, TableSetString> = DBTablesByType<DB, TableSetString>,
    >(value: string, domain: Domain, db_builder: Kysely<DB>): Promise<number> {
        const db = db_builder as unknown as Kysely<DefaultKyselySetString>;
        const in_domain = domain as DefaultKeySetString;
        
        return (
            await db
                .insertInto(in_domain)
                .returning('id')
                .values({
                    value,
                })
                .onConflict(oc => oc
                    // .doNothing() // Не возвращает id, если строка уже была в базе: https://sqlite.org/forum/info/6b14076446260538
                    .doUpdateSet(eb => ({
                        id: eb.ref('id'),
                    })),
                )
                .executeTakeFirstOrThrow()
        ).id;
    }
    
    static async try_store_value_or_throw<
        DB,
        Domain extends DBTablesByType<DB, TableSetString> = DBTablesByType<DB, TableSetString>,
    >(value: string | undefined, domain: Domain, db_builder: Kysely<DB>): Promise<number | undefined> {
        return value ? await this.store_value_or_throw(value, domain, db_builder) : undefined;
    }
}