import colors from 'colors/safe';
 
import { isWebpack } from '@foul11/awesome';

import { color } from './colors';
import { labels } from './labels';
import { inspect } from 'util';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';

import type winston from 'winston';
import type { InspectOptions } from 'util';

type TransformableInfo = winston.Logform.TransformableInfo;
type Format = winston.Logform.Format;

interface ConsoleFormatOptions {
    showMeta?: boolean
    metaStrip?: string[] | Set<string>
    inspectOptions?: InspectOptions
}

class ConsoleFormat {
    private static readonly reSpaces = /^\s+/;
    private static readonly reSpacesOrEmpty = /^(\s*)/;
    // eslint-disable-next-line no-control-regex
    private static readonly reColor = /\x1B\[\d+m/;
    private static readonly defaultStrip = new Set([ LEVEL, MESSAGE, SPLAT, 'level', 'message', 'ms', 'stack', 'file', 'timestamp', ...labels, '_label' ]);
    // private static readonly defaultStrip = new Set([ LEVEL, MESSAGE, SPLAT, 'level', 'message', 'ms' ]);
    private static readonly chars = {
        singleLine: '▪',
        startLine: '┏',
        line: '┃',
        endLine: '┗',
    };
    
    public constructor(private opts: ConsoleFormatOptions = {}) {
        if (typeof this.opts.showMeta === 'undefined') {
            this.opts.showMeta = true;
        }
        
        if (Array.isArray(this.opts.metaStrip)) {
            this.opts.metaStrip = new Set(this.opts.metaStrip);
        }
    }
    
    private level_aligned(info: TransformableInfo): string {
        // eslint-disable-next-line no-control-regex
        const len = (info[LEVEL] || '').replaceAll(/\x1B\[(?:[0-9]{1,2}(?:;[0-9]{1,2})?)?[m|K]/g, '').length;
        return `${' '.repeat(Math.max(0, 7 - len))}${info.level}`;
    }
    
    private inspector(value: any): string[] {
        const inspector = inspect(value, this.opts.inspectOptions || {});
        return inspector.split('\n');
    }
    
    private pad(message?: string): string {
        const matches = message && message.match(ConsoleFormat.reSpaces);
        
        if (matches?.[0]) {
            return matches[0];
        }
        
        return '';
    }
    
    private ms(info: TransformableInfo): string {
        if (typeof info.ms !== 'string')
            return '';
        
        return color('ms', info.ms.padStart(11, ' '));
        // colors.italic(
        //     colors.dim(`${info.ms.padStart(11, ' ')}`),
        // );
    }
    
    private stack(info: TransformableInfo): string[] {
        const messages: string[] = [];
        
        if (typeof info.stack === 'string') {
            // eslint-disable-next-line unicorn/error-message
            const error = new Error();
            error.stack = info.stack;
            
            messages.push(
                ...this.inspector(error),
            );
        }
        
        return messages;
    }
    
    private filteredMeta(info: TransformableInfo): string[] {
        const messages: string[] = [];
        const stripped = { ...info };
        
        ConsoleFormat.defaultStrip.forEach(e => delete stripped[e]);
        this.opts.metaStrip?.forEach(e => delete stripped[e]);
        
        if (Object.keys(stripped).length > 0) {
            messages.push(
                ...this.inspector(stripped),
            );
        }
        
        return messages;
    }
    
    private getColor(str: string): string {
        const colorMatch = str.match(ConsoleFormat.reColor);
        
        if (colorMatch?.[0]) {
            return colorMatch[0];
        }
        
        return '';
    }
    
    private get_line_char(idx: number, len: number): string {
        if (len === 1)
            return ConsoleFormat.chars.singleLine;
        
        if (idx === 0)
            return ConsoleFormat.chars.startLine;
        
        if (idx === len - 1)
            return ConsoleFormat.chars.endLine;
        
        return ConsoleFormat.chars.line;
    }
    
    private wrap_message(info: TransformableInfo, messages: string[]): string {
        const pad = this.pad(messages[0]);
        const color_level = this.getColor(info.level);
        const line_num_count = messages.length.toString().length;
        
        let line_num_idx = 1;
        
        // Убрать отступ
        messages[0] = messages[0].slice(pad.length);
        
        if (info.label) {
            messages[0] = `${color('label', `[${info.label}]`)} ${messages[0]}`;
        }
        
        if (info.timestamp) {
            line_num_idx = 0;
            messages.unshift(color('timestamp', info.timestamp as string)
                + (info.ms   ? ` ${this.ms(info)}` : '')
                + (info.file ? ` ${colors.gray(`(${color('filename', `${info.file}`)})`)}` : '')
            );
        }
        
        return messages
            .map((line, index, arr) => {
                const prefix = index === 0
                    ? `${this.level_aligned(info)}:`
                    : colors.gray(`${' '.repeat(6 - line_num_count)}[${(index + line_num_idx).toString().padStart(line_num_count, ' ')}]`);
                const line_char = this.get_line_char(index, arr.length);
                
                return `${prefix} ${pad}${color_level}${colors.dim(line_char)}${colors.reset(' ')}${line}`;
            })
            .join('\n');
    }
    
    public transform(info: TransformableInfo): TransformableInfo {
        const messages = String(info[MESSAGE] || info.message).split('\n');
        
        if (this.opts.showMeta) {
            messages.push(
                ...this.stack(info),
                ...this.filteredMeta(info)
            );
        }
        
        info[MESSAGE] = this.wrap_message(info, messages);
        
        if (!isWebpack() && info.timestamp)
            info[MESSAGE] = `\n${info[MESSAGE] as string}`;
        
        return info;
    }
}

export default function f_pretty_log(opts?: ConsoleFormatOptions): Format {
    return new ConsoleFormat(opts);
}