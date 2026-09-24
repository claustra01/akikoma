import { describe, expect, it } from "vitest";
import {
  computeSummary,
  getAvailabilityHighlight,
  getRankedScores,
  getSlotResponseDetails,
  getSummaryScore
} from "../src/lib/summary";

const slots = ["d0p0", "d0p1", "d1p0"];

describe("computeSummary", () => {
  it("recomputes counts and slot details for selected participants", () => {
    const responses = [
      { id: "r1", name: "佐藤", answers: { d0p0: "yes", d0p1: "no" } },
      { id: "r2", name: "鈴木", answers: { d0p0: "no", d0p1: "yes" } },
      { id: "r3", name: "田中", answers: { d0p0: "yes", d0p1: "yes" } }
    ];
    const selected = responses.filter((response) => new Set(["r1", "r3"]).has(response.id));
    const summary = computeSummary(slots, selected);

    expect(summary.d0p0).toEqual({ yes: 2, maybe: 0, no: 0, unanswered: 0 });
    expect(summary.d0p1).toEqual({ yes: 1, maybe: 0, no: 1, unanswered: 0 });
    expect(getAvailabilityHighlight(summary.d0p0, getRankedScores(summary))).toBe("best");
    expect(getSlotResponseDetails("d0p0", selected).map((detail) => detail.name)).toEqual(["佐藤", "田中"]);

    const emptySummary = computeSummary(slots, []);
    expect(emptySummary.d0p0).toEqual({ yes: 0, maybe: 0, no: 0, unanswered: 0 });
    expect(getRankedScores(emptySummary)).toEqual({ best: 0, second: 0 });
  });

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

describe("getSlotResponseDetails", () => {
  it("returns each participant status for a slot", () => {
    const details = getSlotResponseDetails("d0p0", [
      { id: "r1", name: "佐藤", answers: { d0p0: "yes" } },
      { id: "r2", name: "鈴木", answers: { d0p0: "maybe" } },
      { id: "r3", name: "田中", answers: { d0p0: "no" } }
    ]);

    expect(details).toEqual([
      { responseId: "r1", name: "佐藤", status: "yes" },
      { responseId: "r2", name: "鈴木", status: "maybe" },
      { responseId: "r3", name: "田中", status: "no" }
    ]);
  });

  it("treats missing or invalid slot answers as unanswered", () => {
    const details = getSlotResponseDetails("d0p0", [
      { id: "r1", name: "佐藤", answers: {} },
      { id: "r2", name: "鈴木", answers: { d0p0: "busy" } as Record<string, unknown> }
    ]);

    expect(details).toEqual([
      { responseId: "r1", name: "佐藤", status: "unanswered" },
      { responseId: "r2", name: "鈴木", status: "unanswered" }
    ]);
  });
});

describe("getAvailabilityHighlight", () => {
  it("scores yes as 2, maybe as 1, and no as 0", () => {
    expect(getSummaryScore({ yes: 2, maybe: 1, no: 4, unanswered: 3 })).toBe(5);
  });

  it("marks highest and second-highest positive slot scores", () => {
    const summary = {
      best: { yes: 2, maybe: 0, no: 0, unanswered: 0 },
      secondA: { yes: 1, maybe: 1, no: 0, unanswered: 0 },
      secondB: { yes: 0, maybe: 3, no: 0, unanswered: 0 },
      lower: { yes: 1, maybe: 0, no: 0, unanswered: 0 },
      zero: { yes: 0, maybe: 0, no: 2, unanswered: 0 }
    };
    const rankedScores = getRankedScores(summary);

    expect(getAvailabilityHighlight(summary.best, rankedScores)).toBe("best");
    expect(getAvailabilityHighlight(summary.secondA, rankedScores)).toBe("second");
    expect(getAvailabilityHighlight(summary.secondB, rankedScores)).toBe("second");
    expect(getAvailabilityHighlight(summary.lower, rankedScores)).toBe("none");
    expect(getAvailabilityHighlight(summary.zero, rankedScores)).toBe("none");
  });

  it("does not mark a second rank when only one positive score exists", () => {
    const summary = {
      positive: { yes: 0, maybe: 1, no: 0, unanswered: 0 },
      zero: { yes: 0, maybe: 0, no: 1, unanswered: 0 }
    };
    const rankedScores = getRankedScores(summary);

    expect(getAvailabilityHighlight(summary.positive, rankedScores)).toBe("best");
    expect(getAvailabilityHighlight(summary.zero, rankedScores)).toBe("none");
  });
});
