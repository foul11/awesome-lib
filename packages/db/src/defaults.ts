import { sql } from 'kysely';

export const currTimeDefault = sql`(strftime('%FT%R:%fZ'))`;