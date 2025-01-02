// The Scheduler class is a utility class that can be used to schedule a task to run at a specific interval. It prevents cases where the local environment could be inactive and the task would not run.
export class Scheduler {
  private timeInterval: number;
  private intervalId?: NodeJS.Timeout;
  private lastRunTime?: Date;

  constructor(timeInterval: number) {
    this.timeInterval = timeInterval;
  }

  public schedule(task: Function): void {
    // schedule only 1 job at a time
    if (this.intervalId) {
      this.unschedule();
    }

    // schedule the job to run every hour if the timeInterval is 24 hours
    this.intervalId = setInterval(() => {
      if (this.shouldRunTask()) {
        task();
        this.updateLastRunTime();
      }
    }, this.timeInterval / 24);
  }

  public unschedule(): void {
    clearInterval(this.intervalId);
    this.lastRunTime = undefined;
  }

  private shouldRunTask(): boolean {
    if (!this.lastRunTime) return true;

    const currentTime = new Date();
    const diff = currentTime.getTime() - this.lastRunTime.getTime();
    return diff >= this.timeInterval;
  }

  private updateLastRunTime(): void {
    this.lastRunTime = new Date();
  }
}

const ONE_DAY_MS = 86400000;

export const scheduler = new Scheduler(ONE_DAY_MS);
