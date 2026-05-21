import winston from 'winston';

const colors_map = {
    ms: 'gray italic',
    label: 'grey',
    date: 'cyan',
    number: 'yellow',
    string: 'green',
    timestamp: 'gray',
    filename: 'gray underline',
    text: 'white',
    error: 'red',
    
    red: 'red',
    green: 'green',
    blue: 'blue',
    cyan: 'cyan',
    gray: 'gray',
    black: 'black',
    white: 'white',
    yellow: 'yellow',
    magenta: 'magenta',
} as const;

const colorize = winston.format.colorize();
colorize.addColors(colors_map);

export const color = colorize.colorize.bind(colorize) as
    (level: keyof typeof colors_map, message: string) => string;

export default function f_colors() {
    return colorize;
}