/**
 * Defines the API endpoints used in the TimeZest application.
 */
export type apiEndpoints = {
  /** Endpoint for managing resources. */
  RESOURCES: apiEndpoint;

  /** Endpoint for managing agents. */
  AGENTS: apiEndpoint;

  /** Endpoint for managing teams. */
  TEAMS: apiEndpoint;

  /** Endpoint for managing appointment types. */
  APPOINTMENT_TYPES: apiEndpoint;

  /** Endpoint for managing scheduling requests. */
  SCHEDULING_REQUESTS: apiEndpoint;
};

export type BaseApiEndpoint = '/resources' | '/agents' | '/teams' | '/appointment_types' | '/scheduling_requests';

export type apiEndpoint = BaseApiEndpoint | `${BaseApiEndpoint}/${string}`;

export const API_ENDPOINTS: apiEndpoints = {
  RESOURCES: '/resources',
  AGENTS: '/agents',
  TEAMS: '/teams',
  APPOINTMENT_TYPES: '/appointment_types',
  SCHEDULING_REQUESTS: '/scheduling_requests',
};
