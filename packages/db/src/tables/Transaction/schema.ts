import type { Generated, GeneratedAlways } from 'kysely';

export interface TableTransaction {
    id:          Generated<number>
    fk_id:       number          // fk, на строку-владельца "счёта"
    flag:        number          // BitField
    amount:      number          // Величина изменения
    remain:      number | null   // Остаток, носит чисто информационный характер, в большинстве случаев дедлайны сломают это значение
    reason_id:   number          // fk, TableSetString
    accept_at:   string | null   // ISO 8601, не может быть заполнен вместе с denied_at
    reject_at:   string | null   // ISO 8601, не может быть заполнен вместе с success_at
    // category_id: number          // fk, Говорит категорию на которую можно потратить баланс, ее нужно указывать для всех нужных положительных amount,
    //                              // если после операции останется баланс 0, значит транзакцию не создаем, если мы можем только списать только часть,
    //                              // то создаем несколько транзакций, у операций которые списывают баланс нужно указывать category_id родительского пополнения
    // TODO: Доработать deadline
    parent_id:   number | null   // fk, self, Родительская транзакция должна так же указывать сама на себя, используется вместе с deadline_at
    deadline_at: string | null   // ISO 8601, по истечению которого транзакция не будет учитывается в подсчёте баланса
    since_at:    string | null   // ISO 8601, дата после наступления которой, транзакция будет начислена на счет
    created_at:  GeneratedAlways<string>
}