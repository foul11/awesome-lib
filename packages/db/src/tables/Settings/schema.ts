import type { Generated, GeneratedAlways } from 'kysely';

export interface TableSettings {
    id:         Generated<number>
    key:        string  // unique
    value:      string  // JSON
    created_at: GeneratedAlways<string>
}