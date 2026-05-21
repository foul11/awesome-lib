import { isDev, isTrue } from '@foul11/awesome';

export const is_caller_file = () => {
    return isTrue(process.env.FLEXILIB_LOG_CALLER_FILE) || isDev();
};

export const is_console_caller = () => {
    return isTrue(process.env.FLEXILIB_LOG_CONSOLE_CALLER, true);
};

export const get_curr_level = (levels: Record<string, number>) => {
    let level = process.env.FLEXILIB_LOG_LEVEL || (isDev() ? 'debug' : 'info');
    
    if (levels[level] === undefined) {
        level = 'info';
        
        // TODO: change to setImmediate, core-js errored
        setTimeout(() => {
            console.warn(`Unknown log level: '${level}', fallback to level 'info'`);
        }, 0);
    }
    
    return level;
};