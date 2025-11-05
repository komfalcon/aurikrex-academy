import winston from 'winston';
import { join } from 'path';
// Define custom log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan',
};
// Tell winston about our colors
winston.addColors(colors);
// Define format for console output
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.colorize({ all: true }), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define format for file output (no colors)
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.json());
// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: consoleFormat,
        }),
        // Error log file transport
        new winston.transports.File({
            filename: join('logs', 'error.log'),
            level: 'error',
            format: fileFormat,
        }),
        // Combined log file transport
        new winston.transports.File({
            filename: join('logs', 'combined.log'),
            format: fileFormat,
        }),
    ],
});
// Export a wrapper for type safety and convenience
export const log = {
    error: (message, meta) => {
        logger.error(message, meta);
    },
    warn: (message, meta) => {
        logger.warn(message, meta);
    },
    info: (message, meta) => {
        logger.info(message, meta);
    },
    http: (message, meta) => {
        logger.http(message, meta);
    },
    debug: (message, meta) => {
        logger.debug(message, meta);
    },
};
//# sourceMappingURL=logger.js.map