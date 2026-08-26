import { IncrementalRefreshInterface } from "shared/validators";
import { resolveFullRefresh } from "back-end/src/services/experiments";
import { WATERMARK_IN_FUTURE_REASON } from "back-end/src/enterprise/services/data-pipeline";

const NOW = new Date("2024-06-01T00:00:00Z");

function makeModel(
  overrides: Partial<IncrementalRefreshInterface> = {},
): IncrementalRefreshInterface {
  return {
    id: "ir_1",
    organization: "org_1",
    dateCreated: NOW,
    dateUpdated: NOW,
    experimentId: "exp_1",
    phase: 0,
    unitsTableFullName: "proj.ds.gb_units_exp_1",
    unitsMaxTimestamp: new Date("2024-05-31T23:00:00Z"),
    unitsDimensions: [],
    experimentSettingsHash: "h",
    metricSources: [],
    metricCovariateSources: [],
    currentExecutionSnapshotId: null,
    ...overrides,
  };
}

describe("resolveFullRefresh", () => {
  it("forces a full refresh when explicitly requested", () => {
    expect(resolveFullRefresh(false, makeModel(), NOW).fullRefresh).toBe(true);
  });

  it("forces a full refresh when there is no prior state or no units table", () => {
    expect(resolveFullRefresh(true, null, NOW).fullRefresh).toBe(true);
    expect(
      resolveFullRefresh(true, makeModel({ unitsTableFullName: null }), NOW)
        .fullRefresh,
    ).toBe(true);
  });

  it("runs incrementally when the stored units watermark is at or before now", () => {
    expect(resolveFullRefresh(true, makeModel(), NOW)).toEqual({
      fullRefresh: false,
      fullRefreshReason: null,
    });
    expect(
      resolveFullRefresh(true, makeModel({ unitsMaxTimestamp: null }), NOW)
        .fullRefresh,
    ).toBe(false);
  });

  it("forces a full refresh when the stored units watermark is in the future", () => {
    expect(
      resolveFullRefresh(
        true,
        makeModel({ unitsMaxTimestamp: new Date("2024-06-03T12:00:00Z") }),
        NOW,
      ),
    ).toEqual({
      fullRefresh: true,
      fullRefreshReason: WATERMARK_IN_FUTURE_REASON,
    });
  });
});
