import { regex } from '.';

const regexs = {
    russian_phone: regex`
        (?:\+?7|8)?
        (?<full>
            [\s/\-.,()]*       // dmtr
            (?<octet_1> \d{3}) // xxx
            [\s/\-.,()]*       // dmtr
            (?<octet_2> \d{3}) // xxx
            [\s/\-.,()]*       // dmtr
            (?<octet_3> \d{2}) // xx
            [\s/\-.,()]*       // dmtr
            (?<octet_4> \d{2}) // xx
        ) // 3 + 3 + 2 + 2 = 10 digits
    ` `i`,
} as const;

export type Validator = (input: string) => Record<string, string> | undefined;
export type Normalizer = (groups: Record<string, string>) => string;

export type ProcessValidationOptions<
    Normalize extends boolean = true,
> = {
    type: Normalize extends true
        ? ValidateTypes & NormalizeTypes
        : ValidateTypes
    normalize?: Normalize
    
    validator?: Validator
    normalizer?: Normalizer
};

export type ValidateTypes = 'russian_phone';
export function validate_type(type: ValidateTypes): Validator {
    const rgx = regexs[type];
    
    return (input: string) => (
        rgx.exec(input.trim())?.groups
    );
}

export type NormalizeTypes = 'russian_phone' | 'confidential_phone';
export function normalize_type(type: NormalizeTypes): Normalizer {
    switch (type) {
        case 'russian_phone':
            return groups => (
                `+7${groups.octet_1}${groups.octet_2}${groups.octet_3}${groups.octet_4}`
            );
        
        case 'confidential_phone':
            return groups => (
                `+7-${groups.octet_1}-***-**-${groups.octet_4}`
            );
    }
    
    throw new Error(`Unknown type: ${type as string}`);
}

export function process_validation<
    Normalize extends boolean = false,
>(input: string | null | undefined, options: ProcessValidationOptions<Normalize>) {
    if (!input)
        return null;
    
    const validator = options.validator ?? validate_type(options.type);
    const normalizer = (options.normalize ?? false)
        ? options.normalizer ?? normalize_type(options.type)
        : null;
    
    const groups = validator(input);
    
    if (!groups)
        return null;
    
    if (!normalizer)
        return input;
    
    return normalizer(groups);
}