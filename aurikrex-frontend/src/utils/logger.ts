/**
 * Production-safe logger utility
 * Only logs in development mode to keep production console clean
 */

const isDevelopment = import.meta.env.DEV;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const createLogger = (): Logger => {
  const createLogFn = (level: LogLevel) => (...args: unknown[]): void => {
    if (isDevelopment) {
      console[level](...args);
    } else if (level === 'error') {
      // Always log errors in production for debugging purposes
      // In a real app, you might want to send these to an error tracking service
      console.error(...args);
    }
  };

  return {
    log: createLogFn('log'),
    info: createLogFn('info'),
    warn: createLogFn('warn'),
    error: createLogFn('error'),
    debug: createLogFn('debug'),
  };
};

export const logger = createLogger();
