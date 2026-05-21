export * from './schema';

import { master_table } from '../../utils';
import { ORM } from '../../ORM';

import type { Kysely } from 'kysely';
import type { DBTablesByType } from '../../types';
import type { TablePermission, TablePermissionGroup } from './schema';

type DefaultKeyPermission = 'permission';
interface DefaultKyselyPermission {
    permission: TablePermission
}

export interface PermissionStore {
    getPermissions(id: number): Promise<string[]>
    hasPermission(id: number, permission: string): Promise<boolean>
    addPermission(id: number, permission: string): Promise<void>
    delPermission(id: number, permission: string): Promise<void>
}

export class PermissionStoreDB implements PermissionStore {
    protected readonly db: Kysely<DefaultKyselyPermission>;
    protected readonly domain: DefaultKeyPermission;
    
    private constructor(db: any, domain: any) {
        this.db = db;
        this.domain = domain;
    }
    
    static async create<
        DB,
        Domain extends DBTablesByType<DB, TablePermission>,
    >(
        db: Kysely<DB>,
        domain: Domain,
    ) {
        const master = await master_table(db);
        const info = master.find(r => r.name == domain && r.type == 'table');
        
        if (!info)
            throw new Error(`Table ${domain} not found, can't create permission store`);
        
        return new PermissionStoreDB(db, domain);
    }
    
    async getPermissions(id: number): Promise<string[]> {
        return (
            await this.db
                .selectFrom(this.domain)
                .select('name')
                .where('fk_id', '=', id)
                .execute()
        ).map(r => r.name);
    }
    
    async hasPermission(id: number, permission: string): Promise<boolean> {
        const perms_chunks = permission.split('.');
        const perms = [];
        
        for (let i = 0; i < perms_chunks.length; i++) {
            perms.push(perms_chunks.slice(0, i + 1).join('.'));
        }
        
        return !!(
            await this.db
                .selectFrom(this.domain)
                .select(eb => eb.lit(true).as('exists'))
                .where('name', 'in', perms)
                .where('fk_id', '=', id)
                .executeTakeFirst()
        )?.exists;
    }
    
    async addPermission(id: number, permission: string): Promise<void> {
        return void (
            await this.db
                .insertInto(this.domain)
                .values({
                    fk_id: id,
                    name: permission,
                })
                .onConflict(oc => oc
                    .doNothing())
                .executeTakeFirst()
        );
    }
    
    async delPermission(id: number, permission: string): Promise<void> {
        return void (
            await this.db
                .deleteFrom(this.domain)
                .where('fk_id', '=', id)
                .where('name', '=', permission)
                .executeTakeFirst()
        );
    }
}

export class Permission extends ORM {
    protected readonly parent: Permission | undefined;
    protected readonly store: PermissionStore;
    protected readonly name: string;
    protected readonly children: Map<string, Permission> = new Map();
    
    protected constructor(store: PermissionStore, name: string, parent?: Permission) {
        super();
        
        this.parent = parent;
        this.store = store;
        this.name = name;
        
        if (!/^[a-zA-Z0-9_-]+$/.test(this.name))
            throw new Error('Invalid permission name');
    }
    
    static newRoot(options: {
        store: PermissionStore
        name?: string
    }): Permission {
        return new Permission(options.store, options.name || 'root');
    }
    
    static async has(id: number, perm: Permission): Promise<boolean> {
        return perm.store.hasPermission(id, perm.getFullName());
    }
    
    static async add(id: number, perm: Permission): Promise<void> {
        return perm.store.addPermission(id, perm.getFullName());
    }
    
    static async del(id: number, perm: Permission): Promise<void> {
        return perm.store.delPermission(id, perm.getFullName());
    }
    
    getFlatPermissions(): string[] {
        const result = [
            this.getFullName(),
        ];
        
        for (const child of this.children.values())
            result.push(...child.getFlatPermissions());
        
        return result;
    }
    
    getFullName(): string {
        if (!this.parent)
            return this.name;
        
        return this.parent.getFullName() + '.' + this.name;
    }
    
    child(name: string) {
        const child = new Permission(this.store, name, this);
        
        this.children.set(name, child);
        
        return child;
    }
}

// export class PermissionGroup {
//     // Domain -> Set<PermissionName> Что бы не допускать дубликатов
//     static groups: Map<string, Set<string>> = new Map();
    
//     include_permissions: (Permission | PermissionGroup)[];
//     exclude_permissions: (Permission | PermissionGroup)[];
    
//     domain: string;
//     name: string;
    
//     constructor(domain: string, name: string) {
//         this.domain = domain;
//         this.name = name;
        
//         this.include_permissions = [];
//         this.exclude_permissions = [];
//     }
    
//     hasIncludePermission(perm: Permission): boolean {
//         return false;
//     }
    
//     hasExcludePermission(perm: Permission): boolean {
//         return false;
//     }
    
//     hasPermission(perm: Permission): boolean {
//         return this.hasIncludePermission(perm) && !this.hasExcludePermission(perm);
//     }
// }


// const perm_root = Permission.newRoot('user-permission');

// const perm_crm = perm_root.child('CRM');
// const perm_crm_user = perm_crm.child('user');

// const perm_users_list = perm_crm_user.child('list');
// const perm_users_view = perm_crm_user.child('view');
// const perm_users_add = perm_crm_user.child('add');
// const perm_users_edit = perm_crm_user.child('edit');
// const perm_users_remove = perm_crm_user.child('remove');

// const User = {} as any;

// User.hasPermission = function (perm: Permission) {
//     if (Permission.has(User.id, perm_root))
//         return true;
    
//     if (Permission.has(User.id, perm))
//         return true;
    
//     return false;
// };

// if (User.hasPermission(perm_users_list)) {
//     //
// }