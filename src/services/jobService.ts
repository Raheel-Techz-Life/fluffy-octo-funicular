import {
  CandidateStage,
  GeoPoint,
  GeofenceEvent,
  GeofenceEventType,
  JobCandidate,
  JobPosting,
  LocationPing,
  LocationSource,
  SiteAlert,
} from '../types/job';
import { SearchCriteria, WorkerSearchResult } from '../types/worker';
import { getWorkerById, searchWorkers, subscribeToWorkerUpdates } from './workerService';
import { distanceMeters, offsetPoint, workerHomePoint } from '../utils/geo';
import { CohortInfo, cohortInfo } from '../utils/registrationCohort';

/*
 * Jobs, recruitment pipeline and geofenced site tracking.
 * Module state with listeners, same pattern as workerService. Swap for Firebase
 * paths /jobs, /jobCandidates, /locationPings, /geofenceEvents in production.
 */

// ------------------------------------------------------------------ state

let jobsState: JobPosting[] = [];
let candidatesState: Record<string, JobCandidate[]> = {};
let pingsState: LocationPing[] = [];
let eventsState: GeofenceEvent[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach(fn => fn());

export function subscribeToJobUpdates(listener: Listener): () => void {
  listeners.add(listener);
  // Worker availability changes affect shortlists too.
  const unsubWorkers = subscribeToWorkerUpdates(listener);
  return () => {
    listeners.delete(listener);
    unsubWorkers();
  };
}

let seq = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

// ------------------------------------------------------------------ jobs

export function getJobs(): JobPosting[] {
  return [...jobsState].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJob(jobId: string): JobPosting | undefined {
  return jobsState.find(j => j.jobId === jobId);
}

export type NewJobInput = Omit<JobPosting, 'jobId' | 'createdAt' | 'status'>;

export function createJob(input: NewJobInput): JobPosting {
  const next = jobsState.reduce((m, j) => Math.max(m, parseInt(j.jobId.replace(/\D/g, ''), 10) || 0), 1000) + 1;
  const job: JobPosting = {
    ...input,
    headcount: Math.max(1, Math.round(input.headcount)),
    newSlotsReserved: Math.max(0, Math.min(Math.round(input.newSlotsReserved), input.headcount)),
    jobId: `J-${next}`,
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  jobsState = [job, ...jobsState];
  candidatesState[job.jobId] = [];
  notify();
  return job;
}

function setJobStatus(jobId: string, status: JobPosting['status']) {
  jobsState = jobsState.map(j => (j.jobId === jobId ? { ...j, status } : j));
}

// ------------------------------------------------------------------ recruitment

export interface ShortlistEntry {
  result: WorkerSearchResult;
  cohort: CohortInfo;
  distanceKm: number | null;
  withinCommute: boolean;
  /** Ranking score plus up to 5 points for being close to the site */
  fitScore: number;
  asksAboveOffer: boolean;
  /** Already hired on another job whose dates overlap this one */
  bookedOn: { jobId: string; title: string; endDate: string } | null;
  recommended: boolean;
  candidate: JobCandidate | null;
}

export interface Shortlist {
  established: ShortlistEntry[];
  newcomers: ShortlistEntry[];
  excluded: { workerId: string; name: string; reason: string }[];
  slots: { forNew: number; forEstablished: number };
  hiredCount: number;
}

const UNHIREABLE = new Set(['not_interested', 'profile_inactive', 'contact_unsuccessful']);

export function getCandidates(jobId: string): JobCandidate[] {
  return [...(candidatesState[jobId] ?? [])];
}

export function getHired(jobId: string): JobCandidate[] {
  return getCandidates(jobId).filter(c => c.stage === 'hired');
}

export function buildShortlist(job: JobPosting, now: Date = new Date()): Shortlist {
  const criteria: SearchCriteria = {
    occupation: job.occupation,
    selectedTags: job.requiredTags,
    location: 'all',
    duration: job.duration,
    availability: 'all',
    minRating: 0,
    minExperience: 0,
    includeNewWorkers: true,
    sortBy: 'relevance',
  };

  const candidates = candidatesState[job.jobId] ?? [];
  const established: ShortlistEntry[] = [];
  const newcomers: ShortlistEntry[] = [];
  const excluded: Shortlist['excluded'] = [];

  for (const result of searchWorkers(criteria)) {
    const { worker, matchingSkill } = result;
    const home = workerHomePoint(worker);
    const distanceKm = home ? distanceMeters(home, job.site.location) / 1000 : null;
    const withinCommute = distanceKm === null || distanceKm <= job.maxCommuteKm;
    const candidate = candidates.find(c => c.workerId === worker.workerId) ?? null;

    if (UNHIREABLE.has(matchingSkill.availabilityStatus) && !candidate) {
      excluded.push({ workerId: worker.workerId, name: worker.fullName, reason: matchingSkill.availabilityStatus.replace(/_/g, ' ') });
      continue;
    }
    if (!withinCommute && !candidate) {
      excluded.push({
        workerId: worker.workerId,
        name: worker.fullName,
        reason: `${distanceKm!.toFixed(1)} km from site, beyond the ${job.maxCommuteKm} km limit`,
      });
      continue;
    }

    const clash = jobsState.find(other =>
      other.jobId !== job.jobId &&
      other.status !== 'completed' &&
      other.startDate <= job.endDate && job.startDate <= other.endDate &&
      (candidatesState[other.jobId] ?? []).some(c => c.workerId === worker.workerId && c.stage === 'hired'));
    const proximityBonus = distanceKm === null ? 0 : 5 * Math.max(0, 1 - distanceKm / Math.max(job.maxCommuteKm, 0.1));
    const rate = result.ranking.effectiveRate;
    const entry: ShortlistEntry = {
      result,
      cohort: cohortInfo(worker, matchingSkill, now),
      distanceKm,
      withinCommute,
      fitScore: Math.min(100, Math.round((result.ranking.totalScore + proximityBonus) * 10) / 10),
      asksAboveOffer: rate !== null && rate > job.rateOffered,
      bookedOn: clash ? { jobId: clash.jobId, title: clash.title, endDate: clash.endDate } : null,
      recommended: false,
      candidate,
    };
    (entry.cohort.cohort === 'new' ? newcomers : established).push(entry);
  }

  const byFit = (a: ShortlistEntry, b: ShortlistEntry) => b.fitScore - a.fitScore;
  established.sort(byFit);
  newcomers.sort(byFit);

  const slots = slotsFor(job);
  const hiredCount = candidates.filter(c => c.stage === 'hired').length;
  markRecommended(job, established, newcomers, slots);

  return { established, newcomers, excluded, slots, hiredCount };
}

export function slotsFor(job: JobPosting): Shortlist['slots'] {
  if (job.recruitmentMode === 'experienced_only') return { forNew: 0, forEstablished: job.headcount };
  if (job.recruitmentMode === 'new_first') return { forNew: job.headcount, forEstablished: 0 };
  const forNew = Math.min(job.newSlotsReserved, job.headcount);
  return { forNew, forEstablished: job.headcount - forNew };
}

/** Picks who to invite: fill each lane's slots, then backfill from the other lane where the mode allows. */
function markRecommended(job: JobPosting, established: ShortlistEntry[], newcomers: ShortlistEntry[], slots: Shortlist['slots']) {
  const pickable = (e: ShortlistEntry) =>
    e.withinCommute && !e.bookedOn && e.candidate?.stage !== 'declined' && !UNHIREABLE.has(e.result.matchingSkill.availabilityStatus);

  const take = (lane: ShortlistEntry[], n: number) => {
    let left = n;
    for (const e of lane) {
      if (left <= 0) break;
      if (!e.recommended && pickable(e)) {
        e.recommended = true;
        left--;
      }
    }
    return left;
  };

  const newShort = take(newcomers, slots.forNew);
  const oldShort = take(established, slots.forEstablished);
  // Backfill: new_first and balanced may use established workers when not enough new ones qualify.
  if (newShort > 0) take(established, newShort);
  // Established shortfalls are only backfilled with new registrations outside experienced_only.
  if (oldShort > 0 && job.recruitmentMode !== 'experienced_only') take(newcomers, oldShort);
}

export function setCandidateStage(jobId: string, workerId: string, skillId: string, stage: CandidateStage, note?: string): void {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found.`);
  const list = candidatesState[jobId] ?? [];

  if (stage === 'hired') {
    const hired = list.filter(c => c.stage === 'hired' && c.workerId !== workerId).length;
    if (hired >= job.headcount) throw new Error(`All ${job.headcount} positions are filled. Release someone first.`);
    const clash = jobsState.find(o =>
      o.jobId !== jobId && o.status !== 'completed' && o.startDate <= job.endDate && job.startDate <= o.endDate &&
      (candidatesState[o.jobId] ?? []).some(c => c.workerId === workerId && c.stage === 'hired'));
    if (clash) throw new Error(`Already hired on ${clash.jobId} (${clash.title}) for overlapping dates.`);
  }

  const now = new Date().toISOString();
  const existing = list.find(c => c.workerId === workerId);
  candidatesState[jobId] = existing
    ? list.map(c => (c.workerId === workerId ? { ...c, stage, updatedAt: now, note: note ?? c.note } : c))
    : [...list, { jobId, workerId, skillId, stage, updatedAt: now, note }];

  const hiredNow = candidatesState[jobId].filter(c => c.stage === 'hired').length;
  if (job.status === 'open' && hiredNow >= job.headcount) setJobStatus(jobId, 'staffed');
  if (job.status === 'staffed' && hiredNow < job.headcount) setJobStatus(jobId, 'open');
  notify();
}

export function releaseCandidate(jobId: string, workerId: string): void {
  candidatesState[jobId] = (candidatesState[jobId] ?? []).filter(c => c.workerId !== workerId);
  const job = getJob(jobId);
  if (job?.status === 'staffed') setJobStatus(jobId, 'open');
  notify();
}

/** Registration mix across everyone hired so far, for the recruitment summary. */
export function hiringMix(): { newHires: number; establishedHires: number } {
  let newHires = 0;
  let establishedHires = 0;
  for (const list of Object.values(candidatesState)) {
    for (const c of list) {
      if (c.stage !== 'hired') continue;
      const w = getWorkerById(c.workerId);
      if (!w) continue;
      if (cohortInfo(w).cohort === 'new') newHires++;
      else establishedHires++;
    }
  }
  return { newHires, establishedHires };
}

// ------------------------------------------------------------------ geofence tracking

export function getPings(jobId: string, workerId?: string): LocationPing[] {
  return pingsState.filter(p => p.jobId === jobId && (!workerId || p.workerId === workerId)).sort((a, b) => a.at.localeCompare(b.at));
}

export function getEvents(jobId: string, workerId?: string): GeofenceEvent[] {
  return eventsState.filter(e => e.jobId === jobId && (!workerId || e.workerId === workerId)).sort((a, b) => a.at.localeCompare(b.at));
}

export type SiteState = 'not_checked_in' | 'on_site' | 'off_site' | 'checked_out';

export function siteState(jobId: string, workerId: string): SiteState {
  let state: SiteState = 'not_checked_in';
  for (const e of getEvents(jobId, workerId)) {
    if (e.type === 'check_in' || e.type === 'entered') state = 'on_site';
    else if (e.type === 'exited') state = 'off_site';
    else if (e.type === 'check_out') state = 'checked_out';
  }
  return state;
}

/** Milliseconds spent inside the geofence between check-in and check-out (or now). */
export function timeOnSiteMs(jobId: string, workerId: string, now: Date = new Date()): number {
  let total = 0;
  let since: number | null = null;
  for (const e of getEvents(jobId, workerId)) {
    const t = new Date(e.at).getTime();
    if ((e.type === 'check_in' || e.type === 'entered') && since === null) since = t;
    if ((e.type === 'exited' || e.type === 'check_out') && since !== null) {
      total += t - since;
      since = null;
    }
  }
  if (since !== null) total += now.getTime() - since;
  return total;
}

export type LocationAction = 'check_in' | 'ping' | 'check_out';

export interface LocationResult {
  ping: LocationPing;
  event: GeofenceEvent | null;
  message: string;
}

/**
 * Records a location report from a worker (their phone or the field agent's) and
 * applies the geofence rules:
 *   check_in  inside the fence → check_in; outside → check_in_rejected
 *   ping      on site and now outside → exited; off site and back inside → entered
 *   check_out always recorded, with the distance at the time
 * Accuracy: a fix whose error circle overlaps the fence edge is treated as inside,
 * so a weak indoor GPS fix doesn't reject a worker standing at the gate.
 */
export function reportLocation(
  jobId: string,
  workerId: string,
  point: GeoPoint,
  action: LocationAction,
  source: LocationSource,
  accuracyMeters: number | null = null,
  at: Date = new Date(),
): LocationResult {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found.`);
  if (!getHired(jobId).some(c => c.workerId === workerId)) {
    throw new Error('Only hired workers can check in to this site.');
  }

  const distance = distanceMeters(point, job.site.location);
  const tolerance = Math.min(accuracyMeters ?? 0, 50);
  const insideFence = distance <= job.site.radiusMeters + tolerance;

  const ping: LocationPing = {
    pingId: uid('PING'),
    jobId,
    workerId,
    at: at.toISOString(),
    point,
    accuracyMeters,
    source,
    distanceMeters: Math.round(distance),
    insideFence,
  };
  pingsState = [...pingsState, ping];

  const before = siteState(jobId, workerId);
  let type: GeofenceEventType | null = null;
  if (action === 'check_in') {
    type = before === 'on_site' ? null : insideFence ? 'check_in' : 'check_in_rejected';
  } else if (action === 'check_out') {
    type = before === 'on_site' || before === 'off_site' ? 'check_out' : null;
  } else if (before === 'on_site' && !insideFence) {
    type = 'exited';
  } else if (before === 'off_site' && insideFence) {
    type = 'entered';
  }

  let event: GeofenceEvent | null = null;
  if (type) {
    event = { eventId: uid('GEO'), jobId, workerId, type, at: ping.at, distanceMeters: ping.distanceMeters, source };
    eventsState = [...eventsState, event];
  }
  if (type === 'check_in' && job.status !== 'in_progress') setJobStatus(jobId, 'in_progress');

  notify();
  return { ping, event, message: describe(type, before, insideFence, ping.distanceMeters, job.site.radiusMeters) };
}

function describe(type: GeofenceEventType | null, before: SiteState, inside: boolean, d: number, r: number): string {
  switch (type) {
    case 'check_in': return `Checked in, ${d} m from the site pin.`;
    case 'check_in_rejected': return `Check-in refused: ${d} m from the site, the fence is ${r} m. Move closer and try again.`;
    case 'exited': return `Left the site boundary (${d} m out).`;
    case 'entered': return 'Back inside the site boundary.';
    case 'check_out': return 'Checked out.';
    default:
      if (before === 'on_site') return inside ? 'Location updated, still on site.' : 'Location updated.';
      if (before === 'not_checked_in') return inside ? 'Inside the boundary. Check in to start the shift.' : `Location updated, ${d} m from site.`;
      return 'Location updated.';
  }
}

function shiftTime(job: JobPosting, hhmm: string, day: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

function isWorkDay(job: JobPosting, day: Date): boolean {
  const iso = localDate(day);
  return iso >= job.startDate && iso <= job.endDate;
}

export function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const GRACE_MIN = 15;
const STALE_MIN = 30;

export function siteAlerts(jobId: string, now: Date = new Date()): SiteAlert[] {
  const job = getJob(jobId);
  if (!job || !isWorkDay(job, now)) return [];
  const start = shiftTime(job, job.shiftStart, now);
  const end = shiftTime(job, job.shiftEnd, now);
  const todayIso = localDate(now);
  const alerts: SiteAlert[] = [];

  for (const c of getHired(jobId)) {
    const name = getWorkerById(c.workerId)?.fullName ?? c.workerId;
    const today = getEvents(jobId, c.workerId).filter(e => e.at.startsWith(todayIso) || localDate(new Date(e.at)) === todayIso);
    const last = today[today.length - 1];
    const state = siteState(jobId, c.workerId);

    if (!today.some(e => e.type === 'check_in') && now.getTime() > start.getTime() + GRACE_MIN * 60_000 && now < end) {
      alerts.push({
        kind: last?.type === 'check_in_rejected' ? 'rejected_check_in' : 'not_arrived',
        workerId: c.workerId,
        message: last?.type === 'check_in_rejected'
          ? `${name} tried to check in ${last.distanceMeters} m from site and was refused.`
          : `${name} hasn't checked in. Shift started at ${job.shiftStart}.`,
        at: last?.at ?? start.toISOString(),
      });
    }
    if (state === 'off_site' && last?.type === 'exited' && now < end) {
      alerts.push({ kind: 'left_site', workerId: c.workerId, message: `${name} left the site boundary during the shift.`, at: last.at });
    }
    if (state === 'on_site') {
      const pings = getPings(jobId, c.workerId);
      const lastPing = pings[pings.length - 1];
      if (lastPing && now.getTime() - new Date(lastPing.at).getTime() > STALE_MIN * 60_000) {
        alerts.push({ kind: 'stale_location', workerId: c.workerId, message: `No location from ${name} for over ${STALE_MIN} minutes.`, at: lastPing.at });
      }
    }
  }
  return alerts;
}

// ------------------------------------------------------------------ demo data

function seed() {
  const now = new Date();
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return localDate(d);
  };
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, '0')}`;
  const shiftStart = minsAgo(200);
  const shiftEnd = new Date(Math.max(now.getTime() + 4 * 3600_000, shiftStart.getTime() + 9 * 3600_000));

  const vidyanagarSite: GeoPoint = { lat: 15.3662, lng: 75.1228 };
  jobsState = [
    {
      jobId: 'J-1001',
      title: 'Rewiring, 12-flat apartment block',
      employerName: 'Sai Residency Owners Association',
      occupation: 'Electrician',
      requiredTags: ['Wiring', 'Maintenance'],
      site: { name: 'Sai Residency', address: 'Vidyanagar, Hubballi', location: vidyanagarSite, radiusMeters: 150 },
      headcount: 3,
      startDate: day(-1),
      endDate: day(5),
      shiftStart: hhmm(shiftStart),
      shiftEnd: hhmm(shiftEnd),
      duration: 'daily',
      rateOffered: 850,
      recruitmentMode: 'balanced',
      newSlotsReserved: 1,
      maxCommuteKm: 8,
      createdAt: minsAgo(60 * 30).toISOString(),
      status: 'in_progress',
    },
    {
      jobId: 'J-1002',
      title: 'Bathroom plumbing, clinic renovation',
      employerName: 'Saptapur Family Clinic',
      occupation: 'Plumber',
      requiredTags: ['Pipe Fitting', 'Leakage Repair'],
      site: { name: 'Saptapur Family Clinic', address: 'Saptapur, Dharwad', location: { lat: 15.4712, lng: 75.0178 }, radiusMeters: 100 },
      headcount: 2,
      startDate: day(3),
      endDate: day(6),
      shiftStart: '09:00',
      shiftEnd: '18:00',
      duration: 'daily',
      rateOffered: 750,
      recruitmentMode: 'new_first',
      newSlotsReserved: 2,
      maxCommuteKm: 25,
      createdAt: minsAgo(90).toISOString(),
      status: 'open',
    },
  ];

  const ts = (m: number) => minsAgo(m).toISOString();
  candidatesState = {
    'J-1001': [
      { jobId: 'J-1001', workerId: 'KK00124', skillId: 'KK00124_electrician', stage: 'hired', updatedAt: ts(60 * 26) },
      { jobId: 'J-1001', workerId: 'KK00130', skillId: 'KK00130_electrician', stage: 'hired', updatedAt: ts(60 * 25) },
      { jobId: 'J-1001', workerId: 'KK00125', skillId: 'KK00125_electrician', stage: 'invited', updatedAt: ts(60 * 4) },
    ],
    'J-1002': [],
  };

  // Today's movements on the Vidyanagar site, replayed through the real geofence rules.
  pingsState = [];
  eventsState = [];
  const at = (e: number, n: number) => offsetPoint(vidyanagarSite, e, n);
  const steps: [string, GeoPoint, LocationAction, LocationSource, number | null, number][] = [
    ['KK00124', at(-620, -380), 'ping', 'device_gps', 25, 196],
    ['KK00124', at(-240, -120), 'ping', 'device_gps', 20, 190],
    ['KK00124', at(-35, 20), 'check_in', 'device_gps', 12, 186],
    ['KK00124', at(30, -40), 'ping', 'device_gps', 15, 120],
    ['KK00124', at(-20, 55), 'ping', 'device_gps', 10, 40],
    ['KK00124', at(10, 15), 'ping', 'device_gps', 10, 8],
    ['KK00130', at(380, 170), 'check_in', 'agent_device', 30, 178],
    ['KK00130', at(90, 60), 'check_in', 'agent_device', 15, 163],
    ['KK00130', at(-60, -30), 'ping', 'agent_device', 15, 110],
    ['KK00130', at(-310, -260), 'ping', 'agent_device', 20, 72],
    ['KK00130', at(-120, -90), 'ping', 'agent_device', 15, 45],
    ['KK00130', at(-40, -25), 'ping', 'agent_device', 12, 12],
  ];
  for (const [wid, p, action, source, acc, ago] of steps) {
    reportLocation('J-1001', wid, p, action, source, acc, minsAgo(ago));
  }
  setJobStatus('J-1001', 'in_progress');
}

seed();

export function resetJobsToDemo(): void {
  seed();
  notify();
}
