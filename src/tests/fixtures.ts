/** Records shaped like the TimeZest API's answers, with made-up values. */

export const agent = {
  id: 'agnt_1',
  object: 'agent' as const,
  name: 'Pat Agent',
  email: 'pat@example.com',
  role: 'agent',
  schedulable: true,
  two_factor_enabled: false,
  url_slug: 'pat',
  created_at: 1700000000,
  updated_at: 1700000000,
};

export const team = {
  id: 'team_1',
  object: 'team' as const,
  internal_name: 'Service desk',
  external_name: 'Support',
  team_type: 'round_robin',
  url_slug: null,
  created_at: 1700000000,
  updated_at: 1700000000,
};

/** A request sent to the end user, who has not booked a time. */
export const unbookedRequest = {
  id: 'sreq_1',
  object: 'scheduling_request' as const,
  appointment_type_id: 'apty_1',
  end_user_email: 'client@example.com',
  end_user_name: 'Client Person',
  associated_entities: [
    { type: 'connectwise_psa/company', id: 7 },
    { type: 'connectwise_psa/service_ticket', id: 11, number: '#1234' },
  ],
  resources: [{ id: 'agnt_1', object: 'agent', name: 'Pat Agent' }],
  scheduled_agents: [],
  duration_mins: 30,
  earliest_date: null,
  earliest_time: null,
  latest_date: null,
  latest_time: null,
  guests_list: [],
  scheduled_at: null,
  scheduling_url: 'https://example.timezest.com/s/abc',
  selected_start_time: null,
  selected_time_zone: null,
  status: 'sent',
  created_at: 1700000000,
  updated_at: 1700000000,
};

/** The same request once the end user booked a time. */
export const bookedRequest = {
  ...unbookedRequest,
  id: 'sreq_2',
  scheduled_agents: [{ id: 'agnt_1', object: 'agent', name: 'Pat Agent' }],
  scheduled_at: 1700001000,
  selected_start_time: 1700100000,
  selected_time_zone: 'America/Chicago',
  status: 'scheduled',
};
