import type { Generated, GeneratedAlways } from 'kysely';

export interface TablePermission {
    id:         Generated<number>
    fk_id:      number  // fk, id к которому принадлежит право
    name:       string  // fullName
    created_at: GeneratedAlways<string>
}

export interface TablePermissionGroup {
    id:         Generated<number>
    created_at: GeneratedAlways<string>
}