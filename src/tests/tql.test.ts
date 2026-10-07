import { describe, expect, it } from "vitest";
import { TQL, TQL_ATTRIBUTES } from "../index";

describe("TQL", () => {
  it("joins predicates with AND in the ~ form TimeZest reads", () => {
    const filter = TQL.forSchedulingRequests()
      .filter("status")
      .eq("scheduled")
      .and("selected_start_time")
      .gte(1700000000);

    expect(filter.toString()).toBe(
      "scheduling_request.status~EQ~scheduled~AND~scheduling_request.selected_start_time~GTE~1700000000",
    );
    expect(filter.toHumanReadableString()).toBe(
      "scheduling_request.status EQ scheduled AND scheduling_request.selected_start_time GTE 1700000000",
    );
  });

  it("filters scheduling requests by agent and by team", () => {
    expect(
      TQL.forSchedulingRequests().filter("agent").eq("agnt_1").toString(),
    ).toBe("scheduling_request.agent~EQ~agnt_1");
    expect(
      TQL.forSchedulingRequests()
        .filter("team")
        .in(["team_1", "team_2"])
        .toString(),
    ).toBe("scheduling_request.team~IN~team_1,team_2");
  });

  it("keeps a quoted value whole", () => {
    expect(
      TQL.forSchedulingRequests()
        .filter("end_user_name")
        .eq("Pat Smith")
        .and("status")
        .eq("sent")
        .toString(),
    ).toBe(
      'scheduling_request.end_user_name~EQ~"Pat Smith"~AND~scheduling_request.status~EQ~sent',
    );
  });

  it("names attributes in full when started without an entity", () => {
    expect(
      TQL.filter("team.internal_name")
        .eq("Tier1")
        .and("team.url_slug")
        .eq("t1")
        .toString(),
    ).toBe("team.internal_name~EQ~Tier1~AND~team.url_slug~EQ~t1");
  });

  it("offers only the attributes TimeZest accepts", () => {
    expect(TQL_ATTRIBUTES.scheduling_request).toEqual(
      expect.arrayContaining(["agent", "team", "appointment_type_id"]),
    );
    expect(TQL_ATTRIBUTES.scheduling_request).not.toContain("agent_id");

    // @ts-expect-error TimeZest refuses agent_id; the attribute is `agent`.
    TQL.forSchedulingRequests().filter("agent_id");
    // @ts-expect-error A team's id cannot be filtered on.
    TQL.forTeams().filter("id");
  });
});
