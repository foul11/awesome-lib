import type { Generated, GeneratedAlways } from 'kysely';

export type TableAccessLog<
    AdditionalFields extends Record<string, unknown> = Record<string, unknown>,
> = AdditionalFields & {
    id:                         Generated<number>
    flag:                       number          // BitField
    access_log_set_ip_id:       number | null   // fk, TableSetString, IP
    access_log_set_ua_id:       number | null   // fk, TableSetString, UserAgent
    access_log_set_action_id:   number          // fk, TableSetString, Совершенное действие, название endpoint или любой другой индификатор
    meta:                       string | null   // JSON, дополнительная информация
    created_at:                 GeneratedAlways<string>
};

export interface TableAccessLogTiming {
    id:                         Generated<number>
    access_log_id:              number // fk, TableAccessLog
    access_log_set_timing_id:   number // fk, TableSetString
    timing_ns:                  number // ns, время затраченное на этот этап
}