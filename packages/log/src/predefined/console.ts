import winston from 'winston';
import { loggers } from '../utils';

const { printf } = winston.format;

const logger_console_log = loggers.add(
    'console', {
        format: printf(({ message }) => message as string),
    },
);

export default logger_console_log;