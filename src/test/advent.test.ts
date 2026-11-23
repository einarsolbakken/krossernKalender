import { describe, it, expect } from "vitest";
import { calendarDays, calendarHeadline, isDoorOpenable } from "@/lib/advent";

describe("door unlocking", () => {
  it("door 5 is locked on 4 December (Oslo)", () => {
    expect(isDoorOpenable(5, new Date("2026-12-04T12:00:00Z"))).toBe(false);
  });
  it("door 5 opens on 5 December at Oslo midnight", () => {
    expect(isDoorOpenable(5, new Date("2026-12-04T23:30:00Z"))).toBe(true);
  });
  it("nothing opens in November", () => {
    expect(isDoorOpenable(1, new Date("2026-11-30T12:00:00Z"))).toBe(false);
  });
  it("opens all 24 doors for testing in the development preview", () => {
    expect(calendarDays(new Date("2026-11-16T12:23:00Z"), true)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
  });
  it("keeps all production doors locked before December", () => {
    expect(calendarDays(new Date("2026-11-16T12:23:00Z"), false)).toEqual([]);
  });
  it("opens only door 1 on 1 December", () => {
    expect(calendarDays(new Date("2026-12-01T00:30:00Z"), false)).toEqual([1]);
  });
  it("opens one new door each day and keeps earlier days open", () => {
    expect(calendarDays(new Date("2026-12-14T12:00:00Z"), false)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1),
    );
  });
  it("has every door open on 24 December", () => {
    expect(calendarDays(new Date("2026-12-24T12:00:00Z"), false)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
  });
  it("opens every door in both calendar read paths during owner review", async () => {
    const sources = await Promise.all([
      import("@/lib/doors.functions?raw"),
      import("@/routes/api/public/calendar?raw"),
    ]);
    for (const source of sources) {
      expect(source.default).toContain("calendarDays(new Date(), true)");
      expect(source.default).not.toContain("calendarDays(new Date(), false)");
    }
  });
  it("asks for the package to be opened before today's door is opened", () => {
    expect(calendarHeadline([1, 2, 3], [1, 2])).toBe(
      "Dagens luke er klar til å åpnes - trykk på pakken",
    );
  });
  it("says the door is opened once today's door has been opened", () => {
    expect(calendarHeadline([1, 2, 3], [1, 2, 3])).toBe("Dagens luke er åpnet");
  });
  it("says the first package comes 1 December before anything is open", () => {
    expect(calendarHeadline([], [])).toBe("Første pakke kan åpnes 1. desember.");
  });
});
