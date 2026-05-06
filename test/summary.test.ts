import { describe, expect, it } from "vitest";
import { computeSummary } from "../src/lib/summary";

const slots = ["d0p0", "d0p1", "d1p0"];

describe("computeSummary", () => {
  it("counts yes maybe and no correctly", () => {
    const summary = computeSummary(slots, [
      { answers: { d0p0: "yes", d0p1: "maybe", d1p0: "no" } },
      { answers: { d0p0: "yes", d0p1: "no", d1p0: "maybe" } }
    ]);

    expect(summary.d0p0).toEqual({ yes: 2, maybe: 0, no: 0, unanswered: 0 });
    expect(summary.d0p1).toEqual({ yes: 0, maybe: 1, no: 1, unanswered: 0 });
    expect(summary.d1p0).toEqual({ yes: 0, maybe: 1, no: 1, unanswered: 0 });
  });

  it("counts unanswered for missing answers", () => {
    const summary = computeSummary(slots, [{ answers: { d0p0: "yes" } }, { answers: {} }]);

    expect(summary.d0p0).toEqual({ yes: 1, maybe: 0, no: 0, unanswered: 1 });
    expect(summary.d0p1).toEqual({ yes: 0, maybe: 0, no: 0, unanswered: 2 });
  });

  it("ignores unknown statuses by treating them as unanswered", () => {
    const summary = computeSummary(slots, [
      { answers: { d0p0: "busy", d0p1: "maybe" } as Record<string, unknown> }
    ]);

    expect(summary.d0p0).toEqual({ yes: 0, maybe: 0, no: 0, unanswered: 1 });
    expect(summary.d0p1).toEqual({ yes: 0, maybe: 1, no: 0, unanswered: 0 });
  });

  it("handles zero responses", () => {
    const summary = computeSummary(slots, []);

    expect(summary.d0p0).toEqual({ yes: 0, maybe: 0, no: 0, unanswered: 0 });
    expect(summary.d0p1).toEqual({ yes: 0, maybe: 0, no: 0, unanswered: 0 });
  });
});
