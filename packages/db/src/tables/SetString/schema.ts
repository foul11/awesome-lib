import type { Generated, GeneratedAlways } from 'kysely';

export interface TableSetString {
    id:         Generated<number>
    value:      string  // unique
    created_at: GeneratedAlways<string>
}