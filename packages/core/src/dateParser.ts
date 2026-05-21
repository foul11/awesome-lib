import { Object_entries } from '.';
// cSpell:ignore terday, orrow, milli, onth

/**
 * Parse human readable date
 */
export function dateParser(str: string) {
    function matchSuffix(suffix: string) {
        const tRegex = {
            yesterday:   /^yes(terday)?/,
            today:       /^t(od(ay)?)?/,
            tomorrow:    /^tom(orrow)?/,
            now:         /^n(ow)?/,
            millisecond: /^ms|milli(second)?s?/,
            second:      /^sec(ond)?s?/,
            minute:      /^mn|min(ute)?s?/,
            hour:        /^h(our)?s?/,
            week:        /^w(eek)?s?/,
            month:       /^m(onth)?s?/,
            day:         /^d(ay)?s?/,
            year:        /^y(ear)?s?/,
        };
        
        for (const [ key, regex ] of Object_entries(tRegex)) {
            if (regex.test(suffix))
                return key;
        }
        
        return null;
    }
    
    str = str.trim();
    
    const [ , rSign, rCount, rSuffix ] = str.match(/([+-]?)\s*(\d*(?:[.]\d+)?)\s*(\w+)/) ?? [];
    
    const sign = rSign === '-' ? -1 : 1;
    const count = rCount ? parseFloat(rCount) : 1;
    
    switch (matchSuffix(rSuffix)) {
        case 'yesterday':
            return new Date(Date.now() - 86400000);
        case 'today':
            return new Date();
        case 'tomorrow':
            return new Date(Date.now() + 86400000);
        case 'now':
            return new Date();
        case 'millisecond':
            return new Date(Date.now() + count * sign);
        case 'second':
            return new Date(Date.now() + count * 1000 * sign);
        case 'minute':
            return new Date(Date.now() + count * 60 * 1000 * sign);
        case 'hour':
            return new Date(Date.now() + count * 60 * 60 * 1000 * sign);
        case 'week':
            return new Date(Date.now() + count * 7 * 24 * 60 * 60 * 1000 * sign);
        case 'month':
            return new Date(Date.now() + count * 30 * 24 * 60 * 60 * 1000 * sign);
        case 'day':
            return new Date(Date.now() + count * 24 * 60 * 60 * 1000 * sign);
        case 'year':
            return new Date(Date.now() + count * 365 * 24 * 60 * 60 * 1000 * sign);
            
        default:
            throw new Error('Unknown suffix');
    }
}