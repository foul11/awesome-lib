import type { KeysOfUnion, Simplify } from 'type-fest';

export {
    Stringble,
    prefix as locale_prefix,
    hereDocJs as hereDoc,
    template as t,
    raw as r,
    md as md,
} from './utils';

export interface LocalizationItem {
    [id: string]:
        | string
        | ((args: any) => string)
}

export type LocalizationObject = { [K in string]: LocalizationItem };

export type GetLocaleList<
    T extends InstanceType<typeof Localization<any, any>>,
> = T extends InstanceType<typeof Localization<any, infer L & string>> ? L : never;

export type GetLocalesByPrefix<
    T extends InstanceType<typeof Localization<any, any>>,
    P extends string,
> = T extends InstanceType<typeof Localization<infer Ls & LocalizationObject, any>>
    ? Simplify<KeysOfUnion<Ls[keyof Ls]>> extends `${infer K}`
        ? K extends `${P}${infer K2}` // 1 раз extends сделать не получилось, typescript не может вывести ключи и проверить шаблоны строк
            ? `${P}${K2}`             // Он хочет что бы разделил их на 2 части, тогда выводит правильный тип
            : never
        : never
    : never;

export class Localization<
    LOCALES extends LocalizationObject,
    LOCALE_NAME extends keyof LOCALES & string,
> {
    locales: LOCALES;
    locale_default: LOCALE_NAME;
    
    constructor(locales: LOCALES, locale_default: keyof LOCALES & string) {
        this.locale_default = locale_default as any;
        this.locales = locales;
    }
    
    get<
        LOCALE_ITEM_ID extends keyof LOCALES[LOCALE_NAME] & string,
        LOCALE_ITEM_TYPE extends LOCALES[LOCALE_NAME][LOCALE_ITEM_ID],
        LOCALE_ITEM_FUNC_ARGS extends
            LOCALE_ITEM_TYPE extends (...args: any) => any
                ? Parameters<LOCALE_ITEM_TYPE>[0]
                : {},
    >(id: LOCALE_ITEM_ID, args?: LOCALE_ITEM_FUNC_ARGS, locale?: LOCALE_NAME) {
        const curr_locale = locale ?? this.locale_default;
        const str = this.locales[curr_locale][id];
        
        if (typeof str === 'string')
            return str.trim();
        
        if (typeof str === 'function')
            return str(args ?? {})
                    .trim();
        
        throw new Error(`Localization ${curr_locale} / ${id} not found`);
    }
    
    md2: typeof this.get = (id, args?, locale?) => {
        return this
            .get(id, args, locale)
            .replace(/(?<!\\)([_*[\]()~`>#+=|{}.!-])|\\/g, (match, p1) => p1 ? `\\${p1}` : '');
    };
}