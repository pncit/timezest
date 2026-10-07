import { defaultLogger, LogLevel, Logger } from '../utils/logger';

/**
 * Configuration options for the TimeZest API client.
 */
export interface TimeZestAPIConfig {
  /**
   * The log level for the API client (e.g., 'info', 'debug', 'error').
   */
  logLevel: LogLevel;

  /**
   * The logger instance to use for logging messages.
   */
  logger: Logger;

  /**
   * The base URL for the TimeZest API.
   */
  baseUrl: string;

  /**
   * The maximum delay between retries, in milliseconds.
   */
  maxRetryDelayMs: number;

  /**
   * The maximum total retry time, in milliseconds.
   */
  maxRetryTimeMs: number;

  /**
   * Whether to validate API responses using Zod schemas.
   */
  outputValidation: boolean;
}

/**
 * Default configuration for the TimeZest API client.
 *
 * Rate limit: 180 requests per 60 seconds (sliding window)
 * Retry strategy: Aggressive exponential backoff with jitter
 */
export const CONFIG: TimeZestAPIConfig = {
  logLevel: 'error',
  logger: defaultLogger,
  baseUrl: 'https://api.timezest.com/v1',
  maxRetryDelayMs: 60 * 1000, // 60 seconds (aligned with rate limit window)
  maxRetryTimeMs: 5 * 60 * 1000, // 5 minutes (be patient with retries)
  outputValidation: true,
};
