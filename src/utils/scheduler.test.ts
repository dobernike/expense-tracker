import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Scheduler } from "./scheduler.js";

const ONE_MINUTE_MS = 60000;

const mockTask = vi.fn();

describe("Scheduler", () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    vi.useFakeTimers();
    scheduler = new Scheduler(ONE_MINUTE_MS);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should schedule, run, and unschedule tasks correctly", () => {
    scheduler.schedule(mockTask);

    expect(scheduler["lastRunTime"]).not.toBeDefined();

    vi.advanceTimersByTime(ONE_MINUTE_MS);
    expect(mockTask).toHaveBeenCalledTimes(1);
    const runTime = scheduler["lastRunTime"];
    expect(runTime).toBeDefined();

    vi.advanceTimersByTime(ONE_MINUTE_MS);
    expect(mockTask).toHaveBeenCalledTimes(2);
    expect(scheduler["lastRunTime"]).not.toBe(runTime);

    scheduler.unschedule();
    vi.advanceTimersByTime(ONE_MINUTE_MS);
    expect(mockTask).not.toHaveBeenCalledTimes(3);
    expect(scheduler["lastRunTime"]).not.toBeDefined();
  });
});
