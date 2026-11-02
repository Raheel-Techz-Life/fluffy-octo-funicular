import { RegistrationCohort } from '../types/job';
import { WorkerProfile, WorkerSkill } from '../types/worker';

const DAY = 24 * 60 * 60 * 1000;

/** Availability older than this must be re-confirmed by an agent before hiring. */
export const REVERIFY_AFTER_DAYS = 14;

export interface CohortInfo {
  cohort: RegistrationCohort;
  daysRegistered: number;
  /** Plain label for cards, e.g. "Registered 2 yrs ago" */
  label: string;
  daysSinceAvailabilityCheck: number;
  needsReverification: boolean;
}

export function daysBetween(fromIso: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / DAY));
}

function ago(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  if (days < 730) return `${Math.round(days / 30)} months ago`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')} yrs ago`;
}

export function cohortInfo(worker: WorkerProfile, skill?: WorkerSkill, now: Date = new Date()): CohortInfo {
  const daysRegistered = daysBetween(worker.registrationDate, now);
  const noJobs = skill ? skill.completedJobs === 0 : false;

  let cohort: RegistrationCohort;
  if (daysRegistered <= 30 || (worker.registrationStatus === 'new' && noJobs)) cohort = 'new';
  else if (daysRegistered <= 180) cohort = 'recent';
  else if (daysRegistered <= 730) cohort = 'established';
  else cohort = 'veteran';

  const daysSinceAvailabilityCheck = daysBetween(worker.lastAvailabilityConfirmation, now);

  return {
    cohort,
    daysRegistered,
    label: `Registered ${ago(daysRegistered)}`,
    daysSinceAvailabilityCheck,
    needsReverification: daysSinceAvailabilityCheck > REVERIFY_AFTER_DAYS,
  };
}

export const COHORT_LABEL: Record<RegistrationCohort, string> = {
  new: 'New registration',
  recent: 'Recent',
  established: 'Established',
  veteran: 'Veteran',
};

/** Tailwind classes per cohort, matching the existing badge palette. */
export const COHORT_STYLE: Record<RegistrationCohort, string> = {
  new: 'bg-amber-50 text-amber-800 border-amber-200',
  recent: 'bg-sky-50 text-sky-800 border-sky-200',
  established: 'bg-slate-100 text-slate-700 border-slate-200',
  veteran: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export const isOldRegistration = (c: RegistrationCohort) => c !== 'new';
