import { z } from 'zod';
import {
  AgentSchema,
  AppointmentTypeSchema,
  AssociatedEntityPostSchema,
  ResourceSchema,
  SchedulingRequestPostSchema,
  SchedulingRequestSchema,
  TeamSchema,
} from './schemas';

/** The entity types, inferred from the schemas so the two cannot disagree. */
export type Agent = z.infer<typeof AgentSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;
export type SchedulingRequest = z.infer<typeof SchedulingRequestSchema>;

/**
 * An associated entity sent with a scheduling request. The identifier used
 * depends on the entity type:
 * - Ticket-style entities (e.g. `connectwise_psa/service_ticket`) use
 *   `number` and may optionally include `id`.
 * - Contact-style entities (e.g. `connectwise_psa/contact`) use `id`. When a
 *   contact entity is present it takes precedence over the ticket's contact
 *   when TimeZest resolves the end user.
 */
export type AssociatedEntityPost = z.infer<typeof AssociatedEntityPostSchema>;

export type SchedulingRequestPost = z.infer<typeof SchedulingRequestPostSchema>;
