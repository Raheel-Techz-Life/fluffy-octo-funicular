import { DurationType } from './worker';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** A job's work site and the geofence around it. */
export interface JobSite {
  name: string;
  address: string;
  location: GeoPoint;
  radiusMeters: number;
}

/**
 * Registration cohorts used in recruitment.
 * new: registered in the last 30 days (or flagged 'new' with no jobs yet)
 * recent: 31-180 days, established: 181-730 days, veteran: over 2 years
 */
export type RegistrationCohort = 'new' | 'recent' | 'established' | 'veteran';

/**
 * How a job mixes new and old registrations:
 * experienced_only: established registrations only
 * balanced: reserve `newSlotsReserved` of the headcount for new registrations
 * new_first: fill from new registrations first (onboarding drives, entry-level work)
 */
export type RecruitmentMode = 'experienced_only' | 'balanced' | 'new_first';

export type JobStatus = 'open' | 'staffed' | 'in_progress' | 'completed';

export interface JobPosting {
  jobId: string;
  title: string;
  employerName: string;
  occupation: string;
  requiredTags: string[];
  site: JobSite;
  headcount: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  shiftStart: string; // HH:MM, local time
  shiftEnd: string; // HH:MM
  duration: DurationType;
  rateOffered: number;
  recruitmentMode: RecruitmentMode;
  newSlotsReserved: number;
  maxCommuteKm: number;
  createdAt: string;
  status: JobStatus;
}

export type CandidateStage = 'shortlisted' | 'invited' | 'accepted' | 'declined' | 'hired';

export interface JobCandidate {
  jobId: string;
  workerId: string;
  skillId: string;
  stage: CandidateStage;
  updatedAt: string;
  /** Agent or recruiter note, e.g. why a candidate declined */
  note?: string;
}

export type LocationSource = 'device_gps' | 'agent_device' | 'simulated';

export interface LocationPing {
  pingId: string;
  jobId: string;
  workerId: string;
  at: string;
  point: GeoPoint;
  accuracyMeters: number | null;
  source: LocationSource;
  distanceMeters: number;
  insideFence: boolean;
}

export type GeofenceEventType = 'check_in' | 'check_in_rejected' | 'exited' | 'entered' | 'check_out';

export interface GeofenceEvent {
  eventId: string;
  jobId: string;
  workerId: string;
  type: GeofenceEventType;
  at: string;
  distanceMeters: number;
  source: LocationSource;
}

export type SiteAlertKind = 'not_arrived' | 'rejected_check_in' | 'left_site' | 'stale_location';

export interface SiteAlert {
  kind: SiteAlertKind;
  workerId: string;
  message: string;
  at: string;
}
