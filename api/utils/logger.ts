/**
 * Logger Utility
 * Simple logging utility for serverless functions
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Simple logger (can be replaced with Winston/Pino in production)
 */
export function log(level: LogLevel, message: string, context?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  switch (level) {
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.debug(logMessage, context || '');
      }
      break;
    case LogLevel.INFO:
      console.info(logMessage, context || '');
      break;
    case LogLevel.WARN:
      console.warn(logMessage, context || '');
      break;
    case LogLevel.ERROR:
      console.error(logMessage, context || '');
      break;
  }
}

export const logger = {
  debug: (message: string, context?: any) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: any) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: any) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: any) => log(LogLevel.ERROR, message, context),
};

