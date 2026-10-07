/**
 * TimeZest Query Language (TQL) Filter Builder
 *
 * Provides a user-friendly, fluent API for constructing valid TQL filters.
 * Based on the TimeZest TQL documentation: https://developer.timezest.com/tql/
 *
 * @example
 * ```typescript
 * // Type-safe filtering with autocomplete (recommended)
 * const filter = TQL.forSchedulingRequests()
 *   .filter('status').eq('scheduled');
 *
 * // Type-safe chaining with AND (TimeZest has no OR between predicates;
 * // IN matches any of several values)
 * const filter = TQL.forSchedulingRequests()
 *   .filter('agent').eq('agnt_123')
 *   .and('status').in(['sent', 'scheduled']);
 *
 * // Using with API - no toString() needed!
 * const requests = await timeZest.getSchedulingRequests(
 *   TQL.forSchedulingRequests().filter('status').eq('scheduled')
 * );
 *
 * // Flexible filtering (no type checking, still works)
 * const filter = TQL.filter('scheduling_request.status').eq('scheduled');
 *
 * // Call toString() explicitly if you need the string
 * const filterString = TQL.forAgents().filter('name').like('John').toString();
 * ```
 */

/**
 * The attributes each list endpoint can be filtered on, as the TimeZest API
 * accepts them; it refuses any other attribute. For scheduling requests,
 * TimeZest documents `agent_id` and `team_id`, but the API accepts `agent` and
 * `team`, each compared with an agent's or team's id. It also accepts
 * `appointment_type_id`, which it does not document.
 */
export const TQL_ATTRIBUTES = {
  agent: [
    "name",
    "email",
    "role",
    "schedulable",
    "two_factor_enabled",
    "url_slug",
    "created_at",
  ],
  team: ["internal_name", "external_name", "url_slug"],
  resource: ["internal_name", "external_name", "url_slug"],
  appointment_type: [
    "internal_name",
    "external_name",
    "duration_mins",
    "url_slug",
  ],
  scheduling_request: [
    "autotask_company_id",
    "autotask_contact_id",
    "autotask_ticket_number",
    "connectwise_psa_company_id",
    "connectwise_psa_contact_id",
    "connectwise_psa_ticket_number",
    "connectwise_psa_project_ticket_number",
    "connectwise_psa_service_ticket_number",
    "halo_psa_client_id",
    "halo_psa_user_id",
    "halo_psa_ticket_number",
    "service_now_task_number",
    "service_now_task_id",
    "service_now_contact_id",
    "end_user_name",
    "end_user_email",
    "status",
    "selected_start_time",
    "scheduled_at",
    "created_at",
    "appointment_type_id",
    "agent",
    "team",
  ],
} as const;

/** An entity whose list endpoint takes a TQL filter. */
export type TQLEntity = keyof typeof TQL_ATTRIBUTES;

/** The attributes `E` can be filtered on, without the entity prefix. */
export type TQLAttributeOf<E extends TQLEntity> =
  (typeof TQL_ATTRIBUTES)[E][number];

/** Every filterable attribute, with its entity prefix: `scheduling_request.status`. */
export type TQLAttribute = {
  [E in TQLEntity]: `${E}.${TQLAttributeOf<E>}`;
}[TQLEntity];

type TQLOperator =
  | "EQ"
  | "NOT_EQ"
  | "LIKE"
  | "NOT_LIKE"
  | "IN"
  | "NOT_IN"
  | "GT"
  | "GTE"
  | "LT"
  | "LTE";

interface TQLPredicate {
  attribute: string;
  operator: TQLOperator;
  value: string | number | string[] | number[];
}

/**
 * Represents a TQL filter being constructed: one or more predicates, all of
 * which a record must match.
 *
 * `TAttribute` is what an attribute is named by. A filter from an entity's
 * builder (`TQL.forSchedulingRequests()`) names attributes without the prefix
 * and adds it; one from `TQL.filter()` names them in full.
 */
export class TQLFilter<TAttribute extends string = string> {
  private predicates: TQLPredicate[] = [];
  private entityPrefix: string | null = null;
  private currentAttribute: string | null = null;
  private currentOperator: TQLOperator | null = null;
  private currentValue: string | number | string[] | number[] | null = null;

  /**
   * Creates a new TQL filter starting with the given attribute.
   * @param attribute - The attribute to filter on: `status` with an entity prefix, `scheduling_request.status` without
   * @param entityPrefix - Optional prefix for this entity type (e.g., 'scheduling_request')
   */
  constructor(attribute: TAttribute, entityPrefix?: string) {
    this.entityPrefix = entityPrefix || null;
    this.currentAttribute = this.path(attribute);
  }

  /** The attribute's full path: prefixed when this filter has an entity prefix. */
  private path(attribute: TAttribute): string {
    return this.entityPrefix ? `${this.entityPrefix}.${attribute}` : attribute;
  }

  /**
   * Adds a completed predicate and starts a new one.
   */
  private finalizePredicate(): void {
    if (
      this.currentAttribute &&
      this.currentOperator !== null &&
      this.currentValue !== null
    ) {
      this.predicates.push({
        attribute: this.currentAttribute,
        operator: this.currentOperator,
        value: this.currentValue,
      });
    }
    this.currentAttribute = null;
    this.currentOperator = null;
    this.currentValue = null;
  }

  /**
   * Sets the operator and value for comparison operations.
   */
  private setComparison(
    operator: TQLOperator,
    value: string | number | string[] | number[],
  ): this {
    if (!this.currentAttribute) {
      throw new Error(
        "Must call filter() or and() before using comparison operators",
      );
    }
    this.currentOperator = operator;
    this.currentValue = value;
    this.finalizePredicate();
    return this;
  }

  // String comparison operators
  /**
   * Equals operator (EQ)
   * @param value - The value to compare against
   */
  eq(value: string | number): this {
    return this.setComparison("EQ", value);
  }

  /**
   * Not equals operator (NOT_EQ)
   * @param value - The value to compare against
   */
  notEq(value: string | number): this {
    return this.setComparison("NOT_EQ", value);
  }

  /**
   * Like operator (contains pattern matching)
   * @param value - The pattern to match against
   */
  like(value: string): this {
    return this.setComparison("LIKE", value);
  }

  /**
   * Not like operator (does not contain pattern)
   * @param value - The pattern to exclude
   */
  notLike(value: string): this {
    return this.setComparison("NOT_LIKE", value);
  }

  /**
   * In operator (value is in the provided array)
   * @param values - Array of values to match against
   */
  in(values: string[] | number[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("IN operator requires a non-empty array");
    }
    return this.setComparison("IN", values);
  }

  /**
   * Not in operator (value is not in the provided array)
   * @param values - Array of values to exclude
   */
  notIn(values: string[] | number[]): this {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("NOT_IN operator requires a non-empty array");
    }
    return this.setComparison("NOT_IN", values);
  }

  // Numeric/timestamp comparison operators
  /**
   * Greater than operator (GT)
   * @param value - The value to compare against
   */
  gt(value: number): this {
    return this.setComparison("GT", value);
  }

  /**
   * Greater than or equal operator (GTE)
   * @param value - The value to compare against
   */
  gte(value: number): this {
    return this.setComparison("GTE", value);
  }

  /**
   * Less than operator (LT)
   * @param value - The value to compare against
   */
  lt(value: number): this {
    return this.setComparison("LT", value);
  }

  /**
   * Less than or equal operator (LTE)
   * @param value - The value to compare against
   */
  lte(value: number): this {
    return this.setComparison("LTE", value);
  }

  /**
   * Starts another predicate, which a record must match as well.
   * @param attribute - The attribute for the next predicate, named as for `filter()`
   */
  and(attribute: TAttribute): this {
    if (this.predicates.length === 0) {
      throw new Error("Must have at least one predicate before using AND");
    }
    this.currentAttribute = this.path(attribute);
    return this;
  }

  /**
   * Formats a value for TQL output.
   * Handles arrays, strings with special characters, and numbers.
   */
  private formatValue(value: string | number | string[] | number[]): string {
    if (Array.isArray(value)) {
      // Arrays are comma-separated (no spaces) according to TQL spec
      return value.map((v) => this.formatSingleValue(v)).join(",");
    }
    return this.formatSingleValue(value);
  }

  /**
   * Formats a single value for TQL output.
   */
  private formatSingleValue(value: string | number): string {
    if (typeof value === "number") {
      return String(value);
    }

    // Strings containing spaces, commas, tildes, backslashes, or quotes should be enclosed in quotes
    if (/[\s,~"\\]/.test(value) || value === "") {
      // Escape backslashes and quotes in the value to prevent injection issues
      const escaped = value.replace(/[\\"]/g, "\\$&");
      return `"${escaped}"`;
    }

    return value;
  }

  /**
   * Replaces spaces with tildes outside of quoted strings.
   * This is needed for URL encoding while preserving spaces inside quoted values.
   * Handles escaped quotes properly (e.g., "value with \"quotes\"").
   * @param str - The string to process
   * @returns The string with spaces outside quotes replaced by tildes
   */
  private replaceSpacesOutsideQuotes(str: string): string {
    let result = "";
    let insideQuotes = false;
    let i = 0;

    while (i < str.length) {
      const char = str[i];

      if (char === "\\" && insideQuotes && i + 1 < str.length) {
        // Handle escaped characters (like \")
        result += char + str[i + 1];
        i += 2;
        continue;
      }

      if (char === '"') {
        // Toggle quote state
        insideQuotes = !insideQuotes;
        result += char;
      } else if (/\s/.test(char)) {
        // Only replace whitespace if we're NOT inside quotes
        result += insideQuotes ? char : "~";
      } else {
        result += char;
      }

      i++;
    }

    return result;
  }

  /** The predicates, finalized, each as `attribute OPERATOR value`. */
  private predicateStrings(): string[] {
    if (
      this.currentAttribute &&
      this.currentOperator !== null &&
      this.currentValue !== null
    ) {
      this.finalizePredicate();
    }
    if (this.predicates.length === 0) {
      throw new Error("Filter must have at least one predicate");
    }
    return this.predicates.map(
      (predicate) =>
        `${predicate.attribute} ${predicate.operator} ${this.formatValue(predicate.value)}`,
    );
  }

  /**
   * The filter as TimeZest reads it: parts separated by `~`, quoted values
   * kept whole. TimeZest reads the value of a predicate written with spaces up
   * to the end of the filter, so only this form joins several predicates.
   * @returns The TQL filter string
   */
  toString(): string {
    return this.replaceSpacesOutsideQuotes(
      this.predicateStrings().join(" AND "),
    );
  }

  /**
   * The filter with spaces between its parts, for reading. TimeZest cannot
   * read a filter of more than one predicate in this form; send `toString()`.
   */
  toHumanReadableString(): string {
    return this.predicateStrings().join(" AND ");
  }

  /**
   * Returns the string representation when converted to a primitive.
   * This allows TQLFilter to be used directly without calling toString().
   */
  valueOf(): string {
    return this.toString();
  }

  /**
   * Custom primitive conversion for string contexts.
   * Allows TQLFilter to be used directly in places expecting strings.
   */
  [Symbol.toPrimitive](_hint: "string" | "number" | "default"): string {
    return this.toString();
  }
}

/**
 * Normalizes a filter value to a string.
 * Converts TQLFilter instances to strings, leaves strings as-is, and returns null for null.
 * @param filter - The filter value (TQLFilter, string, or null)
 * @returns The normalized filter string or null
 */
export function normalizeFilter(
  filter: TQLFilter | string | null,
): string | null {
  if (filter === null) {
    return null;
  }
  if (typeof filter === "string") {
    return filter;
  }
  // filter is a TQLFilter instance
  return filter.toString();
}

/**
 * Starts filters on one entity's list, naming only the attributes it can be
 * filtered on, without the entity prefix.
 */
class TypedTQLFilterBuilder<E extends TQLEntity> {
  constructor(private prefix: E) {}

  /**
   * Starts a filter on one of the entity's filterable attributes.
   * @param attribute - An attribute in `TQL_ATTRIBUTES` for this entity
   * @returns A TQLFilter instance for method chaining
   */
  filter(attribute: TQLAttributeOf<E>): TQLFilter<TQLAttributeOf<E>> {
    return new TQLFilter<TQLAttributeOf<E>>(attribute, this.prefix);
  }
}

/**
 * TQL Filter Builder
 * Provides a user-friendly, fluent API for constructing TimeZest Query Language filters.
 */
export class TQL {
  /**
   * Starts building a TQL filter with the given attribute.
   * The attribute is named in full and not checked; prefer the
   * endpoint-specific helpers, which offer only the attributes TimeZest accepts.
   * For type-safe filtering, use the endpoint-specific helpers like `TQL.forAgents()`.
   *
   * @param attribute - The attribute to filter on (e.g., 'scheduling_request.status')
   * @returns A TQLFilter instance for method chaining
   *
   * @example
   * ```typescript
   * TQL.filter('scheduling_request.status').eq('scheduled')
   * ```
   */
  static filter(attribute: string): TQLFilter<string> {
    return new TQLFilter<string>(attribute);
  }

  /**
   * Creates a type-safe filter builder for Agent entities.
   * Offers only the attributes TimeZest accepts in a filter of this list.
   *
   * @example
   * ```typescript
   * TQL.forAgents().filter('name').like('John')
   * TQL.forAgents().filter('email').eq('user@example.com')
   * ```
   */
  static forAgents(): TypedTQLFilterBuilder<"agent"> {
    return new TypedTQLFilterBuilder("agent");
  }

  /**
   * Creates a type-safe filter builder for Resource entities.
   * Offers only the attributes TimeZest accepts in a filter of this list.
   *
   * @example
   * ```typescript
   * TQL.forResources().filter('internal_name').like('Room')
   * TQL.forResources().filter('url_slug').eq('front-desk')
   * ```
   */
  static forResources(): TypedTQLFilterBuilder<"resource"> {
    return new TypedTQLFilterBuilder("resource");
  }

  /**
   * Creates a type-safe filter builder for Team entities.
   * Offers only the attributes TimeZest accepts in a filter of this list.
   *
   * @example
   * ```typescript
   * TQL.forTeams().filter('internal_name').eq('Tier1')
   * TQL.forTeams().filter('external_name').like('support')
   * ```
   */
  static forTeams(): TypedTQLFilterBuilder<"team"> {
    return new TypedTQLFilterBuilder("team");
  }

  /**
   * Creates a type-safe filter builder for AppointmentType entities.
   * Offers only the attributes TimeZest accepts in a filter of this list.
   *
   * @example
   * ```typescript
   * TQL.forAppointmentTypes().filter('internal_name').eq('consultation')
   * TQL.forAppointmentTypes().filter('duration_mins').gte(30)
   * ```
   */
  static forAppointmentTypes(): TypedTQLFilterBuilder<"appointment_type"> {
    return new TypedTQLFilterBuilder("appointment_type");
  }

  /**
   * Creates a type-safe filter builder for SchedulingRequest entities.
   * Offers only the attributes TimeZest accepts in a filter of this list.
   *
   * @example
   * ```typescript
   * TQL.forSchedulingRequests().filter('status').eq('scheduled')
   * TQL.forSchedulingRequests().filter('end_user_email').like('@example.com')
   * TQL.forSchedulingRequests().filter('agent').eq('agnt_123')
   * TQL.forSchedulingRequests().filter('team').in(['team_1', 'team_2'])
   * ```
   */
  static forSchedulingRequests(): TypedTQLFilterBuilder<"scheduling_request"> {
    return new TypedTQLFilterBuilder("scheduling_request");
  }
}

export default TQL;
