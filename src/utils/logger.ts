/**
 * Represents a logging function that logs messages at a specific log level.
 * @param level - The log level of the message (e.g., 'info', 'error').
 * @param message - The message to log.
 * @param data - Optional additional data to log.
 */
export type log = {
  (level: LogLevel, message: string, data?: any): void;
};

/**
 * Interface for a logger with various log levels.
 */
export interface Logger {
  /** Logs a silent message (no output). */
  silent: (message: string, data?: any) => void;

  /** Logs an error message. */
  error: (message: string, data?: any) => void;

  /** Logs a warning message. */
  warn: (message: string, data?: any) => void;

  /** Logs an informational message. */
  info: (message: string, data?: any) => void;

  /** Logs an HTTP-related message. */
  http: (message: string, data?: any) => void;

  /** Logs a verbose message. */
  verbose: (message: string, data?: any) => void;

  /** Logs a debug message. */
  debug: (message: string, data?: any) => void;

  /** Logs a silly (very detailed) message. */
  silly: (message: string, data?: any) => void;
}

/**
 * Represents the available log levels and their priorities.
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

/**
 * A mapping of log levels to their priority values.
 */
export const logLevelPriority: Record<LogLevel, number> = {
  silent: -1,
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

/**
 * The default logger implementation that logs messages to the console.
 */
export const defaultLogger: Logger = {
  silent: (_message: string, _data?: any) => {},
  error: (message: string, data?: any) => (data ? console.error(message, data) : console.error(message)),
  warn: (message: string, data?: any) => (data ? console.warn(message, data) : console.warn(message)),
  info: (message: string, data?: any) => (data ? console.info(message, data) : console.info(message)),
  http: (message: string, data?: any) => (data ? console.log(message, data) : console.log(message)),
  verbose: (message: string, data?: any) => (data ? console.debug(message, data) : console.debug(message)),
  debug: (message: string, data?: any) => (data ? console.debug(message, data) : console.debug(message)),
  silly: (message: string, data?: any) => (data ? console.debug(message, data) : console.debug(message)),
};

/**
 * Builds a logger function that logs messages at or above the specified log level.
 * @param logger - The logger instance to use for logging.
 * @param logLevel - The minimum log level to log messages.
 * @returns A function that logs messages at the specified log level.
 */
export function buildLogger(
  logger: Logger,
  logLevel: LogLevel
): (level: LogLevel, message: string, data?: any) => void {
  return (level: LogLevel, message: string, data?: any): void => {
    if (logLevelPriority[level] <= logLevelPriority[logLevel]) {
      logger[level](message, data);
    }
  };
}

/**
 * Wraps an asynchronous function with logging for entry, exit, and errors.
 * @param fn - The asynchronous function to wrap.
 * @param instance - The instance containing the logger.
 * @param functionName - The name of the function being wrapped.
 * @returns A wrapped function with logging.
 */
export function withLogging<T>(
  fn: (...args: any[]) => Promise<T>,
  instance: { log: (level: LogLevel, message: string, data?: any) => void },
  functionName: string
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    instance.log('debug', `Entering ${functionName}`);
    if (args) {
      instance.log('silly', `Entering ${functionName}`, { args });
    }
    try {
      const result = await fn(...args);
      instance.log('debug', `Exiting ${functionName} successfully`);
      if (result) {
        instance.log('silly', `Exiting ${functionName} successfully`, {
          result,
        });
      }
      return result;
    } catch (error) {
      instance.log('error', `Error in ${functionName}`, { error });
      throw error;
    }
  };
}
