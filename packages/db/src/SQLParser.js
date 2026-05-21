/* eslint-disable no-useless-assignment, jsdoc/reject-any-type, @stylistic/function-call-spacing */
// spell-checker: words sqlv AUTOINCREMENT SAVEPOINT sqlited
import { Object_entries, Object_keys, regex } from '@foul11/awesome';

/** @param {string | TemplateStringsArray} str */
export function sqlv(str) {
    if (Array.isArray(str))
        str = str[0];
    
    const arr = str.toString().split(/\r?\n/);
    
    for (let i = 0; i < arr.length; i++) {
        switch (true) {
            case arr[i].trim().startsWith('INSERT INTO'):
            case arr[i].trim().startsWith('ALTER TABLE'):
            case arr[i].trim().startsWith('DROP TABLE'):
            case arr[i].trim().startsWith('PRAGMA "main".foreign_key_check'):
                arr[i] = arr[i] + ';';
                break;
        }
    }
    
    return arr.join('\n');
}

export class SQLParser {
    /**
     * @typedef {string | number | null} sqlite_value
     * 
     * @typedef {{
     *  scheme_parts: string[],
     *  name: string,
     * }} sqlite_schema
     * 
     * @typedef {{
     *   name: string,
     *   as: string?,
     *   sort: 'ASC' | 'DESC' | null,
     * }} sqlite_column
     * 
     * @typedef {{
     *  type: 'PRAGMA',
     *  name: sqlite_schema,
     *  value: sqlite_value,
     * }} sqlite_PRAGMA
     * 
     * @typedef {{
     *  type: 'SAVEPOINT',
     *  savepoint_name: string?,
     * }} sqlite_SAVEPOINT
     * 
     * @typedef {{
     *  type: 'RELEASE',
     *  savepoint_name: string?,
     * }} sqlite_RELEASE
     * 
     * @typedef {{
     *  type: 'SELECT',
     *  distinct: boolean,
     *  columns: Exclude<sqlite_column, 'sort'>[],
     *  from: sqlite_schema[],
     *  where: string?,
     *  group_by: string?,
     *  order_by: string?,
     *  limit: number?,
     *  offset: number?,
     * }} sqlite_SELECT
     * 
     * @typedef {{
     *  table: sqlite_schema,
     *  columns: string[],
     *  constraints: string?,
     * }} sqlite_references
     * 
     * @typedef {'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'DATETIME'} sqlite_types
     * 
     * @typedef {{
     *  name: string,
     *  type: sqlite_types,
     *  primary: boolean,
     *  auto_increment: boolean,
     *  not_null: boolean,
     *  unique: boolean,
     *  default: sqlite_value,
     *  references: sqlite_references?,
     * }} sqlite_column_def
     * 
     * @typedef {Omit<Omit<sqlite_column_def, 'name'>, 'type'>} sqlite_constraint
     * 
     * @typedef {{
     *  type: 'CREATE_TABLE',
     *  table: sqlite_schema,
     *  if_not_exists: boolean,
     *  columns: sqlite_column_def[],
     * }} sqlite_CREATE_TABLE
     * 
     * @typedef {{
     *  type: 'CREATE_INDEX',
     *  name: sqlite_schema,
     *  table_name: string,
     *  if_not_exists: boolean,
     *  unique: boolean,
     *  columns: Omit<sqlite_column, 'as'>[],
     * }} sqlite_CREATE_INDEX
     * 
     * @typedef {{
     *  type: 'VALUES',
     *  values: (number | string)[],
     * }} sqlite_VALUES
     * 
     * @typedef {{
     *  type: 'INSERT',
     *  table: sqlite_schema,
     *  columns: Omit<Omit<sqlite_column, 'as'>, 'sort'>[],
     *  expr: sqlite_VALUES | sqlite_SELECT,
     * }} sqlite_INSERT
     * 
     * @typedef {{
     *  type: 'DROP_TABLE',
     *  table: sqlite_schema,
     *  if_not_exists: boolean,
     * }} sqlite_DROP_TABLE
     * 
     * @typedef {{
     *  type: 'DROP_INDEX',
     *  name: sqlite_schema,
     *  if_not_exists: boolean,
     * }} sqlite_DROP_INDEX
     * 
     * @typedef {{
     *  type: 'ALTER_RENAME_TO',
     *  table: sqlite_schema,
     *  to: string,
     * }} sqlite_ALTER_RENAME_TO
     * 
     * @typedef {{
     *  type: 'ALTER_RENAME_COLUMN',
     *  table: sqlite_schema,
     *  from: string,
     *  to: string,
     * }} sqlite_ALTER_RENAME_COLUMN
     * 
     * @typedef {{
     *  type: 'ALTER_ADD',
     *  table: sqlite_schema,
     *  column: sqlite_column_def,
     * }} sqlite_ALTER_ADD
     * 
     * @typedef {{
     *  type: 'ALTER_DROP',
     *  table: sqlite_schema,
     *  column_name: string,
     * }} sqlite_ALTER_DROP
     * 
     * @typedef {sqlite_PRAGMA              |
     *           sqlite_SAVEPOINT           |
     *           sqlite_RELEASE             |
     *           sqlite_SELECT              |
     *           sqlite_CREATE_TABLE        |
     *           sqlite_CREATE_INDEX        |
     *           sqlite_VALUES              |
     *           sqlite_INSERT              |
     *           sqlite_DROP_TABLE          |
     *           sqlite_DROP_INDEX          |
     *           sqlite_ALTER_RENAME_TO     |
     *           sqlite_ALTER_RENAME_COLUMN |
     *           sqlite_ALTER_ADD           |
     *           sqlite_ALTER_DROP
     * } sqlite_EXPRS
     */
    
    /**
     * @param {string} sql
     * @param {string} char
     */
    static splitQStrByChar(sql, char) {
        const re = new RegExp(`((?=["'])(?:"[^"\\\\]*(?:\\\\[\\s\\S][^"\\\\]*)*"|'[^'\\\\]*(?:\\\\[\\s\\S][^'\\\\]*)*')|${char})`, 'g');
        const out = /** @type {string[]} */ ([]);
        const acc = /** @type {string[]} */ ([]);
        
        /** @type {string[]} */
        const res = sql.split(re);
        
        for (const str of res) {
            if (!str)
                continue;
            
            acc.push(str);
            
            if (str === char) {
                out.push(acc.join(''));
                acc.length = 0;
            }
        }
        
        if (acc.length)
            out.push(acc.join(''));
        
        return out;
    }
    
    /**
     * @param {string} input
     * @returns {sqlite_schema}
     */
    static sqliteSchema(input) {
        const out = /** @type {string[]} */ ([]);
        
        // Регулярка объявлена вне regex функции, потому что на "\\" она багуется и не компилируется
        const res = input.matchAll(/(?:(?=["'])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*')|\.|[^.]+)/ig);
        
        for (const match of res) {
            const s = match[0];
            
            if (!s || s === '.')
                continue;
            
            if (s[0] === "'" || s[0] === '"') {
                out.push(s.slice(1, -1));
                continue;
            }
            
            out.push(s);
        }
        
        if (!out.length)
            throw new Error(`Can't parse name (empty): ${input}`);
        
        return {
            scheme_parts: out.splice(0, out.length - 1),
            name: out[out.length - 1],
        };
    }
    
    /** @param {string | null | undefined} input */
    static sqliteName(input) {
        if (!input)
            throw new Error(`Can't parse name (empty): ${input}`);
        
        if (input[0] === '"')
            return input.slice(1, -1);
        
        return input;
    }
    
    /**
     * @param {string} input
     * @returns {sqlite_column[]}
     */
    static sqliteColumns(input) {
        const out = /** @type {ReturnType<typeof SQLParser['sqliteColumns']>} */ ([]);
        const columns = SQLParser.splitQStrByChar(input, ',')
            .map(str => str.trim().match(SQLParser.regex.column));
        
        for (const column of columns) {
            if (!column || !column.groups)
                throw new Error(`Can't parse column: ${input}`);
            
            const sort = /** @type {string | null} */ (column.groups.sort?.toUpperCase() ?? null);
            
            if (sort && sort !== 'ASC' && sort !== 'DESC')
                throw new Error(`Can't parse sort: ${input}`);
            
            out.push({
                name: SQLParser.sqliteName(column.groups.name),
                as:   column.groups.as ? SQLParser.sqliteName(column.groups.as) : null,
                sort: /** @type {null | 'ASC' | 'DESC'} */ (sort),
            });
        }
        
        return out;
    }
    
    /**
     * @param {RegExp} rgx
     * @param {string} input
     */
    static matchAllGroups(rgx, input) {
        /** @type {Record<string, string | undefined>} */
        const out = {};
        const matches = input.matchAll(rgx);
        
        for (const match of matches)
            Object.assign(out, ...Object_entries(match.groups ?? {}).map(([ k, v ]) => (v === undefined ? {} : { [k]: v })));
        
        return { groups: out };
    }
    
    /**
     * @param {string} input
     * @returns {sqlite_column_def[]}
     */
    static sqliteColumnsDef(input) {
        const out = /** @type {ReturnType<typeof SQLParser['sqliteColumnsDef']>} */ ([]);
        const columns = SQLParser.splitQStrByChar(input, ',')
            .map(str => str.trim().match(SQLParser.regex.column_def));
        
        for (const column of columns) {
            if (!column || !column.groups)
                throw new Error(`Can't parse column: ${input}`);
            
            if (!column.groups.name) { // if not name then it's table constraint
                if (!column.groups.table_constraint)
                    throw new Error(`Can't parse table constraint or name: ${input}`);
                
                const table_constraint = column.groups.table_constraint.trim()
                    .match(SQLParser.regex.table_constraint);
                
                if (!table_constraint || !table_constraint.groups)
                    throw new Error(`Can't parse table constraint: ${input}`);
                
                const inline_columns = /** @type {sqlite_column[]} */ ([]);
                const props = /** @type {{ primary?: boolean, unique?: boolean, auto_increment?: boolean }} */ ({});
                
                switch (true) {
                    case !!table_constraint.groups.primary_key_expr:
                        inline_columns.push(
                            ...SQLParser.sqliteColumns(table_constraint.groups.primary_key_expr),
                        );
                        
                        if (table_constraint.groups.auto_increment)
                            props.auto_increment = true;
                        
                        props.primary = true;
                        break;
                        
                    case !!table_constraint.groups.unique_expr:
                        inline_columns.push(
                            ...SQLParser.sqliteColumns(table_constraint.groups.unique_expr),
                        );
                        
                        props.unique = true;
                        break;
                        
                    default:
                        throw new Error(`Can't parse table constraint type: ${input}`);
                }
                
                const inline_names = new Set(inline_columns.map(c => c.name));
                
                for (const inline_column of out.filter(c => inline_names.has(c.name))) {
                    for (const prop of Object_keys(props)) {
                        if (props[prop] === undefined)
                            continue;
                        
                        inline_column[prop] = props[prop];
                    }
                }
                
                continue;
            }
            
            const constraints = /** @type {sqlite_constraint} */ ({
                auto_increment: false,
                not_null: false,
                primary: false,
                unique: false,
                default: null,
                references: null,
            });
            
            if (column.groups.constraint) {
                const column_constraint = SQLParser.matchAllGroups(SQLParser.regex.constraint, column.groups.constraint.trim());
                                            // .match(SQLParser.regex.constraint);
                
                if (!column_constraint || !column_constraint.groups)
                    throw new Error(`Can't parse column constraint: ${column.groups.constraint}`);
                
                if (column_constraint.groups.auto_increment)
                    constraints.auto_increment = true;
                
                if (column_constraint.groups.not_null)
                    constraints.not_null = true;
                
                if (column_constraint.groups.primary_key)
                    constraints.primary = true;
                
                if (column_constraint.groups.unique)
                    constraints.unique = true;
                
                if (column_constraint.groups.default) {
                    const g = column_constraint.groups;
                    
                    if (g.default_expr) {
                        constraints.default = g.default_expr;
                    } else {
                        constraints.default = SQLParser.sqliteValue(g.default_number ?? g.default_literal ?? g.default_const);
                    }
                }
                
                if (column_constraint.groups.references)
                    constraints.references = {
                        table:   SQLParser.sqliteSchema   (column_constraint.groups.references_table ?? ''),
                        columns: SQLParser.splitQStrByChar(column_constraint.groups.columns_def_expr ?? '', ',').map(v => SQLParser.sqliteName(v.trim())),
                        constraints: column_constraint.groups.references_constraint ?? null,
                    };
            }
            
            /** @type {string | null} */
            const type = column.groups.type?.toUpperCase() ?? null;
            
            if (!type)
                throw new Error(`Can't parse column type: ${input}`);
            
            out.push({
                name: SQLParser.sqliteName(column.groups.name),
                type: /** @type {sqlite_types} */ (type),
                ...constraints,
            });
        }
        
        return out;
    }
    
    /**
     * @param {string | null | undefined} input
     * @returns {sqlite_value}
     */
    static sqliteValue(input) {
        input = SQLParser.strOrNull(input);
        
        if (input === null)
            return null;
        
        const num = parseFloat(input);
        
        if (!isNaN(num))
            return num;
        
        return input;
    }
    
    /** @param {string | null | undefined} str */
    static strOrNull(str) {
        if (str === null || str === undefined)
            return null;
        
        if (str[0] === "'")
            return str.slice(1, -1);
        
        return str;
    }
    
    /** @param {string | null | undefined} str */
    static intOrNull(str) {
        if (str === null || str === undefined)
            return null;
        
        return parseInt(str);
    }
    
    static regex = {
        PRAGMA: regex `
            ^(?:
                PRAGMA
                (?: \s+       (?<name>     \S + ))?
                (?: \s* = \s* (?<value> [\s\S]+ ))?
            ;?)$
        ` `i`,
        
        SAVEPOINT: regex `
            ^(?:
                SAVEPOINT
                (?: \s+ (?<name> \S+ ))?
            ;?)$
        ` `i`,
        
        RELEASE: regex `
            ^(?:
                RELEASE
                (?: \s+ (?<name> \S+ ))?
            ;?)$
        ` `i`,
        
        SELECT: regex`
            ^(?:
                SELECT
                (?: \s+ (?<distinct> DISTINCT                                    ))?
                (?: \s+ (?<columns>  [\s\S]+                                     ))
                (?: \s+ (?<from>     FROM         \s+ (?<table _expr>  [\s\S]+?) ))
                (?: \s+ (?<where>    WHERE        \s+ (?<where _expr>  [\s\S]+?) ))?
                (?: \s+ (?<group_by> GROUP \s+ BY \s+ (?<group _expr>  [\s\S]+?) ))?
                (?: \s+ (?<order_by> ORDER \s+ BY \s+ (?<order _expr>  [\s\S]+?) ))?
                (?: \s+ (?<limit>    LIMIT        \s+ (?<limit _expr>  [\s\S]+?) ))?
                (?: \s+ (?<offset>   OFFSET       \s+ (?<offset_expr>  [\s\S]+?) ))?
            ;?)$
        ` `i`,
        
        CREATE_TABLE: regex`
            ^(?:
                CREATE \s+ TABLE
                (?: \s+ (?<if_not_exists>   IF \s+ NOT \s+ EXISTS             ))?
                (?: \s+ (?<name>            (?<name_expr>        [\s\S]+?)    ))
                (?: \s+ (?<columns_def>  \( (?<columns_def_expr> [\s\S]+?) \) ))
            ;?)$
        ` `i`,
        
        CREATE_INDEX: regex `
            ^(?:
                CREATE
                (?: \s+ (?<unique>         UNIQUE                            ))?
                (?: \s+ (?:                INDEX                             ))
                (?: \s+ (?<if_not_exists>  IF \s+ NOT \s+ EXISTS             ))?
                (?: \s+ (?<name>           (?<name_expr>        [\s\S]+?)    ))
                (?: \s+ (?:                ON                                ))
                (?: \s+ (?<table>          (?<table_expr>       [\s\S]+?)    ))
                (?: \s+ (?<columns>     \( (?<columns_expr>     [\s\S]+?) \) ))
            ;?)$
        ` `i`,
        
        VALUES: regex `
            ^(?:
                VALUES
                (?: \s+ \( (?<values>   [\s\S]+?) \) )
            ;?)$
        ` `i`,
        
        INSERT: regex `
            ^(?:
                INSERT \s+ INTO
                (?: \s+ (?<table>          (?<table_expr>    [\s\S]+?)    ))
                (?: \s+ (?<columns>     \( (?<columns_expr>  [\s\S]+?) \) ))
                (?:
                    (?: \s+ (?<values_expr> VALUES \s+  \( (?:   [\s\S]+?) \) )) |
                    (?: \s+ (?<select_expr> SELECT \s+     (?:   [\s\S]+?)    ))
                )
            ;?)$
        ` `i`,
        
        DROP: regex `
            ^(?:
                DROP
                (?:
                    (?: \s+ TABLE) |
                    (?: \s+ INDEX)
                )
                (?: \s+ (?<if_not_exists> IF \s+ NOT \s+ EXISTS ))?
                (?: \s+ (?<name>          [\s\S]+?              ))
            ;?)$
        ` `i`,
        
        ALTER_TABLE: regex `
            ^(?:
                ALTER \s+ TABLE
                (?: \s+ (?<table>          (?<table_expr>    [\s\S]+?)    ))
                (?:
                    (?:
                        (?: \s+ RENAME \s+ TO \s+            (?<rename_to > [\s\S]+? )) |
                        (?: \s+ RENAME \s+ (?: COLUMN \s+ )?
                            (?<rename_col_from> [\s\S]+? )
                            (?: \s+ TO \s+ )
                            (?<rename_col_to>   [\s\S]+? )
                        ) |
                        (?: \s+ DROP   \s+ (?: COLUMN \s+ )? (?<drop_col> [\s\S]+? ))
                    ) |
                        (?: \s+ ADD    \s+ (?: COLUMN \s+ )? (?<add_col>  [\s\S]+? ))
                )
            ;?)$
        ` `i`,
        
        column: regex`
            ^(?:
                (?:         (?<name>                       [\s\S]+?    ))
                (?:
                    (?: \s+ (?<as>   AS \s+ (?<as_expr>    [\s\S]+?  ) ))? |
                    (?: \s+ (?<sort>        (?<sort_expr>  ASC | DESC) ))?
                )
            ,?)$
        ` `i`,
        
        column_def: regex`
            ^(?:
                (?:
                    (?<table_constraint> (?: PRIMARY | UNIQUE | CHECK | FOREIGN ) [\s\S]+ )
                ) |
                (?:     (?<name>       [\s\S]+?                                       ))
                (?: \s+ (?<type>       (?: TEXT | INTEGER | REAL | BLOB | DATETIME )  ))?
                (?: \s+ (?<constraint> [\s\S]+?                                       ))?
            ,?)$
        ` `i`,
        
        constraint: regex`
            (?:
                // (?: \s* ) |
                (?:
                    (?<primary_key>  PRIMARY \s+ KEY 
                        (?:     (?<primary_key_sort> ASC | DESC    ))?
                        (?: \s+ (?<auto_increment>   AUTOINCREMENT ))?
                    )
                ) |
                (?: (?<not_null>     NOT     \s+ NULL                              )) |
                (?: (?<unique>       UNIQUE                                        )) |
                (?: (?<default>      DEFAULT \s+
                    (?:
                        (?<default_expr> \(      [\s\S]+      \) ) |
                        (?<default_number>  [+-]?  [\d]+         ) |
                        (?<default_literal> ['"] [\s\S]+  ['"]   ) |
                        (?<default_const>   TRUE | FALSE | NULL  )
                    )
                )) |
                (?:
                    (?<references> REFERENCES \s+
                        (?<references_table> [\S]+)
                        (?: \s* (?<columns_def>  \( (?<columns_def_expr> [\s\S]+?) \) ))?
                        (?: \s* (?<references_constraint> (?:
                            (?:    \s*
                                ON \s+
                                (?: DELETE | UPDATE ) \s+
                                (?:
                                    SET \s+ NULL    |
                                    SET \s+ DEFAULT |
                                    CASCADE         |
                                    RESTRICT        |
                                    NO  \s+ ACTION
                                )
                            ) |
                            (?: \s* MATCH \s+ [\S]+) |
                            (?: \s*
                                (?: NOT \s+ )?
                                DEFERRABLE
                                (?:
                                    \s+ INITIALLY \s+ DEFERRED |
                                    \s+ INITIALLY \s+ IMMEDIATE
                                )?
                            ))+
                        ))?
                    )
                )
            )
        ` `ig`,
        
        table_constraint: regex`
            ^(?:
                (?:
                    (?<primary_key>  PRIMARY \s+ KEY
                        \(
                            (?:     (?<primary_key_expr> [\s\S]+?         ))
                            (?: \s+ (?<auto_increment>   AUTOINCREMENT    ))?
                        \)
                    )
                ) |
                (?: (?<unique>       UNIQUE  \s+      \((?<unique_expr>      [\s\S]+?)\)   ))
            )$
        ` `i`,
    };
    
    /** @param {string} sql */
    static parse(sql) {
        const out = /** @type {sqlite_EXPRS[]} */ ([]);
        const semi_split = SQLParser.splitQStrByChar(sql, ';');
        
        for (const raw_str of semi_split) {
            const str_expr = raw_str.trim();
            
            switch (true) {
                case /^PRAGMA/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.PRAGMA);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'PRAGMA',
                        name: SQLParser.sqliteSchema(parse.groups.name),
                        value: SQLParser.sqliteValue(parse.groups.value),
                    });
                    
                    break;
                }
                
                case /^SAVEPOINT/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.SAVEPOINT);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'SAVEPOINT',
                        savepoint_name: SQLParser.strOrNull(parse.groups.name),
                    });
                    
                    break;
                }
                
                case /^RELEASE/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.RELEASE);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'RELEASE',
                        savepoint_name: SQLParser.strOrNull(parse.groups.name),
                    });
                    
                    break;
                }
                
                case /^SELECT/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.SELECT);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'SELECT',
                        distinct: !!parse.groups.distinct,
                        columns:  SQLParser.sqliteColumns(parse.groups.columns),
                        from: (
                            SQLParser.splitQStrByChar(parse.groups.table_expr, ',')
                                .map(t => SQLParser.sqliteSchema(t))
                        ),
                        where:    SQLParser.strOrNull(parse.groups.where_expr ),
                        group_by: SQLParser.strOrNull(parse.groups.group_expr ),
                        order_by: SQLParser.strOrNull(parse.groups.order_expr ),
                        offset:   SQLParser.intOrNull(parse.groups.offset_expr),
                        limit:    SQLParser.intOrNull(parse.groups.limit_expr ),
                    });
                    
                    break;
                }
                
                case /^CREATE TABLE/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.CREATE_TABLE);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'CREATE_TABLE',
                        if_not_exists: !!parse.groups.if_not_exists,
                        table:         SQLParser.sqliteSchema(parse.groups.name_expr),
                        columns:       SQLParser.sqliteColumnsDef(parse.groups.columns_def_expr),
                    });
                    
                    break;
                }
                
                case /^CREATE/i.test(str_expr): { // if not CREATE TABLE then CREATE INDEX
                    const parse = str_expr.match(SQLParser.regex.CREATE_INDEX);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'CREATE_INDEX',
                        name:          SQLParser.sqliteSchema(parse.groups.name_expr),
                        table_name:    SQLParser.sqliteName(parse.groups.table_expr),
                        if_not_exists: !!parse.groups.if_not_exists,
                        unique:        !!parse.groups.unique,
                        columns:       SQLParser.sqliteColumns(parse.groups.columns_expr),
                    });
                    
                    break;
                }
                
                case /^INSERT/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.INSERT);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    const expr = SQLParser.parse(`${parse.groups.values_expr || parse.groups.select_expr};`)[0];
                    
                    if (!expr || (expr.type !== 'SELECT' && expr.type !== 'VALUES'))
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'INSERT',
                        table:         SQLParser.sqliteSchema(parse.groups.table_expr),
                        columns:       SQLParser.sqliteColumns(parse.groups.columns_expr),
                        expr:          expr,
                    });
                    
                    break;
                }
                
                case /^VALUES/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.VALUES);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    const values = SQLParser.splitQStrByChar(parse.groups.values, ',')
                        .map(v => v[0] !== '"' ? parseFloat(v) : v.slice(1, -1));
                    
                    out.push({
                        type: 'VALUES',
                        values,
                    });
                    
                    break;
                }
                
                case /^DROP TABLE/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.DROP);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'DROP_TABLE',
                        if_not_exists: !!parse.groups.if_not_exists,
                        table: SQLParser.sqliteSchema(parse.groups.name),
                    });
                    
                    break;
                }
                
                case /^DROP INDEX/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.DROP);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    out.push({
                        type: 'DROP_INDEX',
                        if_not_exists: !!parse.groups.if_not_exists,
                        name: SQLParser.sqliteSchema(parse.groups.name),
                    });
                    
                    break;
                }
                
                case /^ALTER TABLE/i.test(str_expr): {
                    const parse = str_expr.match(SQLParser.regex.ALTER_TABLE);
                    
                    if (!parse || !parse.groups)
                        throw new Error(`Can't parse: ${str_expr}`);
                    
                    const table = SQLParser.sqliteSchema(parse.groups.table_expr);
                    
                    switch (true) {
                        case !!parse.groups.rename_to:
                            out.push({
                                type: 'ALTER_RENAME_TO',
                                table,
                                to: SQLParser.sqliteName(parse.groups.rename_to),
                            });
                            break;
                            
                        case !!parse.groups.rename_col:
                            out.push({
                                type: 'ALTER_RENAME_COLUMN',
                                table,
                                from: SQLParser.sqliteName(parse.groups.rename_col_from),
                                to: SQLParser.sqliteName(parse.groups.rename_col_to),
                            });
                            break;
                            
                        case !!parse.groups.add_col: {
                            const column = SQLParser.sqliteColumnsDef(parse.groups.add_col)[0];
                            
                            if (!column)
                                throw new Error(`Can't parse: ${str_expr}`);
                            
                            out.push({
                                type: 'ALTER_ADD',
                                table,
                                column: column,
                            });
                            break;
                        }
                            
                        case !!parse.groups.drop_col:
                            out.push({
                                type: 'ALTER_DROP',
                                table,
                                column_name: SQLParser.sqliteName(parse.groups.drop_col),
                            });
                            break;
                            
                        default:
                            throw new Error(`Can't parse: ${str_expr}`);
                    }
                    
                    break;
                }
                
                case str_expr.trim() === '':
                    break;
                
                default:
                    throw new Error(`Can't parse (default): ${str_expr}`);
            }
        }
        
        return out;
    }
}

export class SQLiteDebugger {
    /*
        TODO:
            Класс который будет разбивать операции с sqlv на отдельные части,
            угадывать что было сделано RENAME/ADD COLUMN/REMOVE COLUMN/EDIT COLUMN и тд,
            и красивенько выводить в stdout, показывать успешные операции, выполнять транзакции
    */
    // /** @param {import('better-sqlite3').Database} db */
    /** @param {any} db */
    constructor(db) {
        this.db = db;
    }
    
    /**
     * @param {string} table
     * @returns {{
     *  cid: number,
     *  name: string,
     *  type: 'INTEGER' | 'REAL' | 'TEXT' | 'BLOB' | 'NUMERIC',
     *  notnull: boolean,
     *  dflt_value: string | null,
     *  pk: boolean,
     * }[]} 
     */
    tableInfo(table) {
        return this.db.prepare(`SELECT * FROM pragma_table_info('${table}')`)
            .all()
            .map((/** @type {*} */ r) => { return { ...r, notnull: !!r.notnull, pk: !!r.pk }; });
    }
    
    /**
     * @returns {{
     *  type: 'index' | 'table',
     *  name: string,
     *  tbl_name: string,
     *  rootpage: number,
     *  sql: string,
     * }[]}
     */
    masterTable() {
        return /** @type {*} */ (this.db.prepare(`SELECT * FROM sqlite_master`)
            .all().filter((/** @type {*} */ r) => r.name != 'sqlite_sequence'));
    }
    
    /**
     * @typedef {number | {
     *  from: number,
     *  to: number,
     * }} sqlited_index
     * 
     * @typedef {{
     *  type: 'LINK_SQLITE',
     *  index: number,
     *  link: sqlite_EXPRS,
     *  linked: Map<sqlited_link_logic_sub_type, Set<sqlited_link_logic | sqlited_link_sqlite>>,
     * }} sqlited_link_sqlite
     * 
     * @typedef {'SAVE/RELEASE' | 'LINK_TABLE'} sqlited_link_logic_sub_type
     * 
     * @typedef {{
     *  type: 'LINK',
     *  sub_type: sqlited_link_logic_sub_type,
     *  index: sqlited_index,
     *  child: (sqlited_link_logic | sqlited_link_sqlite)[],
     * }} sqlited_link_logic
     */
    
    /* 
        TODO:
            t1 - новая
            t2 - старая
            [ ->] - необязательная операция
            {number [/ link]} - номер/ссылка
            {...S} - Миграция схемы
            {...D} - Миграция данных
            
            * {1 S} [Добавление столбца (t2) ->] Создание (t1) -> перенос данных (t2 -> t1) -> удаление (t2) -> переименование (t1)
                - Переименование (t2)                [При условии, что столбцы те же самые]
                - Добавление/Удаление столбца (t2)   [При условии, что столбцы создаваемых таблиц отличаются от исходных]
                - Частичный перенос (t2)             [При условии, что столбцы такие же, но выбраны для переноса не все]
                - Изменения типа данных (t2)         [При условии, что у любого столба отличается тип данных от исходного]
                - Изменения дефолтного значений (t2) [При условии, что у любого столба отличается дефолтное значение от исходного]
                - Изменение аттрибутов uniq, ...(t2) [При условии, что у любого столба отличается аттрибут uniq, ... от исходного]
                
            * {2 S / before 1} Создание индексов (t2)
                - Пересоздание индексов (t1)         [При условии, что индексы такие же в двух таблицах до и после]
                - Добавление/Удаление индексов (t2)  [При условии, что индексы создаваемых таблиц отличаются от исходных, а так же может значит ошибку в случае если не будет хватать индекса]
            
            * {3 D} Добавление данных (t2)
                - Просто вставка данных в таблицу (t2)
                
            * {4 D} Удаление данных (t2)
                - Просто удаление данных из таблицы (t2)
    */
    
    /**
     * @param {sqlited_index?} i1
     * @param {sqlited_index?} i2
     */
    static sql_idx_min(i1, i2) {
        if (i1 === null && i2 === null)
            return null;
        
        if (i1 !== null && typeof i1 == 'object')
            i1 = Math.min(i1.from, i1.to);
        
        if (i2 !== null && typeof i2 == 'object')
            i2 = Math.min(i2.from, i2.to);
        
        if (i1 === null)
            return i2;
        
        if (i2 === null)
            return i1;
        
        return Math.min(i1, i2);
    }
    
    /**
     * @param {sqlited_index?} i1
     * @param {sqlited_index?} i2
     */
    static sql_idx_max(i1, i2) {
        if (i1 === null && i2 === null)
            return null;
        
        if (i1 !== null && typeof i1 == 'object')
            i1 = Math.max(i1.from, i1.to);
        
        if (i2 !== null && typeof i2 == 'object')
            i2 = Math.max(i2.from, i2.to);
        
        if (i1 === null)
            return i2;
        
        if (i2 === null)
            return i1;
        
        return Math.max(i1, i2);
    }
    
    /**
     * @param {sqlited_index?} i1
     * @param {sqlited_index?} i2
     */
    static sql_idx_outRange(i1, i2) {
        const i1min = SQLiteDebugger.sql_idx_min(i1, null);
        const i1max = SQLiteDebugger.sql_idx_max(i1, null);
        const i2min = SQLiteDebugger.sql_idx_min(i2, null);
        const i2max = SQLiteDebugger.sql_idx_max(i2, null);
        
        if (i1min === null || i1max === null || i2min === null || i2max === null)
            return null;
        
        return i1min < i2min && i1max > i2max;
    }
    
    /**
     * @param {sqlited_index?} i1
     * @param {sqlited_index?} i2
     */
    static sql_idx_inRange(i1, i2) {
        const i1min = SQLiteDebugger.sql_idx_min(i1, null);
        const i1max = SQLiteDebugger.sql_idx_max(i1, null);
        const i2min = SQLiteDebugger.sql_idx_min(i2, null);
        const i2max = SQLiteDebugger.sql_idx_max(i2, null);
        
        if (i1min === null || i1max === null || i2min === null || i2max === null)
            return null;
        
        return (
            i1min >= i2min && i1min <= i2max &&
            i1max <= i2max && i1max >= i2min
        );
    }
    
    /**
     * @param {sqlited_index?} i1
     * @param {sqlited_index?} i2
     */
    static sql_idx_invalidRange(i1, i2) {
        const outRange = SQLiteDebugger.sql_idx_outRange(i1, i2);
        const inRange = SQLiteDebugger.sql_idx_inRange(i1, i2);
        
        return !outRange && !inRange;
    }
    
    /**
     * @param {sqlited_link_sqlite[]} links
     * @param {sqlited_link_sqlite} link
     * @param {sqlited_link_logic_sub_type} sub_type
     * @param {(link: sqlited_link_sqlite, input: sqlited_link_sqlite) => boolean} predicate
     * @returns {sqlited_link_logic[]}
     */
    link_for_predicate(links, link, sub_type, predicate) {
        if (!link.linked.has(sub_type))
            link.linked.set(sub_type, new Set([ link ]));
        
        /** @type {sqlited_link_sqlite[]} */
        const out = [ link ];
        const link_linked = link.linked.get(sub_type);
        
        if (!link_linked)
            throw new Error('link_linked is null');
        
        for (const l of links) {
            if (!l.linked.has(sub_type))
                l.linked.set(sub_type, new Set([ l ]));
            
            const l_linked = l.linked.get(sub_type);
            
            if (!l_linked)
                throw new Error('l_linked is undefined');
            
            if (link_linked.has(l))
                continue;
            
            if (predicate(link, l)) {
                link_linked.add(l);
                l_linked.add(link);
                
                out.push(l);
            }
        }
        
        if (!out.length)
            return [];
        
        const i_min = out.reduce((prev, l) => SQLiteDebugger.sql_idx_min(prev, l.index), /** @type {number?} */ (null));
        const i_max = out.reduce((prev, l) => SQLiteDebugger.sql_idx_max(prev, l.index), /** @type {number?} */ (null));
        
        if (i_min === null || i_max === null)
            throw new Error('Index is null');
        
        return [{
            type: 'LINK',
            sub_type,
            child: out,
            index: { from: i_min, to: i_max },
        }];
    }
    
    /** @param {string} sql */
    Heuristics_DBBrowserForSQLite(sql) {
        /** @type {sqlited_link_sqlite[]} */
        const parsed = SQLParser.parse(sql).map((e, i) => {
            return {
                type: 'LINK_SQLITE',
                index: i,
                link: e,
                linked: new Map(),
            };
        });
        
        /** @type {sqlited_link_logic[]} */
        const logics = [];
        
        for (const link of parsed) {
            switch (link.link.type) {
                case 'SAVEPOINT':
                case 'RELEASE':
                    logics.push(...this.link_for_predicate(parsed, link, 'SAVE/RELEASE', (stmt_link, l) => {
                        if ('savepoint_name' in stmt_link.link && 'savepoint_name' in l.link)
                            return stmt_link.link.savepoint_name === l.link.savepoint_name;
                        
                        return false;
                    }));
                    break;
                    
                case 'SELECT':
                case 'CREATE_TABLE':
                case 'INSERT':
                case 'DROP_TABLE':
                case 'ALTER_RENAME_TO':
                case 'ALTER_RENAME_COLUMN':
                case 'ALTER_ADD':
                case 'ALTER_DROP': {
                    let table = null;
                    
                    if ('table' in link.link) {
                        table = new Set(link.link.table.name);
                    } else if ('from' in link.link) {
                        table = new Set(link.link.from.map(t => t.name));
                    } else {
                        throw new Error('table is null');
                    }
                    
                    logics.push(...this.link_for_predicate(parsed, link, 'LINK_TABLE', (stmt_link, l) => {
                        if ('table' in l.link) {
                            return table.has(l.link.table.name);
                        } else if ('from' in l.link) {
                            return l.link.from.some(t => table.has(t.name));
                        }
                        
                        return false;
                    }));
                    
                    break;
                }
            }
        }
        
        console.log(logics);
    }
    
    /** @param {string | TemplateStringsArray} sql */
    execFrom_DBBrowser(sql) {
        if (Array.isArray(sql))
            sql = sql[0];
        
        // this.db.exec(sql.toString());
    }
}
