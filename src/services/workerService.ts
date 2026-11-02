import {
  WorkerProfile,
  WorkerSkill,
  SkillReview,
  SearchCriteria,
  WorkerSearchResult,
  JobCompletionPayload,
  AvailabilityUpdatePayload,
} from '../types/worker';
import { INITIAL_WORKERS, INITIAL_SKILLS, INITIAL_REVIEWS } from '../data/demoWorkers';
import { satisfiesFilters } from '../utils/skillMatching';
import { calculateSkillRanking, rankCandidates } from '../utils/workerRanking';
import { interleaveNewWorkers } from '../utils/newWorkerPlacement';
import { calculateCompletedJobSkillStats } from './skillService';

// Module state
let workersState: WorkerProfile[] = JSON.parse(JSON.stringify(INITIAL_WORKERS));
let skillsState: Record<string, WorkerSkill[]> = JSON.parse(JSON.stringify(INITIAL_SKILLS));
let reviewsState: SkillReview[] = JSON.parse(JSON.stringify(INITIAL_REVIEWS));

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function subscribeToWorkerUpdates(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reset state back to initial demo data
 */
export function resetToDemoData(): void {
  workersState = JSON.parse(JSON.stringify(INITIAL_WORKERS));
  skillsState = JSON.parse(JSON.stringify(INITIAL_SKILLS));
  reviewsState = JSON.parse(JSON.stringify(INITIAL_REVIEWS));
  notifyListeners();
}

/**
 * 1. getAllWorkers()
 * Retrieves all registered worker profile records.
 */
export function getAllWorkers(): WorkerProfile[] {
  return [...workersState];
}

/**
 * 2. getWorkerById(workerId)
 * Returns the single permanent worker record.
 */
export function getWorkerById(workerId: string): WorkerProfile | undefined {
  return workersState.find(w => w.workerId === workerId);
}

/**
 * 3. getWorkerSkills(workerId)
 * Returns all independent skills registered for a given worker.
 */
export function getWorkerSkills(workerId: string): WorkerSkill[] {
  return skillsState[workerId] ? [...skillsState[workerId]] : [];
}

/**
 * Returns reviews for a worker, optionally filtered by skill.
 */
export function getSkillReviews(workerId: string, skillId?: string): SkillReview[] {
  return reviewsState.filter(r => r.workerId === workerId && (!skillId || r.skillId === skillId));
}

/**
 * 4. searchWorkers(searchCriteria)
 * Core search method that finds matching worker-skill candidates,
 * ranks them, and applies controlled new-worker interleaving.
 */
export function searchWorkers(criteria: SearchCriteria): WorkerSearchResult[] {
  const regularCandidates: WorkerSearchResult[] = [];
  const newCandidates: WorkerSearchResult[] = [];

  for (const worker of workersState) {
    if (worker.profileVisibility !== 'public') continue;

    const workerSkills = skillsState[worker.workerId] || [];

    // Evaluate each skill against the search criteria
    for (const skill of workerSkills) {
      const filterResult = satisfiesFilters(worker, skill, criteria);
      if (filterResult.satisfies) {
        const ranking = calculateSkillRanking(worker, skill, criteria, filterResult.effectiveRate);
        const searchResult: WorkerSearchResult = {
          worker,
          matchingSkill: skill,
          allSkills: workerSkills,
          ranking,
        };

        if (ranking.isNewWorker) {
          newCandidates.push(searchResult);
        } else {
          regularCandidates.push(searchResult);
        }
        // Take the primary matching skill for this search query
        break;
      }
    }
  }

  // Rank both groups according to the selected sorting option
  const rankedRegular = rankCandidates(regularCandidates, criteria.sortBy);
  const rankedNew = rankCandidates(newCandidates, criteria.sortBy);

  // If user disabled new worker interleaving or specified non-relevance sort
  if (!criteria.includeNewWorkers) {
    return rankedRegular;
  }

  // Interleave new workers: 2 regular -> 1 new -> 2 regular ...
  return interleaveNewWorkers(rankedRegular, rankedNew, 2);
}

/**
 * 5. rankWorkers(workers, searchCriteria)
 * Re-ranks an existing set of worker search results.
 */
export function rankWorkers(
  candidates: WorkerSearchResult[],
  criteria: SearchCriteria
): WorkerSearchResult[] {
  return rankCandidates(candidates, criteria.sortBy);
}

/**
 * 6. updateSkillStatistics(workerId, skillId, jobData)
 * Completes a job and updates ONLY the targeted skill's statistics!
 * Invariant: Ramesh's Electrician rating & jobs NEVER change when Plumbing is updated.
 */
export function updateSkillStatistics(
  workerId: string,
  skillId: string,
  payload: JobCompletionPayload
): { success: boolean; affectedSkill: WorkerSkill; allWorkerSkills: WorkerSkill[] } {
  const workerSkills = skillsState[workerId];
  if (!workerSkills) {
    throw new Error(`Worker with ID ${workerId} not found.`);
  }

  const skillIndex = workerSkills.findIndex(s => s.skillId === skillId);
  if (skillIndex === -1) {
    throw new Error(`Skill with ID ${skillId} not found for worker ${workerId}.`);
  }

  const targetSkill = workerSkills[skillIndex];
  const { updatedSkill } = calculateCompletedJobSkillStats(targetSkill, payload);

  // Immutably replace only that specific skill in workerSkills
  const newWorkerSkills = [...workerSkills];
  newWorkerSkills[skillIndex] = updatedSkill;
  skillsState[workerId] = newWorkerSkills;

  // Append new review if valid rating provided
  if (!payload.isDisputed && payload.customerRating > 0) {
    if (!payload.mediaUrl) {
      throw new Error('Photo or video feedback is required to complete this job.');
    }
    const newReview: SkillReview = {
      reviewId: `REV_${Date.now()}`,
      workerId,
      skillId,
      jobId: payload.jobId,
      customerName: payload.customerName || 'Anonymous Customer',
      rating: payload.customerRating,
      feedback: payload.feedback || 'Job completed successfully.',
      createdAt: new Date().toISOString(),
      jobDuration: payload.jobDuration || '1 Day',
      durationUnit: payload.jobDurationUnit,
      mediaType: payload.mediaType,
      mediaUrl: payload.mediaUrl,
    };
    reviewsState = [newReview, ...reviewsState];
  }

  // Update worker's lastUpdatedAt timestamp
  const workerIndex = workersState.findIndex(w => w.workerId === workerId);
  if (workerIndex !== -1) {
    workersState[workerIndex] = {
      ...workersState[workerIndex],
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  notifyListeners();

  return {
    success: true,
    affectedSkill: updatedSkill,
    allWorkerSkills: newWorkerSkills,
  };
}

/**
 * 7. updateWorkerAvailability(workerId, statusData)
 * Updates worker availability through agent coordination.
 */
export function updateWorkerAvailability(
  workerId: string,
  payload: AvailabilityUpdatePayload
): WorkerProfile {
  const workerIndex = workersState.findIndex(w => w.workerId === workerId);
  if (workerIndex === -1) {
    throw new Error(`Worker with ID ${workerId} not found.`);
  }

  const now = new Date().toISOString();
  const updatedWorker: WorkerProfile = {
    ...workersState[workerIndex],
    lastAvailabilityConfirmation: now,
    lastUpdatedAt: now,
    expectedAvailableAt: payload.expectedAvailableAt ?? null,
    unavailabilityReason: payload.reason,
    agentId: payload.agentId || workersState[workerIndex].agentId,
  };

  workersState[workerIndex] = updatedWorker;

  // If status is skill-specific
  if (payload.skillSpecificSkillId && skillsState[workerId]) {
    skillsState[workerId] = skillsState[workerId].map(skill => {
      if (skill.skillId === payload.skillSpecificSkillId) {
        return {
          ...skill,
          availabilityStatus: payload.status,
        };
      }
      return skill;
    });
  } else if (skillsState[workerId]) {
    // Global update across skills for this worker
    skillsState[workerId] = skillsState[workerId].map(skill => ({
      ...skill,
      availabilityStatus: payload.status,
    }));
  }

  notifyListeners();
  return updatedWorker;
}

/**
 * 8. getWorkerSearchProfile(workerId)
 * Returns the full composite record suitable for detailed view and teammate handoff.
 */
export function getWorkerSearchProfile(workerId: string): {
  worker: WorkerProfile;
  skills: WorkerSkill[];
  reviews: SkillReview[];
} | null {
  const worker = getWorkerById(workerId);
  if (!worker) return null;
  const skills = getWorkerSkills(workerId);
  const reviews = getSkillReviews(workerId);
  return { worker, skills, reviews };
}

/**
 * Utility to extract all unique occupations available across the system.
 */
export function getAllAvailableOccupations(): string[] {
  const occupations = new Set<string>();
  Object.values(skillsState).forEach(skillsList => {
    skillsList.forEach(s => occupations.add(s.occupation));
  });
  return Array.from(occupations).sort();
}

/**
 * Utility to extract all tags available for a given occupation.
 */
export function getTagsForOccupation(occupation: string): string[] {
  const tags = new Set<string>();
  Object.values(skillsState).forEach(skillsList => {
    skillsList.forEach(s => {
      if (occupation === 'all' || s.occupation.toLowerCase() === occupation.toLowerCase()) {
        s.skillTags.forEach(t => tags.add(t));
      }
    });
  });
  return Array.from(tags).sort();
}
