import winston from 'winston';

import { getCallSites } from 'util';
import { is_caller_file } from '../env';

interface FFileOptions {
    start_frame?: number
}

const find_caller_file = (start_frame: number) => {
    let file: string | undefined;
    
    if (getCallSites === undefined)
        return undefined;
    
    for (const frame of getCallSites(50, { sourceMap: true }).slice(start_frame)) {
        if (frame.scriptName.includes('node_modules')) {
            continue;
        }
        
        const [ , project, dir, filename, ext ] = frame.scriptName.match(/^.+[\\/]([^\\/]+)[\\/](src|dist)[\\/](.+)(\.[jt]sx?)$/) ?? [];
        
        if (project && filename) {
            const line = frame.lineNumber;
            const column = frame.columnNumber;
            
            file = `${project} ${dir}/${filename}${ext}${line ? `:${line}:${column}` : ''}`;
            
            break;
        }
    }
    
    return file;
};

const f_file = winston.format<FFileOptions>((info, opts) => {
    info.file = is_caller_file() && (info.file === true || info.file === undefined)
        ? find_caller_file(opts?.start_frame || 10)
        : info.file;
    
    return info;
});

export default f_file;