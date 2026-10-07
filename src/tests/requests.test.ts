import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { TimeZestAPI, TimeZestHttpError, TQL } from '../index';
import { unbookedRequest } from './fixtures';

vi.mock('axios');
const request = vi.mocked(axios) as unknown as ReturnType<typeof vi.fn>;

const silent = {
  silent: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  http: () => {},
  verbose: () => {},
  debug: () => {},
  silly: () => {},
};

const client = (outputValidation = false) =>
  new TimeZestAPI('key', {
    logger: silent,
    baseUrl: 'https://tz.test/v1',
    maxRetryTimeMs: 1000,
    outputValidation,
  });

const answered = (status: number, data: unknown = {}) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data, headers: {} },
  });

const page = (ids: string[], next: string | null) => ({
  data: { data: ids.map((id) => ({ id })), next_page: next },
});

const urlOf = (call: number): URL => new URL((request.mock.calls[call][0] as { url: string }).url);

afterEach(() => {
  request.mockReset();
});

describe('a request TimeZest answers with an error', () => {
  it('throws once, with the status, rather than retrying', async () => {
    request.mockRejectedValue(answered(404));

    const error = await client()
      .getSchedulingRequest('sreq_missing')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TimeZestHttpError);
    expect(error).toMatchObject({ status: 404, message: 'HTTP 404' });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("carries TimeZest's own message, under either of the names it uses", async () => {
    request.mockRejectedValueOnce(answered(422, { message: 'Invalid' }));
    await expect(client().getSchedulingRequest('a')).rejects.toMatchObject({
      status: 422,
      message: 'Invalid',
    });

    request.mockRejectedValueOnce(answered(400, { error: 'Unable to parse filter URL parameter' }));
    await expect(client().getSchedulingRequests('x')).rejects.toMatchObject({
      status: 400,
      message: 'Unable to parse filter URL parameter',
    });
  });

  it('fails a list whose page TimeZest refuses', async () => {
    request.mockRejectedValueOnce(answered(500));
    await expect(client().getSchedulingRequests()).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('a list request', () => {
  it('sends the filter in the query string and no body', async () => {
    request.mockResolvedValueOnce(page(['a'], null));

    await client().getSchedulingRequests(TQL.forSchedulingRequests().filter('agent').eq('agnt_1'));

    expect(urlOf(0).pathname).toBe('/v1/scheduling_requests');
    expect(urlOf(0).searchParams.get('filter')).toBe('scheduling_request.agent~EQ~agnt_1');
    expect(request.mock.calls[0][0]).not.toHaveProperty('data');
  });

  it('follows each next page TimeZest names until there is none', async () => {
    const second = 'https://tz.test/v1/scheduling_requests?filter=x&starting_after=b';
    const third = 'https://tz.test/v1/scheduling_requests?filter=x&starting_after=c';
    request
      .mockResolvedValueOnce(page(['a', 'b'], second))
      .mockResolvedValueOnce(page(['c'], third))
      .mockResolvedValueOnce(page(['d'], null));

    const all = await client().getSchedulingRequests('x');

    expect(all.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(urlOf(1).toString()).toBe(second);
    expect(urlOf(2).toString()).toBe(third);
  });

  it('refuses a next page on another origin, which would be sent the API key', async () => {
    request.mockResolvedValueOnce(page(['a'], 'https://elsewhere.test/v1/scheduling_requests?starting_after=a'));

    await expect(client().getSchedulingRequests()).rejects.toThrow(/outside https:\/\/tz\.test/);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('refuses a next page that names the page just read', async () => {
    request.mockResolvedValueOnce(page(['a'], 'https://tz.test/v1/scheduling_requests'));

    await expect(client().getSchedulingRequests()).rejects.toThrow(/its own next page/);
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe('getSchedulingRequest', () => {
  it('reads an unbooked request when validating output', async () => {
    request.mockResolvedValueOnce({ data: unbookedRequest });

    await expect(client(true).getSchedulingRequest('sreq_1')).resolves.toEqual(unbookedRequest);
    expect(urlOf(0).pathname).toBe('/v1/scheduling_requests/sreq_1');
  });

  it('returns the answer as given when output validation is off', async () => {
    const odd = { id: 'sreq_1', status: 'sent' };
    request.mockResolvedValueOnce({ data: odd });

    await expect(client(false).getSchedulingRequest('sreq_1')).resolves.toBe(odd);
  });
});
