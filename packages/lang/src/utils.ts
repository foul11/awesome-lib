import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough';
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough';
import { spoilerSyntax } from 'micromark-extension-inline-spoiler';
import { spoilerFromMarkdown } from 'mdast-util-inline-spoiler';
import { newlineToBreak } from 'mdast-util-newline-to-break';
import { fromMarkdown } from 'mdast-util-from-markdown';

import { Object_keys } from '@foul11/awesome';

import type { UndefinedToOptional } from './types';
import type { Extension } from 'micromark-util-types';
import type { RootContent } from 'mdast';

declare module 'mdast' {
    interface RootContentMap {
        spoiler: {
            type: 'spoiler'
            value: string
        }
    }
}

export type Stringble = string | number | bigint;

export function prefix<
    P extends string,
    E extends Record<string, any>,
>(pref: P, exports: E): { [K in keyof E as `${P}_${K & string}`]: E[K] } {
    return Object.fromEntries(
        Object.entries(exports)
            .map(([ key, value ]) => [ `${pref}_${key}`, value ]),
    ) as any;
}

function spacesInStr(str: string) {
    return str?.match(/^\s*/)?.[0]?.length ?? 0;
}

export function hereDocJs(str: string) {
    const lines = str.split('\n');
    const body = lines.slice(1, -1);
    const spacesInFirstLine = spacesInStr(body[0]);
    
    if (!body.length || !body.every(s => spacesInStr(s) >= spacesInFirstLine)) {
        return str;
    }
    
    if (/^\s*$/.test(lines[0])) {
        const spaces = lines[1].match(/^\s*/)?.[0]?.length ?? 0;
        return lines.slice(1).map(line => line.slice(spaces)).join('\n');
    }
    
    return str;
}

type TemplateInferArgs<T> = UndefinedToOptional<{
    [K in keyof T]:
        T[K] extends null
            ? Stringble
            : Stringble | undefined;
}>;

export function template<
    T extends { [K in string]: Stringble | null },
>(str: string, args?: T) {
    const keys = Object_keys((args as T) ?? {});
    str = hereDocJs(str).trim();
    
    return (r_args: TemplateInferArgs<T>) => {
        return keys.reduce((prev, key) => (
            prev
                .toString()
                .replaceAll(
                    `{${String(key)}}`,
                    r_args?.[key]?.toString() ||
                    args?.[key]?.toString() ||
                    '',
                )
        ), str);
    };
}

export const raw = String.raw;

/**
 * Telegram md processor
 */
export function md(tpl: { raw: readonly string[] | ArrayLike<string> }, ...substitutions: Stringble[]) {
    // const isDebug = Array.from(template.raw).some((line) => line.includes('@@@'));
    const str = raw(tpl, ...substitutions);
    const hereDoc = hereDocJs(str);
    const ast = fromMarkdown(hereDoc, {
        mdastExtensions: [
            gfmStrikethroughFromMarkdown(),
            spoilerFromMarkdown,
            // {
            //     enter: { codeIndented: function(token) { console.log(token) }, codeTextData: function(token) { console.log(token) } },
            //     exit:  { codeIndented: function(token) { console.log(token) }, codeTextData: function(token) { console.log(token) } },
            // }
        ],
        extensions: [
            gfmStrikethrough(),
            spoilerSyntax({}) as unknown as Extension,
        ],
    });
    
    newlineToBreak(ast);
    
    const md_transform = (node: RootContent, tab = 0): string => {
        const out = [];
        
        switch (node.type) {
            case 'paragraph':
                out.push(node.children.map(child => md_transform(child, tab)).join(''));
                break;
                
            case 'list':
                out.push(node.children.map((child, i) => {
                    const content = child.children.map(c => md_transform(c, tab + 1)).join('\n');
                    
                    return `${'\t'.repeat(tab)}${node.ordered ? `${i + 1}.` : raw`*`} ${content}`;
                }).join('\n'));
                break;
                
            case 'emphasis': // italic
                out.push(node.children.map(child => raw`\_${md_transform(child, tab)}\_`).join(''));
                break;
                
            case 'strong': // bold
                out.push(node.children.map(child => raw`\*${md_transform(child, tab)}\*`).join(''));
                break;
                
            case 'text':
                out.push(node.value);
                break;
                
            case 'heading':
                out.push(node.children.map(child => `${raw`#`.repeat(node.depth)} ${md_transform(child, tab)}`).join(''));
                break;
                
            case 'code': // code block
                out.push(raw`\`\`\`\n${node.value}\n\`\`\``);
                break;
                
            case 'inlineCode': // inline code
                out.push(raw`\`${node.value}\``);
                break;
                
            case 'link': // link
                out.push(raw`\[${node.children.map(child => md_transform(child, tab)).join('')}\]\(${node.url}\)`);
                break;
                
            case 'spoiler': // spoiler
                out.push(raw`\|\|${node.value}\|\|`);
                break;
                
            case 'delete': // strikethrough
                out.push(raw`\~\~${node.children.map(child => md_transform(child, tab)).join('')}\~\~`);
                break;
            
            case 'break':
                out.push('\n');
                break;
                
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
        
        return out.join('\n');
    };
    
    const res = ast.children.map(node => md_transform(node)).join('\n');
    
    // if (isDebug)
    //     debugger;
    
    return res;
}