import React, { useEffect, useMemo, useState } from 'react';
import {
  Navigation, MapPin, AlertTriangle, Clock, CheckCircle2, XCircle, Users, ArrowRightLeft, Camera,
} from 'lucide-react';
import { GeoPoint, GeofenceEventType, LocationSource } from '../types/job';
import {
  getEvents, getHired, getJobs, getPings, LocationAction, reportLocation, siteAlerts, siteState, SiteState,
  subscribeToJobUpdates, timeOnSiteMs,
} from '../services/jobService';
import { getWorkerById } from '../services/workerService';
import { GeofenceMap, MapWorker } from '../components/GeofenceMap';
import { JobCompletionModal } from '../components/JobCompletionModal';
import { distanceMeters, formatDistance } from '../utils/geo';
import { workerAvatarUrl } from '../utils/workerAvatar';

interface JobTrackingProps {
  focusJobId: string | null;
  onRecruit: (jobId: string) => void;
}

const STATE_LABEL: Record<SiteState, string> = {
  not_checked_in: 'Not checked in',
  on_site: 'On site',
  off_site: 'Left the site',
  checked_out: 'Checked out',
};
const STATE_STYLE: Record<SiteState, string> = {
  not_checked_in: 'bg-slate-100 text-slate-600 border-slate-200',
  on_site: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  off_site: 'bg-rose-50 text-rose-800 border-rose-200',
  checked_out: 'bg-sky-50 text-sky-800 border-sky-200',
};
const EVENT_LABEL: Record<GeofenceEventType, string> = {
  check_in: 'Checked in',
  check_in_rejected: 'Check-in refused',
  exited: 'Left the boundary',
  entered: 'Came back inside',
  check_out: 'Checked out',
};
const SOURCE_LABEL: Record<LocationSource, string> = {
  device_gps: "Worker's phone GPS",
  agent_device: "Field agent's phone",
  simulated: 'Simulated',
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const hm = (ms: number) => {
  const m = Math.round(ms / 60_000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
};
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export const JobTracking: React.FC<JobTrackingProps> = ({ focusJobId, onRecruit }) => {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeToJobUpdates(() => setRevision(r => r + 1)), []);
  // Keep time-on-site and alerts current.
  useEffect(() => {
    const t = setInterval(() => setRevision(r => r + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const jobs = useMemo(() => getJobs(), [revision]);
  const [jobId, setJobId] = useState<string | null>(focusJobId ?? jobs.find(j => getHired(j.jobId).length)?.jobId ?? jobs[0]?.jobId ?? null);
  useEffect(() => { if (focusJobId) setJobId(focusJobId); }, [focusJobId]);
  const job = jobs.find(j => j.jobId === jobId) ?? null;

  const hired = useMemo(() => (job ? getHired(job.jobId) : []), [job, revision]);
  const [workerId, setWorkerId] = useState<string | null>(null);
  useEffect(() => {
    if (!hired.some(h => h.workerId === workerId)) setWorkerId(hired[0]?.workerId ?? null);
  }, [hired, workerId]);

  const [message, setMessage] = useState<{ text: string; tone: 'good' | 'bad' | 'info' } | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<{ workerId: string; skillId: string } | null>(null);

  const now = new Date();
  const alerts = useMemo(() => (job ? siteAlerts(job.jobId, now) : []), [job, revision]);
  const events = useMemo(() => (job ? getEvents(job.jobId).slice().reverse() : []), [job, revision]);

  const mapWorkers: MapWorker[] = useMemo(
    () => hired.map(h => {
      const name = getWorkerById(h.workerId)?.fullName ?? h.workerId;
      return { workerId: h.workerId, name, initials: initials(name), pings: job ? getPings(job.jobId, h.workerId) : [], selected: h.workerId === workerId };
    }),
    [hired, job, workerId, revision],
  );

  const recordAutomaticLocation = (point: GeoPoint, accuracy: number | null) => {
    if (!job || !workerId || siteState(job.jobId, workerId) === 'checked_out') return;
    try {
      const state = siteState(job.jobId, workerId);
      const inside = distanceMeters(point, job.site.location) <= job.site.radiusMeters + Math.min(accuracy ?? 0, 50);
      const action: LocationAction = state === 'not_checked_in' && inside ? 'check_in' : 'ping';
      const r = reportLocation(job.jobId, workerId, point, action, 'device_gps', accuracy);
      const tone = r.event?.type === 'check_in_rejected' || r.event?.type === 'exited' ? 'bad'
        : r.event?.type === 'check_in' || r.event?.type === 'entered' || r.event?.type === 'check_out' ? 'good' : 'info';
      setMessage({ text: `${getWorkerById(workerId)?.fullName ?? workerId}: ${r.message}`, tone });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Location could not be recorded.', tone: 'bad' });
    }
  };

  useEffect(() => {
    if (!job || !workerId || !('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      position => recordAutomaticLocation(
        { lat: position.coords.latitude, lng: position.coords.longitude },
        Math.round(position.coords.accuracy),
      ),
      error => setMessage({
        text: error.code === error.PERMISSION_DENIED
          ? 'Automatic attendance needs location permission for this device.'
          : 'Automatic attendance could not get a GPS fix yet.',
        tone: 'bad',
      }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [job, workerId]);

  const onSiteCount = hired.filter(h => job && siteState(job.jobId, h.workerId) === 'on_site').length;
  const selectedName = workerId ? getWorkerById(workerId)?.fullName ?? workerId : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Job site tracking</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Geofenced attendance</h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
            Each job site has a boundary. Check-ins only count from inside it, and leaving during a shift is flagged.
            Locations come from the worker&apos;s phone or, for workers without a smartphone, the field agent&apos;s phone on site.
          </p>
          <div className="flex flex-wrap gap-2 mt-5" role="tablist" aria-label="Job sites">
            {jobs.map(j => (
              <button
                key={j.jobId}
                role="tab"
                aria-selected={j.jobId === job?.jobId}
                onClick={() => { setJobId(j.jobId); setMessage(null); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${j.jobId === job?.jobId ? 'bg-white text-slate-900 border-white' : 'text-slate-300 border-slate-700 hover:border-slate-500'}`}
              >
                <span className="font-mono mr-1.5 opacity-70">{j.jobId}</span>{j.site.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!job ? (
        <EmptyState text="No jobs yet. Post a job in Recruitment first." />
      ) : !hired.length ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
            <Users className="w-6 h-6 mx-auto text-slate-400" />
            <p className="text-sm font-bold mt-2">Nobody hired for {job.title} yet</p>
            <p className="text-xs text-slate-500 mt-1">Tracking starts once workers are hired. The {job.site.radiusMeters} m geofence around {job.site.name} is ready.</p>
            <button onClick={() => onRecruit(job.jobId)} className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg">Go to the shortlist</button>
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6">
          <section className="space-y-4 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-600" />{job.site.name}</h2>
                  <p className="text-[11px] text-slate-500">{job.site.address} · shift {job.shiftStart} to {job.shiftEnd} · {job.site.location.lat.toFixed(4)}, {job.site.location.lng.toFixed(4)}</p>
                </div>
                <span className="text-xs font-semibold text-slate-700">{onSiteCount} of {hired.length} on site</span>
              </div>
              <GeofenceMap
                job={job}
                workers={mapWorkers}
              />
            </div>

            {/* Report location */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Report a location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-slate-700" htmlFor="jt-worker">
                  Worker
                  <select id="jt-worker" value={workerId ?? ''} onChange={e => setWorkerId(e.target.value)} className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white">
                    {hired.map(h => <option key={h.workerId} value={h.workerId}>{getWorkerById(h.workerId)?.fullName ?? h.workerId}</option>)}
                  </select>
                </label>
                <fieldset className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Check-in, exit, re-entry and location updates are recorded automatically from GPS.</p>
                </fieldset>
              </div>
              <p className="text-[11px] text-slate-500">The employer&apos;s selected area determines the geofence automatically. This screen only visualizes attendance; it does not let users move the boundary or simulate a position.</p>
              {message && (
                <p role="status" className={`text-xs font-medium rounded-lg px-3 py-2 border ${
                  message.tone === 'good' ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : message.tone === 'bad' ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-slate-700 bg-slate-50 border-slate-200'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </section>

          <aside className="space-y-4 min-w-0">
            {/* Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" />Alerts</h3>
              {alerts.length ? (
                <ul className="mt-3 space-y-2">
                  {alerts.map((a, i) => (
                    <li key={i} className={`text-xs rounded-lg px-3 py-2 border ${a.kind === 'stale_location' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                      <span className="font-semibold">{time(a.at)}</span> {a.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 mt-2">Nothing needs attention right now.</p>
              )}
            </div>

            {/* Roster */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900">Hired workers</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {hired.map(h => {
                  const w = getWorkerById(h.workerId);
                  const state = siteState(job.jobId, h.workerId);
                  const pings = getPings(job.jobId, h.workerId);
                  const last = pings[pings.length - 1];
                  return (
                    <li key={h.workerId}>
                      <div className={`py-3 px-2 -mx-2 rounded-lg flex items-start gap-3 ${workerId === h.workerId ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                        <button onClick={() => setWorkerId(h.workerId)} aria-pressed={workerId === h.workerId} className="flex items-start gap-3 text-left min-w-0 flex-1">
                          <img src={workerAvatarUrl(h.workerId)} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900">{w?.fullName ?? h.workerId}</span>
                              <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded ${STATE_STYLE[state]}`}>{STATE_LABEL[state]}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-500 mt-1">
                              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{hm(timeOnSiteMs(job.jobId, h.workerId, now))} on site</span>
                              {last && <span>{formatDistance(last.distanceMeters)} from pin at {time(last.at)}</span>}
                              {last && <span>{SOURCE_LABEL[last.source]}</span>}
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setFeedbackTarget({ workerId: h.workerId, skillId: h.skillId })}
                          className="shrink-0 self-center flex items-center gap-1 text-[11px] font-semibold text-orange-700 hover:text-orange-900 border border-orange-200 hover:border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-lg px-2 py-1.5 transition-colors"
                        >
                          <Camera className="w-3 h-3" />
                          <span className="hidden sm:inline">Give feedback</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {hired.length < job.headcount && (
                <button onClick={() => onRecruit(job.jobId)} className="mt-2 text-xs font-semibold text-orange-700 hover:text-orange-900 inline-flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5" />{job.headcount - hired.length} position{job.headcount - hired.length === 1 ? '' : 's'} still open. Go to the shortlist
                </button>
              )}
            </div>

            {/* Event log */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Navigation className="w-4 h-4 text-slate-500" />Boundary events</h3>
              {events.length ? (
                <ol className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                  {events.map(e => {
                    const good = e.type === 'check_in' || e.type === 'entered' || e.type === 'check_out';
                    return (
                      <li key={e.eventId} className="flex items-start gap-2 text-xs">
                        {good ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />}
                        <span className="font-mono text-[11px] text-slate-500 w-11 shrink-0">{time(e.at)}</span>
                        <span className="min-w-0">
                          <b className="text-slate-900">{getWorkerById(e.workerId)?.fullName ?? e.workerId}</b> {EVENT_LABEL[e.type].toLowerCase()}
                          <span className="text-slate-500">, {formatDistance(e.distanceMeters)} from pin · {SOURCE_LABEL[e.source]}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-xs text-slate-500 mt-2">No check-ins yet. Report a location to start.</p>
              )}
            </div>
          </aside>
        </main>
      )}

      {feedbackTarget && job && (
        <JobCompletionModal
          initialWorkerId={feedbackTarget.workerId}
          initialSkillId={feedbackTarget.skillId}
          lockWorkerSkill
          jobId={job.jobId}
          employerName={job.employerName}
          onClose={() => setFeedbackTarget(null)}
        />
      )}
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-600">{text}</div>
  </main>
);
