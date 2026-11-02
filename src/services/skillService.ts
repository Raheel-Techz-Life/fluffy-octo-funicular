import { WorkerSkill, JobCompletionPayload } from '../types/worker';

export interface SkillUpdateResult {
  updatedSkill: WorkerSkill;
  previousRating: number;
  newRating: number;
  previousJobs: number;
  newJobs: number;
}

/**
 * Updates a specific skill's performance record after a completed job.
 * Invariant: This function strictly operates on ONE skill record.
 * Other skills of the worker will NOT be touched.
 */
export function calculateCompletedJobSkillStats(
  skill: WorkerSkill,
  payload: JobCompletionPayload
): SkillUpdateResult {
  const previousRating = skill.averageRating;
  const previousJobs = skill.completedJobs;
  const previousTotalRatings = skill.totalRatings;

  // Rating updates only if job is not disputed
  let newAverageRating = previousRating;
  let newTotalRatings = previousTotalRatings;

  if (!payload.isDisputed && payload.customerRating > 0) {
    newTotalRatings = previousTotalRatings + 1;
    // Calculate new running average: ((prevAvg * prevTotal) + newRating) / newTotal
    newAverageRating = Number(
      ((previousRating * previousTotalRatings + payload.customerRating) / newTotalRatings).toFixed(2)
    );
  }

  const newJobs = previousJobs + 1;

  const updatedSkill: WorkerSkill = {
    ...skill,
    completedJobs: newJobs,
    totalRatings: newTotalRatings,
    averageRating: newAverageRating,
  };

  return {
    updatedSkill,
    previousRating,
    newRating: newAverageRating,
    previousJobs,
    newJobs,
  };
}
