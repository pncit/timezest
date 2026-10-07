import { z } from 'zod';

/**
 * The shapes the TimeZest API returns, as it returns them. A field TimeZest
 * leaves `null` until something happens (a team without a URL slug, a request
 * nobody has booked) is nullable here.
 */

export const AgentSchema = z.object({
  id: z.string(),
  object: z.literal('agent'),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  schedulable: z.boolean(),
  two_factor_enabled: z.boolean(),
  url_slug: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
});

export const TeamSchema = z.object({
  id: z.string(),
  object: z.literal('team'),
  internal_name: z.string(),
  external_name: z.string(),
  team_type: z.string(),
  url_slug: z.string().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
});

/** A schedulable resource: an agent or a team, told apart by `object`. */
export const ResourceSchema = z.discriminatedUnion('object', [AgentSchema, TeamSchema]);

export const AppointmentTypeSchema = z.object({
  id: z.string(),
  internal_name: z.string(),
  external_name: z.string(),
  duration_mins: z.number(),
  url_slug: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
});

/** An agent or team named on a scheduling request. */
export const SchedulingRequestResourceSchema = z.object({
  id: z.string(),
  object: z.string(),
  name: z.string(),
});

/**
 * A PSA record a scheduling request is associated with. Tickets carry their
 * `number`; companies and contacts carry only their `id`.
 */
export const AssociatedEntitySchema = z.object({
  type: z.string(),
  id: z.number(),
  number: z.string().optional(),
});

/**
 * A scheduling request. Until the end user books a time, `scheduled_at`,
 * `selected_start_time` and `selected_time_zone` are `null`; the scheduling
 * window fields are `null` unless the request was created with them.
 */
export const SchedulingRequestSchema = z.object({
  id: z.string(),
  object: z.literal('scheduling_request'),
  appointment_type_id: z.string(),
  end_user_email: z.string(),
  end_user_name: z.string(),
  associated_entities: z.array(AssociatedEntitySchema),
  resources: z.array(SchedulingRequestResourceSchema),
  scheduled_agents: z.array(SchedulingRequestResourceSchema),
  duration_mins: z.number(),
  earliest_date: z.string().nullable(),
  earliest_time: z.string().nullable(),
  latest_date: z.string().nullable(),
  latest_time: z.string().nullable(),
  guests_list: z.array(z.unknown()),
  scheduled_at: z.number().nullable(),
  scheduling_url: z.string(),
  selected_start_time: z.number().nullable(),
  selected_time_zone: z.string().nullable(),
  status: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
});

export const AssociatedEntityPostSchema = z.union([
  z.object({
    type: z.string(),
    number: z.string(),
    id: z.number().optional(),
  }),
  z.object({
    type: z.string(),
    id: z.number(),
  }),
]);

export const SchedulingRequestPostSchema = z.object({
  appointment_type_id: z.string(),
  trigger_mode: z.string(),
  associated_entities: z.array(AssociatedEntityPostSchema),
  resource_ids: z.array(z.string()),
});
