import { makeRequest, endpointUrl } from "./makeRequest";
import { apiEndpoint } from "../constants/endpoints";
import { TimeZestAPI } from "../index";
import { TQLFilter, normalizeFilter } from "./tqlFilter";

/** One page of a TimeZest list: up to 20 items, and the URL of the next page. */
type ListPage<T> = { data: T[]; next_page: string | null };

/**
 * Reads every page of a list endpoint.
 *
 * The filter goes in the query string. TimeZest pages by cursor: each page
 * names the URL of the next one in `next_page`, filter included, and the last
 * page names none. A `next_page` on another origin is refused, because the API
 * key is sent with every request, and so is one that names the page just read,
 * because following it would never end.
 *
 * @template T - The type of the items listed.
 * @param apiInstance - The instance of the TimeZestAPI.
 * @param endpoint - The list endpoint to read.
 * @param filter - An optional filter string or TQLFilter instance.
 * @returns A promise that resolves to every item of every page.
 */
export const makePaginatedRequest = async <T>(
  apiInstance: TimeZestAPI,
  endpoint: apiEndpoint,
  filter: TQLFilter | string | null = null,
): Promise<T[]> => {
  const { log } = apiInstance;
  const apiKey = apiInstance.getApiKey();
  const { baseUrl, maxRetryTimeMs, maxRetryDelayMs } = apiInstance.getConfig();
  const origin = new URL(baseUrl).origin;
  const query = normalizeFilter(filter);

  let results: T[] = [];
  let url: string | null = endpointUrl(
    baseUrl,
    endpoint,
    query === null ? {} : { filter: query },
  );

  while (url !== null) {
    log("debug", `Fetching ${url}`);
    const page: ListPage<T> = await makeRequest<ListPage<T>>(
      log,
      apiKey,
      url,
      "GET",
      null,
      maxRetryTimeMs,
      maxRetryDelayMs,
    );
    results = results.concat(page.data);

    const next = page.next_page;
    if (next !== null && new URL(next).origin !== origin) {
      throw new Error(
        `TimeZest named a next page outside ${origin}; it was not followed.`,
      );
    }
    if (next === url) {
      throw new Error(`TimeZest named ${url} as its own next page.`);
    }
    url = next;
  }

  log("http", `Paginated request to ${endpoint} completed successfully`);
  return results;
};
