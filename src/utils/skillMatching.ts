import { WorkerSkill, SearchCriteria, WorkerProfile, DurationType } from '../types/worker';

export function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Checks if a skill matches the requested occupation.
 */
export function matchesOccupation(skill: WorkerSkill, requestedOccupation: string): boolean {
  if (!requestedOccupation || requestedOccupation.toLowerCase() === 'all') {
    return true;
  }
  return normalizeText(skill.occupation) === normalizeText(requestedOccupation);
}

/**
 * Calculates matched tags between search criteria and worker skill tags.
 */
export function getMatchedTags(skill: WorkerSkill, requiredTags: string[]): string[] {
  if (!requiredTags || requiredTags.length === 0) {
    return [];
  }
  const normalizedSkillTags = skill.skillTags.map(t => normalizeText(t));
  return requiredTags.filter(tag => {
    const normReq = normalizeText(tag);
    return normalizedSkillTags.some(st => st.includes(normReq) || normReq.includes(st));
  });
}

/**
 * Checks if a worker satisfies location criteria.
 */
export function matchesLocation(worker: WorkerProfile, requestedLocation: string): boolean {
  if (!requestedLocation || requestedLocation.toLowerCase() === 'all') {
    return true;
  }
  return normalizeText(worker.location) === normalizeText(requestedLocation);
}

/**
 * Checks if the worker skill offers the requested duration rate,
 * and if the rate falls within optional budget limits.
 */
export function matchesDurationAndBudget(
  skill: WorkerSkill,
  duration: 'any' | DurationType,
  budgetMin?: number,
  budgetMax?: number
): { matches: boolean; effectiveRate: number | null } {
  const rates = skill.serviceRates;

  // Determine effective rate for the duration
  let effectiveRate: number | null = null;
  if (duration === 'hourly' && rates.hourly !== undefined) {
    effectiveRate = rates.hourly;
  } else if (duration === 'daily' && rates.daily !== undefined) {
    effectiveRate = rates.daily;
  } else if (duration === 'weekly' && rates.weekly !== undefined) {
    effectiveRate = rates.weekly;
  } else if (duration === 'monthly' && rates.monthly !== undefined) {
    effectiveRate = rates.monthly;
  } else if (duration === 'project' && rates.project !== undefined) {
    effectiveRate = rates.project;
  } else if (duration === 'any') {
    // If 'any', pick primary rate: daily, else hourly, else weekly, etc.
    effectiveRate = rates.daily ?? rates.hourly ?? rates.weekly ?? rates.monthly ?? rates.project ?? null;
  } else {
    // Duration requested is not supported by this skill (e.g. hourly requested but skill only offers daily)
    return { matches: false, effectiveRate: null };
  }

  // Check budget constraints if provided
  if (effectiveRate !== null) {
    if (budgetMin !== undefined && budgetMin > 0 && effectiveRate < budgetMin) {
      return { matches: false, effectiveRate };
    }
    if (budgetMax !== undefined && budgetMax > 0 && effectiveRate > budgetMax) {
      return { matches: false, effectiveRate };
    }
  }

  return { matches: true, effectiveRate };
}

/**
 * Checks if a skill satisfies all non-negotiable hard search filters.
 */
export function satisfiesFilters(
  worker: WorkerProfile,
  skill: WorkerSkill,
  criteria: SearchCriteria
): { satisfies: boolean; matchedTags: string[]; effectiveRate: number | null } {
  // 1. Occupation match
  if (!matchesOccupation(skill, criteria.occupation)) {
    return { satisfies: false, matchedTags: [], effectiveRate: null };
  }

  // 2. Location match
  if (!matchesLocation(worker, criteria.location)) {
    return { satisfies: false, matchedTags: [], effectiveRate: null };
  }

  // 3. Duration & Budget
  const durationCheck = matchesDurationAndBudget(
    skill,
    criteria.duration,
    criteria.budgetMin,
    criteria.budgetMax
  );
  if (!durationCheck.matches) {
    return { satisfies: false, matchedTags: [], effectiveRate: null };
  }

  // 4. Availability filter
  if (criteria.availability !== 'all') {
    if (skill.availabilityStatus !== criteria.availability && worker.lastAvailabilityConfirmation) {
      // If filtering by specific availability
      if (criteria.availability === 'available' && skill.availabilityStatus !== 'available') {
        return { satisfies: false, matchedTags: [], effectiveRate: durationCheck.effectiveRate };
      }
    }
  }

  // 5. Min rating filter
  if (criteria.minRating > 0) {
    // If worker is new/unrated and new workers are included, allow them through; else check threshold
    if (skill.totalRatings > 0 && skill.averageRating < criteria.minRating) {
      return { satisfies: false, matchedTags: [], effectiveRate: durationCheck.effectiveRate };
    }
    if (skill.totalRatings === 0 && !criteria.includeNewWorkers) {
      return { satisfies: false, matchedTags: [], effectiveRate: durationCheck.effectiveRate };
    }
  }

  // 6. Experience filter
  if (criteria.minExperience > 0 && skill.experienceYears < criteria.minExperience) {
    return { satisfies: false, matchedTags: [], effectiveRate: durationCheck.effectiveRate };
  }

  // 7. Tag match check: if tags are specified, at least one tag should match (or all if strict)
  const matchedTags = getMatchedTags(skill, criteria.selectedTags);
  if (criteria.selectedTags.length > 0 && matchedTags.length === 0) {
    return { satisfies: false, matchedTags: [], effectiveRate: durationCheck.effectiveRate };
  }

  return { satisfies: true, matchedTags, effectiveRate: durationCheck.effectiveRate };
}
