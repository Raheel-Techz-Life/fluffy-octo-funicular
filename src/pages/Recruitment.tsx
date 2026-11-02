import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase, Plus, MapPin, Clock, Users, Sparkles, ShieldCheck, Navigation, AlertTriangle, ChevronDown, IndianRupee,
} from 'lucide-react';
import { JobPosting, RecruitmentMode } from '../types/job';
import {
  buildShortlist, getJobs, hiringMix, releaseCandidate, setCandidateStage, ShortlistEntry, subscribeToJobUpdates,
} from '../services/jobService';
import { updateWorkerAvailability } from '../services/workerService';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { PostJobModal } from '../components/PostJobModal';
import { COHORT_LABEL, COHORT_STYLE } from '../utils/registrationCohort';
import { workerAvatarUrl } from '../utils/workerAvatar';

interface RecruitmentProps {
  focusJobId: string | null;
  onTrackJob: (jobId: string) => void;
}

const MODE_LABEL: Record<RecruitmentMode, string> = {
  balanced: 'Balanced',
  experienced_only: 'Experienced only',
  new_first: 'New registrations first',
};

const STATUS_STYLE: Record<JobPosting['status'], string> = {
  open: 'bg-orange-50 text-orange-800 border-orange-200',
  staffed: 'bg-sky-50 text-sky-800 border-sky-200',
  in_progress: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
};
const STATUS_LABEL: Record<JobPosting['status'], string> = {
  open: 'Hiring', staffed: 'Fully staffed', in_progress: 'Work in progress', completed: 'Completed',
};

const PER = { hourly: 'per hour', daily: 'per day', weekly: 'per week', monthly: 'per month', project: 'per project' } as const;

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const Recruitment: React.FC<RecruitmentProps> = ({ focusJobId, onTrackJob }) => {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeToJobUpdates(() => setRevision(r => r + 1)), []);

  const jobs = useMemo(() => getJobs(), [revision]);
  const [selectedId, setSelectedId] = useState<string | null>(focusJobId ?? jobs[0]?.jobId ?? null);
  useEffect(() => { if (focusJobId) setSelectedId(focusJobId); }, [focusJobId]);

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);

  const job = jobs.find(j => j.jobId === selectedId) ?? jobs[0] ?? null;
  const shortlist = useMemo(() => (job ? buildShortlist(job) : null), [job, revision]);
  const mix = useMemo(() => hiringMix(), [revision]);

  const act = (fn: () => void) => {
    setError(null);
    try { fn(); } catch (e) { setError(e instanceof Error ? e.message : 'That action failed.'); }
  };

  const openPositions = jobs.filter(j => j.status === 'open').reduce((n, j) => n + j.headcount - buildShortlist(j).hiredCount, 0);
  const totalHires = mix.newHires + mix.establishedHires;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Recruitment</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Hire from new and established registrations</h1>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Each job builds a shortlist in two lanes: workers registered more than 30 days ago, and new registrations who haven&apos;t
                had a fair chance yet. The job&apos;s hiring mix decides how many places each lane gets.
              </p>
            </div>
            <button onClick={() => setPosting(true)} className="px-4 py-2.5 text-sm font-semibold text-slate-900 bg-orange-400 hover:bg-orange-300 rounded-lg inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />Post a job
            </button>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
            <div><dt className="text-slate-400">Jobs</dt><dd className="text-lg font-bold">{jobs.length}</dd></div>
            <div><dt className="text-slate-400">Open positions</dt><dd className="text-lg font-bold">{openPositions}</dd></div>
            <div><dt className="text-slate-400">Hired from new registrations</dt><dd className="text-lg font-bold text-amber-300">{mix.newHires} <span className="text-xs font-medium text-slate-400">of {totalHires}</span></dd></div>
            <div><dt className="text-slate-400">Hired from established</dt><dd className="text-lg font-bold">{mix.establishedHires} <span className="text-xs font-medium text-slate-400">of {totalHires}</span></dd></div>
          </dl>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
        {/* Job list */}
        <aside className="space-y-2" aria-label="Jobs">
          {jobs.map(j => {
            const s = buildShortlist(j);
            return (
              <button
                key={j.jobId}
                onClick={() => { setSelectedId(j.jobId); setError(null); }}
                aria-current={j.jobId === job?.jobId ? 'true' : undefined}
                className={`w-full text-left bg-white rounded-xl border p-4 transition-colors ${j.jobId === job?.jobId ? 'border-slate-900 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{j.jobId}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[j.status]}`}>{STATUS_LABEL[j.status]}</span>
                </div>
                <p className="font-bold text-sm text-slate-900 mt-2 leading-snug">{j.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{j.occupation} · {j.site.address}</p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-label={`${s.hiredCount} of ${j.headcount} hired`}>
                  <div className="h-full bg-emerald-500" style={{ width: `${(s.hiredCount / j.headcount) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{s.hiredCount} of {j.headcount} hired</p>
              </button>
            );
          })}
          {!jobs.length && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
              No jobs yet. Post one to build a shortlist.
            </div>
          )}
        </aside>

        {/* Job detail */}
        {job && shortlist ? (
          <section className="space-y-5 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">{job.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{job.employerName}</p>
                </div>
                <button onClick={() => onTrackJob(job.jobId)} className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-orange-400" />Track site attendance
                </button>
              </div>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
                <div><dt className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />Site</dt><dd className="font-semibold text-slate-900 mt-0.5">{job.site.name}, {job.site.address}</dd><dd className="text-slate-500">{job.site.radiusMeters} m geofence</dd></div>
                <div><dt className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />Dates and shift</dt><dd className="font-semibold text-slate-900 mt-0.5">{fmtDate(job.startDate)} to {fmtDate(job.endDate)}</dd><dd className="text-slate-500">{job.shiftStart} to {job.shiftEnd}</dd></div>
                <div><dt className="text-slate-500 flex items-center gap-1"><IndianRupee className="w-3 h-3" />Pay</dt><dd className="font-semibold text-slate-900 mt-0.5">₹{job.rateOffered.toLocaleString('en-IN')} {PER[job.duration]}</dd><dd className="text-slate-500">Within {job.maxCommuteKm} km of site</dd></div>
                <div><dt className="text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" />Hiring mix</dt><dd className="font-semibold text-slate-900 mt-0.5">{MODE_LABEL[job.recruitmentMode]}</dd><dd className="text-slate-500">{shortlist.slots.forEstablished} established, {shortlist.slots.forNew} new</dd></div>
              </dl>
              {job.requiredTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {job.requiredTags.map(t => <span key={t} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{t}</span>)}
                </div>
              )}
            </div>

            <SlotPlan job={job} lanes={shortlist} />

            {error && <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Lane
                title="Established registrations"
                hint="Registered over 30 days ago. Ranked by skill fit, rating, jobs done and distance."
                icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                entries={shortlist.established}
                job={job}
                act={act}
                emptyText={job.recruitmentMode === 'new_first' ? 'Used only to backfill if too few new registrations qualify.' : 'No established workers match this trade and area.'}
              />
              <Lane
                title="New registrations"
                hint="Registered in the last 30 days or with no jobs yet. Ranked on skill fit and distance, never on fake ratings."
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                entries={shortlist.newcomers}
                job={job}
                act={act}
                emptyText={job.recruitmentMode === 'experienced_only' ? 'This job is set to experienced only.' : 'No new registrations match this trade and area yet.'}
                muted={job.recruitmentMode === 'experienced_only'}
              />
            </div>

            {shortlist.excluded.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200">
                <button onClick={() => setShowExcluded(v => !v)} aria-expanded={showExcluded} className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-slate-700">
                  <span>{shortlist.excluded.length} matching worker{shortlist.excluded.length === 1 ? '' : 's'} left out</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExcluded ? 'rotate-180' : ''}`} />
                </button>
                {showExcluded && (
                  <ul className="px-5 pb-4 space-y-1.5">
                    {shortlist.excluded.map(x => (
                      <li key={x.workerId} className="text-xs text-slate-600"><b className="text-slate-900">{x.name}</b> <span className="font-mono text-[11px] text-slate-400">{x.workerId}</span>: {x.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Briefcase className="w-6 h-6 mx-auto text-slate-400" />
            <p className="text-sm font-semibold mt-2">Post a job to start recruiting</p>
          </div>
        )}
      </main>

      {posting && (
        <PostJobModal
          onClose={() => setPosting(false)}
          onCreated={id => { setPosting(false); setSelectedId(id); }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ slot plan */

const SlotPlan: React.FC<{ job: JobPosting; lanes: ReturnType<typeof buildShortlist> }> = ({ job, lanes }) => {
  const hired = [...lanes.established, ...lanes.newcomers].filter(e => e.candidate?.stage === 'hired');
  const hiredNew = hired.filter(e => e.cohort.cohort === 'new').length;
  const hiredOld = hired.length - hiredNew;
  const cells = Array.from({ length: job.headcount }, (_, i) => {
    const isNewSlot = i >= lanes.slots.forEstablished;
    const filled = isNewSlot ? i - lanes.slots.forEstablished < hiredNew : i < hiredOld;
    return { isNewSlot, filled };
  });
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-900">Positions</h3>
        <p className="text-xs text-slate-500">{hired.length} of {job.headcount} filled · new hires {hiredNew}, established {hiredOld}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`h-10 min-w-[88px] flex-1 rounded-lg border-2 flex items-center justify-center text-[11px] font-semibold ${
              c.filled
                ? c.isNewSlot ? 'bg-amber-400 border-amber-400 text-amber-950' : 'bg-slate-900 border-slate-900 text-white'
                : c.isNewSlot ? 'border-dashed border-amber-300 text-amber-700' : 'border-dashed border-slate-300 text-slate-500'
            }`}
          >
            {c.isNewSlot ? 'New' : 'Established'}{c.filled ? ' · hired' : ''}
          </div>
        ))}
      </div>
      {job.recruitmentMode !== 'experienced_only' && (
        <p className="text-[11px] text-slate-500 mt-2">If a lane can&apos;t fill its places, the other lane&apos;s best matches are recommended instead.</p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ candidate lane */

interface LaneProps {
  title: string;
  hint: string;
  icon: React.ReactNode;
  entries: ShortlistEntry[];
  job: JobPosting;
  act: (fn: () => void) => void;
  emptyText: string;
  muted?: boolean;
}

const Lane: React.FC<LaneProps> = ({ title, hint, icon, entries, job, act, emptyText, muted }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-5 min-w-0 ${muted ? 'opacity-70' : ''}`}>
    <div className="flex items-center gap-2">{icon}<h3 className="text-sm font-bold text-slate-900">{title}</h3><span className="text-xs text-slate-400">{entries.length}</span></div>
    <p className="text-[11px] text-slate-500 mt-1 mb-4">{hint}</p>
    {entries.length ? (
      <ul className="space-y-3">
        {entries.map(e => <CandidateRow key={e.result.worker.workerId} entry={e} job={job} act={act} />)}
      </ul>
    ) : (
      <p className="text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg p-4">{emptyText}</p>
    )}
  </div>
);

const STAGE_LABEL = { shortlisted: 'Shortlisted', invited: 'Invited', accepted: 'Accepted', declined: 'Declined', hired: 'Hired' } as const;

const CandidateRow: React.FC<{ entry: ShortlistEntry; job: JobPosting; act: (fn: () => void) => void }> = ({ entry, job, act }) => {
  const { worker, matchingSkill, ranking } = entry.result;
  const stage = entry.candidate?.stage ?? 'shortlisted';
  const set = (s: Parameters<typeof setCandidateStage>[3]) => act(() => setCandidateStage(job.jobId, worker.workerId, matchingSkill.skillId, s));
  const reconfirm = () => act(() => updateWorkerAvailability(worker.workerId, { workerId: worker.workerId, status: 'available', agentId: worker.agentId }));
  const btn = 'px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-colors';

  return (
    <li className={`rounded-lg border p-3 ${stage === 'hired' ? 'border-emerald-300 bg-emerald-50/40' : entry.recommended ? 'border-slate-300' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3">
        <img src={workerAvatarUrl(worker.workerId)} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-sm text-slate-900">{worker.fullName}</span>
            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">{worker.workerId}</span>
            {entry.recommended && stage !== 'hired' && <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 rounded">Recommended</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded ${COHORT_STYLE[entry.cohort.cohort]}`}>{COHORT_LABEL[entry.cohort.cohort]}</span>
            <span className="text-[11px] text-slate-500">{entry.cohort.label}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600 mt-1.5">
            <span>{worker.area}{entry.distanceKm !== null ? `, ${entry.distanceKm.toFixed(1)} km` : ''}</span>
            <span>{matchingSkill.experienceYears} yrs</span>
            <span>{matchingSkill.completedJobs ? `${matchingSkill.completedJobs} jobs, ${matchingSkill.averageRating}★` : 'No jobs yet'}</span>
            {ranking.effectiveRate !== null && (
              <span className={entry.asksAboveOffer ? 'text-rose-700 font-semibold' : ''}>Asks ₹{ranking.effectiveRate}{entry.asksAboveOffer ? ` (offer ₹${job.rateOffered})` : ''}</span>
            )}
            <span className="font-semibold text-slate-900">Fit {entry.fitScore}</span>
          </div>
          <div className="mt-1.5">
            <AvailabilityBadge status={matchingSkill.availabilityStatus} expectedAvailableAt={worker.expectedAvailableAt} unavailabilityReason={worker.unavailabilityReason} />
          </div>
          {entry.bookedOn && stage !== 'hired' && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-rose-700 mt-1.5">
              <AlertTriangle className="w-3 h-3" />Hired on {entry.bookedOn.jobId} until {fmtDate(entry.bookedOn.endDate)}, which overlaps this job.
            </p>
          )}
          {entry.cohort.needsReverification && stage !== 'hired' && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-amber-800 mt-1.5">
              <AlertTriangle className="w-3 h-3" />Availability last confirmed {entry.cohort.daysSinceAvailabilityCheck} days ago. Re-confirm before hiring.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3 pl-12">
        <span className="text-[11px] font-semibold text-slate-500 mr-1">{STAGE_LABEL[stage]}</span>
        {stage === 'shortlisted' && <button onClick={() => set('invited')} className={`${btn} text-white bg-slate-900 hover:bg-slate-800`}>Invite</button>}
        {stage === 'invited' && (
          <>
            <button onClick={() => set('accepted')} className={`${btn} text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200`}>Mark accepted</button>
            <button onClick={() => set('declined')} className={`${btn} text-slate-600 border border-slate-200 hover:bg-slate-50`}>Mark declined</button>
          </>
        )}
        {stage === 'accepted' && entry.bookedOn ? null : stage === 'accepted' && (entry.cohort.needsReverification
          ? <button onClick={reconfirm} className={`${btn} text-amber-900 bg-amber-100 hover:bg-amber-200`}>Re-confirm availability</button>
          : <button onClick={() => set('hired')} className={`${btn} text-white bg-emerald-600 hover:bg-emerald-700`}>Hire</button>)}
        {stage === 'declined' && <button onClick={() => set('invited')} className={`${btn} text-slate-700 border border-slate-200 hover:bg-slate-50`}>Invite again</button>}
        {stage !== 'shortlisted' && (
          <button onClick={() => act(() => releaseCandidate(job.jobId, worker.workerId))} className={`${btn} text-slate-500 hover:text-slate-900`}>
            {stage === 'hired' ? 'Release' : 'Reset'}
          </button>
        )}
      </div>
    </li>
  );
};
