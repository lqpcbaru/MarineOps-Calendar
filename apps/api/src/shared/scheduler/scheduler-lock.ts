export class SchedulerLock {
  private locks = new Map<string, boolean>();

  acquire(jobId: string): boolean {
    if (this.locks.get(jobId)) return false;
    this.locks.set(jobId, true);
    return true;
  }

  release(jobId: string): void {
    this.locks.delete(jobId);
  }

  isLocked(jobId: string): boolean {
    return this.locks.get(jobId) === true;
  }

  clear(): void {
    this.locks.clear();
  }
}
