import {
  WorkerProfile,
  WorkerSkill,
  SearchCriteria,
  RankingBreakdown,
  WorkerSearchResult,
} from '../types/worker';
import { getMatchedTags, satisfiesFilters } from './skillMatching';

const PRIOR_CONFIDENCE_M = 5;
const PRIOR_BASELINE_RATING_C = 4.0;

/**
 * Computes Bayesian-smoothed confidence rating.
 * Formula: WR = (v * R + m * C) / (v + m)
 */
export function calculateBayesianRating(averageRating: number, totalRatings: number): number {
  if (totalRatings <= 0) {
    return 0; // Unrated
  }
  return (totalRatings * averageRating + PRIOR_CONFIDENCE_M * PRIOR_BASELINE_RATING_C) / (totalRatings + PRIOR_CONFIDENCE_M);
}

/**
 * Calculates ranking score (0-100) and breakdown for a worker's specific skill.
 */
export function calculateSkillRanking(
  worker: WorkerProfile,
  skill: WorkerSkill,
  criteria: SearchCriteria,
  effectiveRate: number | null
): RankingBreakdown {
  const isNewWorker = worker.registrationStatus === 'new' || skill.completedJobs === 0;
  const reasons: string[] = [];

  // 1. Skill / Tag Relevance (35%)
  let tagMatchScore = 0;
  const matchedTags = getMatchedTags(skill, criteria.selectedTags);
  if (criteria.selectedTags.length > 0) {
    const ratio = matchedTags.length / criteria.selectedTags.length;
    tagMatchScore = Math.round(ratio * 35);
    reasons.push(`Matched ${matchedTags.length} of ${criteria.selectedTags.length} required tags (${matchedTags.join(', ')})`);
  } else {
    // If no tags requested, full tag relevance for matching occupation
    tagMatchScore = 35;
    reasons.push(`Matches occupation "${skill.occupation}"`);
  }

  // 2. Skill-Specific Rating (25%)
  let ratingScore = 0;
  if (isNewWorker || skill.totalRatings === 0) {
    // Fair baseline opportunity for new workers (70% of rating weight)
    ratingScore = 17.5;
    reasons.push(`New worker: Unrated baseline discovery score applied (no artificial ratings)`);
  } else {
    const bayesianRating = calculateBayesianRating(skill.averageRating, skill.totalRatings);
    // Rating out of 5 normalized to 25 pts
    ratingScore = Math.min(25, Number(((bayesianRating / 5) * 25).toFixed(1)));
    reasons.push(
      `Bayesian-weighted rating ${bayesianRating.toFixed(2)}★ from ${skill.totalRatings} verified reviews (raw: ${skill.averageRating}★)`
    );
  }

  // 3. Skill-Specific Completed Jobs (15%)
  let jobsScore = 0;
  if (skill.completedJobs > 0) {
    // Diminishing returns scaling: 50+ jobs reaches near maximum 15 pts
    // score = 15 * (1 - e^(-jobs / 20))
    const normalized = Math.min(1, 1 - Math.exp(-skill.completedJobs / 20));
    jobsScore = Math.round(normalized * 15 * 10) / 10;
    reasons.push(`${skill.completedJobs} completed ${skill.occupation.toLowerCase()} jobs on platform`);
  } else {
    // 0 jobs
    jobsScore = isNewWorker ? 4 : 0;
    reasons.push(isNewWorker ? `New entrant discovery allocation for job history` : `No completed jobs on platform yet`);
  }

  // 4. Relevant Experience (10%)
  // Capped at 10 years experience = 10 pts
  const expScore = Math.min(10, Math.max(1, skill.experienceYears));
  const experienceScore = Math.round(expScore * 10) / 10;
  reasons.push(`${skill.experienceYears} years dedicated ${skill.occupation.toLowerCase()} experience`);

  // 5. Availability (10%)
  let availabilityScore = 0;
  if (skill.availabilityStatus === 'available') {
    availabilityScore = 10;
    reasons.push(`Agent-confirmed available for immediate assignment`);
  } else if (skill.availabilityStatus === 'availability_pending') {
    availabilityScore = 6;
    reasons.push(`Availability pending agent confirmation`);
  } else if (skill.availabilityStatus === 'temporarily_unavailable') {
    availabilityScore = 2;
    reasons.push(
      worker.expectedAvailableAt
        ? `Busy until ${new Date(worker.expectedAvailableAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
        : `Temporarily unavailable`
    );
  } else {
    availabilityScore = 0;
    reasons.push(`Status: ${skill.availabilityStatus.replace('_', ' ')}`);
  }

  // 6. Location Proximity (5%)
  let locationScore = 0;
  const workerLoc = worker.location.trim().toLowerCase();
  const critLoc = criteria.location.trim().toLowerCase();
  if (critLoc === 'all' || critLoc === '') {
    locationScore = 5;
    reasons.push(`Serves regional area (${worker.location}, ${worker.area})`);
  } else if (workerLoc === critLoc) {
    locationScore = 5;
    reasons.push(`Exact location match in ${worker.location} (${worker.area})`);
  } else {
    // Hubballi & Dharwad are twin cities (within 20km commute)
    if (
      (workerLoc === 'hubballi' && critLoc === 'dharwad') ||
      (workerLoc === 'dharwad' && critLoc === 'hubballi')
    ) {
      locationScore = 3.5;
      reasons.push(`Twin-city proximity (${worker.location} to ${criteria.location})`);
    } else {
      locationScore = 1;
      reasons.push(`Outside primary location: ${worker.location}`);
    }
  }

  const totalScore = Math.min(
    100,
    Math.round((tagMatchScore + ratingScore + jobsScore + experienceScore + availabilityScore + locationScore) * 10) / 10
  );

  return {
    tagMatchScore,
    ratingScore,
    jobsScore,
    experienceScore,
    availabilityScore,
    locationScore,
    totalScore,
    reasons,
    matchedTags,
    isNewWorker,
    effectiveRate,
  };
}

/**
 * Ranks a list of candidate search results according to the chosen sort strategy.
 */
export function rankCandidates(
  candidates: WorkerSearchResult[],
  sortBy: SearchCriteria['sortBy']
): WorkerSearchResult[] {
  return [...candidates].sort((a, b) => {
    if (sortBy === 'rating') {
      // Unrated workers sort after rated workers
      if (a.matchingSkill.totalRatings === 0 && b.matchingSkill.totalRatings > 0) return 1;
      if (b.matchingSkill.totalRatings === 0 && a.matchingSkill.totalRatings > 0) return -1;
      return b.matchingSkill.averageRating - a.matchingSkill.averageRating;
    }
    if (sortBy === 'experience') {
      return b.matchingSkill.experienceYears - a.matchingSkill.experienceYears;
    }
    if (sortBy === 'jobs') {
      return b.matchingSkill.completedJobs - a.matchingSkill.completedJobs;
    }
    if (sortBy === 'price_low_high') {
      const rateA = a.ranking.effectiveRate ?? Infinity;
      const rateB = b.ranking.effectiveRate ?? Infinity;
      return rateA - rateB;
    }
    // Default: 'relevance'
    return b.ranking.totalScore - a.ranking.totalScore;
  });
}
