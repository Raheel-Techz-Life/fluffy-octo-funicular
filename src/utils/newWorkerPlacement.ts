import { WorkerSearchResult } from '../types/worker';

/**
 * Interleaves regular matching workers with eligible new workers:
 * Pattern: 2 Regular -> 1 New -> 2 Regular -> 1 New ...
 *
 * Rules:
 * 1. Both regular and new workers passed to this function have ALREADY
 *    satisfied all search criteria (occupation, tags, location, duration, budget).
 * 2. If no eligible new workers exist, regular workers simply proceed continuously.
 * 3. Never insert an irrelevant worker.
 */
export function interleaveNewWorkers(
  regularWorkers: WorkerSearchResult[],
  newWorkers: WorkerSearchResult[],
  regularInterval: number = 2
): WorkerSearchResult[] {
  const result: WorkerSearchResult[] = [];
  let regIndex = 0;
  let newIndex = 0;

  while (regIndex < regularWorkers.length || newIndex < newWorkers.length) {
    // Add up to `regularInterval` regular workers
    for (let i = 0; i < regularInterval && regIndex < regularWorkers.length; i++) {
      result.push(regularWorkers[regIndex]);
      regIndex++;
    }

    // Insert 1 eligible new worker if available
    if (newIndex < newWorkers.length) {
      const newCandidate = { ...newWorkers[newIndex], isNewPlacementSlot: true };
      result.push(newCandidate);
      newIndex++;
    }
  }

  return result;
}
