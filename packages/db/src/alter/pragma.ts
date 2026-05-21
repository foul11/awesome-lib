import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function pragma_foreign_keys(db: Kysely<any>, enable: boolean) {
    return sql`PRAGMA foreign_keys = ${sql.lit(enable ? 1 : 0)}`.execute(db);
}

export async function pragma_defer_foreign_keys(db: Kysely<any>, enable: boolean) {
    return sql`PRAGMA defer_foreign_keys = ${sql.lit(enable ? 1 : 0)}`.execute(db);
}