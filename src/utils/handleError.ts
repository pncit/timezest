import { LogLevel } from './logger';

/**
 * An HTTP error answered by the TimeZest API. `status` is the HTTP status, so a
 * caller can tell a request TimeZest refused (4xx) from one whose outcome is
 * unknown. The message is TimeZest's own, or `HTTP <status>` when it gave none.
 */
export class TimeZestHttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'TimeZestHttpError';
  }
}

/**
 * Logs a failed API request and throws the error that describes it: a
 * {@link TimeZestHttpError} when TimeZest answered, and a plain `Error` when it
 * did not answer or the request was never sent.
 * @param log - A logging function to log error details.
 * @param error - The error thrown by the HTTP client.
 */
export function handleError(log: (level: LogLevel, message: string, data?: any) => void, error: any): never {
  if (error.response) {
    const { status, data } = error.response;
    const message = data && typeof data === 'object' ? data.message || data.error : undefined;
    log('error', `API Error: ${status} - ${message || 'Unknown error'}`, data);
    if (data?.errors) {
      log('error', 'Details:', data.errors);
    }
    throw new TimeZestHttpError(message || `HTTP ${status}`, status);
  }
  if (error.request) {
    log('error', 'No response received from the API.', {
      message: error.message,
    });
    throw new Error('No response received from the API');
  }
  log('error', 'Error setting up the request.', { message: error.message });
  throw new Error('Error setting up the request');
}
