import { describe, expect, it } from "vitest";
import { isValidSchedule, nextRunAfter } from "./responsibilities";

const NOW = 1_000_000_000_000;

describe("responsibility scheduling", () => {
  it("computes next runs for daily/weekly/interval schedules", () => {
    expect(nextRunAfter("daily", NOW)).toBe(NOW + 86400000);
    expect(nextRunAfter("weekly", NOW)).toBe(NOW + 7 * 86400000);
    expect(nextRunAfter("every_6h", NOW)).toBe(NOW + 6 * 3600000);
  });
  it("clamps intervals and rejects unknown schedules", () => {
    expect(nextRunAfter("every_0h", NOW)).toBe(NOW + 3600000);
    expect(nextRunAfter("every_500h", NOW)).toBe(NOW + 168 * 3600000);
    expect(nextRunAfter("monthly", NOW)).toBeNull();
    expect(isValidSchedule("daily")).toBe(true);
    expect(isValidSchedule("monthly")).toBe(false);
  });
});
