import { log, LogLevel, Logger } from "./utils/logger";
import { TimeZestAPIConfig } from "./config/config";
import {
  Agent,
  Resource,
  AppointmentType,
  SchedulingRequest,
  Team,
  SchedulingRequestPost,
} from "./entities/entities";
import {
  ResourceSchema,
  AgentSchema,
  AppointmentTypeSchema,
  SchedulingRequestSchema,
  TeamSchema,
} from "./entities/schemas";
import { CONFIG } from "./config/config";
import { makeRequest, endpointUrl } from "./utils/makeRequest";
import { API_ENDPOINTS } from "./constants/endpoints";
import { buildLogger, withLogging } from "./utils/logger";
import { makePaginatedRequest } from "./utils/makePaginatedRequest";
import { ZodType } from "zod";
import { TQLFilter } from "./utils/tqlFilter";

export {
  Agent,
  Resource,
  AppointmentType,
  SchedulingRequest,
  SchedulingRequestPost,
  AssociatedEntityPost,
  Team,
} from "./entities/entities";
export {
  ResourceSchema,
  AgentSchema,
  AppointmentTypeSchema,
  SchedulingRequestSchema,
  TeamSchema,
} from "./entities/schemas";
export { TimeZestHttpError } from "./utils/handleError";
export {
  TQL,
  TQLFilter,
  TQL_ATTRIBUTES,
  type TQLAttribute,
  type TQLAttributeOf,
  type TQLEntity,
} from "./utils/tqlFilter";

/**
 * Options for configuring the TimeZest API.
 */
export interface TimeZestAPIOptions {
  /** The log level for the API (e.g., 'info', 'debug'). */
  logLevel?: LogLevel;

  /** A custom logger implementation. */
  logger?: Logger;

  /** The base URL for the API. */
  baseUrl?: string;

  /** The maximum delay between retries, in milliseconds. */
  maxRetryDelayMs?: number;

  /** The maximum total retry time, in milliseconds. */
  maxRetryTimeMs?: number;

  /** Whether to use Zod validation for API responses. */
  outputValidation?: boolean;
}

/**
 * Represents the TimeZest API client.
 * Provides methods to interact with the TimeZest API.
 */
export class TimeZestAPI {
  private config: TimeZestAPIConfig;
  private apiKey: string;
  log: log;

  /**
   * Creates an instance of the TimeZestAPI client.
   * @param apiKey - The API key for authenticating with the TimeZest API.
   * @param options - Optional configuration options for the API client.
   */
  constructor(apiKey: string, options?: TimeZestAPIOptions) {
    this.apiKey = apiKey;
    this.config = {
      logLevel: options?.logLevel || CONFIG.logLevel,
      logger: options?.logger || CONFIG.logger,
      baseUrl: options?.baseUrl || CONFIG.baseUrl,
      maxRetryDelayMs: options?.maxRetryDelayMs || CONFIG.maxRetryDelayMs,
      maxRetryTimeMs: options?.maxRetryTimeMs || CONFIG.maxRetryTimeMs,
      outputValidation:
        options?.outputValidation !== undefined
          ? options.outputValidation
          : CONFIG.outputValidation,
    };
    this.log = buildLogger(this.config.logger, this.config.logLevel);
    // Log the initialization of the API client but remove apiKey
    this.log("info", "TimeZestAPI initialized");
    this.log("debug", "TimeZestAPI initialized with custom config", {
      ...options,
    });
    this.log("debug", "TimeZestAPI initialized with final config", {
      ...this.config,
    });

    // Wrap methods with logging middleware using the instance's log method
    this.getResources = withLogging(
      this.getResources.bind(this),
      this,
      "getResources",
    );
    this.getAgents = withLogging(this.getAgents.bind(this), this, "getAgents");
    this.getTeams = withLogging(this.getTeams.bind(this), this, "getTeams");
    this.getAppointmentTypes = withLogging(
      this.getAppointmentTypes.bind(this),
      this,
      "getAppointmentTypes",
    );
    this.getSchedulingRequest = withLogging(
      this.getSchedulingRequest.bind(this),
      this,
      "getSchedulingRequest",
    );
    this.createSchedulingRequest = withLogging(
      this.createSchedulingRequest.bind(this),
      this,
      "createSchedulingRequest",
    );
  }

  /**
   * Returns the API key used by this client instance.
   * @returns {string} The API key for authenticating with the TimeZest API.
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Returns the configuration object for this API client instance.
   * @returns {TimeZestAPIConfig} The configuration for the API client.
   */
  getConfig(): TimeZestAPIConfig {
    return this.config;
  }

  /**
   * Fetches resources from the TimeZest API.
   * @param {TQLFilter | string | null} [filter=null] - Optional filter (TQLFilter instance or string) to narrow down results.
   * @returns {Promise<Resource[]>} A promise that resolves to an array of resources.
   */
  getResources = async (
    filter: TQLFilter | string | null = null,
  ): Promise<Resource[]> => {
    const response = await makePaginatedRequest<Resource>(
      this,
      API_ENDPOINTS.RESOURCES,
      filter,
    );
    return this.validateResponse(response, ResourceSchema);
  };

  /**
   * Fetches agents from the TimeZest API.
   * @param {TQLFilter | string | null} [filter=null] - Optional filter (TQLFilter instance or string) to narrow down results.
   * @returns {Promise<Agent[]>} A promise that resolves to an array of agents.
   */
  async getAgents(filter: TQLFilter | string | null = null): Promise<Agent[]> {
    const response = await makePaginatedRequest<Agent>(
      this,
      API_ENDPOINTS.AGENTS,
      filter,
    );
    return this.validateResponse(response, AgentSchema);
  }

  /**
   * Fetches teams from the TimeZest API.
   * @param {TQLFilter | string | null} [filter=null] - Optional filter (TQLFilter instance or string) to narrow down results.
   * @returns {Promise<Team[]>} A promise that resolves to an array of teams.
   */
  async getTeams(filter: TQLFilter | string | null = null): Promise<Team[]> {
    const response = await makePaginatedRequest<Team>(
      this,
      API_ENDPOINTS.TEAMS,
      filter,
    );
    return this.validateResponse(response, TeamSchema);
  }

  /**
   * Fetches appointment types from the TimeZest API.
   * @param {TQLFilter | string | null} [filter=null] - Optional filter (TQLFilter instance or string) to narrow down results.
   * @returns {Promise<AppointmentType[]>} A promise that resolves to an array of appointment types.
   */
  async getAppointmentTypes(
    filter: TQLFilter | string | null = null,
  ): Promise<AppointmentType[]> {
    const response = await makePaginatedRequest<AppointmentType>(
      this,
      API_ENDPOINTS.APPOINTMENT_TYPES,
      filter,
    );
    return this.validateResponse(response, AppointmentTypeSchema);
  }

  /**
   * Fetches a scheduling request by its ID.
   * @param {string} id - The ID of the scheduling request to fetch.
   * @returns {Promise<SchedulingRequest>} A promise that resolves to the scheduling request.
   */
  async getSchedulingRequest(id: string): Promise<SchedulingRequest> {
    const response = await makeRequest<SchedulingRequest>(
      this.log,
      this.apiKey,
      endpointUrl(
        this.config.baseUrl,
        `${API_ENDPOINTS.SCHEDULING_REQUESTS}/${encodeURIComponent(id)}`,
      ),
      "GET",
      null,
      this.config.maxRetryTimeMs,
      this.config.maxRetryDelayMs,
    );
    return this.validateOne(response, SchedulingRequestSchema);
  }

  /**
   * Fetches scheduling requests from the TimeZest API.
   * @param {TQLFilter | string | null} [filter=null] - Optional filter (TQLFilter instance or string) to narrow down results.
   * @returns {Promise<SchedulingRequest[]>} A promise that resolves to an array of scheduling requests.
   */
  async getSchedulingRequests(
    filter: TQLFilter | string | null = null,
  ): Promise<SchedulingRequest[]> {
    const response = await makePaginatedRequest<SchedulingRequest>(
      this,
      API_ENDPOINTS.SCHEDULING_REQUESTS,
      filter,
    );
    return this.validateResponse(response, SchedulingRequestSchema);
  }

  /**
   * Creates a new scheduling request in the TimeZest API.
   * @param {SchedulingRequestPost} data - The data for the new scheduling request.
   * @returns {Promise<SchedulingRequest>} A promise that resolves to the created scheduling request.
   */
  async createSchedulingRequest(
    data: SchedulingRequestPost,
  ): Promise<SchedulingRequest> {
    const response = await makeRequest<SchedulingRequest>(
      this.log,
      this.apiKey,
      endpointUrl(this.config.baseUrl, API_ENDPOINTS.SCHEDULING_REQUESTS),
      "POST",
      data,
      this.config.maxRetryTimeMs,
      this.config.maxRetryDelayMs,
    );
    return response;
  }

  /**
   * Validates API responses using Zod schemas if outputValidation is enabled in the config.
   * @param {T[]} response - The API response data to validate.
   * @param {ZodType<T>} schema - The Zod schema to validate against.
   * @returns {T[]} The validated or raw response data.
   */
  private validateResponse<T>(response: T[], schema: ZodType<T>): T[] {
    if (this.config.outputValidation) {
      return response.map((item) => schema.parse(item));
    }
    return response;
  }

  /**
   * Validates a single API response using its Zod schema if outputValidation is enabled in the config.
   * @param {T} response - The API response data to validate.
   * @param {ZodType<T>} schema - The Zod schema to validate against.
   * @returns {T} The validated or raw response data.
   */
  private validateOne<T>(response: T, schema: ZodType<T>): T {
    return this.config.outputValidation ? schema.parse(response) : response;
  }
}

export default TimeZestAPI;
