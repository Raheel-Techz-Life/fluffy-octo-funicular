import React, { useMemo, useState } from 'react';
import { X, Briefcase, MapPin, Users } from 'lucide-react';
import { DurationType } from '../types/worker';
import { RecruitmentMode } from '../types/job';
import { createJob, localDate } from '../services/jobService';
import { getAllAvailableOccupations, getTagsForOccupation } from '../services/workerService';
import { AREA_COORDS } from '../utils/geo';

interface PostJobModalProps {
  onClose: () => void;
  onCreated: (jobId: string) => void;
}

const AREA_OPTIONS = Object.entries({
  'Vidyanagar, Hubballi': AREA_COORDS['vidyanagar'],
  'Gokul Road, Hubballi': AREA_COORDS['gokul road'],
  'Keshwapur, Hubballi': AREA_COORDS['keshwapur'],
  'Navanagar, Hubballi': AREA_COORDS['navanagar'],
  'Old Hubballi': AREA_COORDS['old hubballi'],
  'Unkal, Hubballi': AREA_COORDS['unkal'],
  'Line Bazaar, Dharwad': AREA_COORDS['line bazaar'],
  'Saptapur, Dharwad': AREA_COORDS['saptapur'],
  'Kelageri, Dharwad': AREA_COORDS['kelageri'],
});

const MODES: { id: RecruitmentMode; label: string; help: string }[] = [
  { id: 'balanced', label: 'Balanced', help: 'Reserve some positions for new registrations, fill the rest with established workers.' },
  { id: 'experienced_only', label: 'Experienced only', help: 'Only workers registered more than 30 days ago. Use for high-risk or specialist work.' },
  { id: 'new_first', label: 'New registrations first', help: 'Fill from new registrations, backfill with established workers if too few qualify.' },
];

const field = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400';
const label = 'block text-xs font-semibold text-slate-700 mb-1';

export const PostJobModal: React.FC<PostJobModalProps> = ({ onClose, onCreated }) => {
  const today = localDate(new Date());
  const occupations = useMemo(() => getAllAvailableOccupations(), []);

  const [title, setTitle] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [occupation, setOccupation] = useState(occupations.includes('Electrician') ? 'Electrician' : occupations[0] ?? '');
  const [tags, setTags] = useState<string[]>([]);
  const [siteName, setSiteName] = useState('');
  const [areaKey, setAreaKey] = useState(AREA_OPTIONS[0][0]);
  const [headcount, setHeadcount] = useState(3);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [duration, setDuration] = useState<DurationType>('daily');
  const [rate, setRate] = useState(800);
  const [mode, setMode] = useState<RecruitmentMode>('balanced');
  const [newSlots, setNewSlots] = useState(1);
  const [maxCommuteKm, setMaxCommuteKm] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const availableTags = useMemo(() => getTagsForOccupation(occupation), [occupation]);

  const pickArea = (key: string) => {
    setAreaKey(key);
    const found = AREA_OPTIONS.find(([k]) => k === key);
    if (!found) setError('That employer area is not available.');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !employerName.trim()) {
      setError('Add a job title and the employer name.');
      return;
    }
    if (endDate < startDate) {
      setError('The end date is before the start date.');
      return;
    }
    const point = AREA_OPTIONS.find(([key]) => key === areaKey)?.[1] ?? AREA_OPTIONS[0][1];
    const job = createJob({
      title: title.trim(),
      employerName: employerName.trim(),
      occupation,
      requiredTags: tags,
      site: {
        name: siteName.trim() || title.trim(),
        address: areaKey,
        location: point,
        radiusMeters: 150,
      },
      headcount,
      startDate,
      endDate,
      shiftStart,
      shiftEnd,
      duration,
      rateOffered: rate,
      recruitmentMode: mode,
      newSlotsReserved: mode === 'balanced' ? Math.min(newSlots, headcount) : mode === 'new_first' ? headcount : 0,
      maxCommuteKm,
    });
    onCreated(job.jobId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-orange-400" />
              <h3 className="text-base font-bold text-white">Post a job</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">The shortlist and the site geofence are built from these details.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="pj-title" className={label}>Job title</label>
              <input id="pj-title" className={field} value={title} onChange={e => setTitle(e.target.value)} placeholder="Rewiring, ground floor shops" />
            </div>
            <div>
              <label htmlFor="pj-employer" className={label}>Employer</label>
              <input id="pj-employer" className={field} value={employerName} onChange={e => setEmployerName(e.target.value)} placeholder="Shree Traders" />
            </div>
            <div>
              <label htmlFor="pj-occ" className={label}>Trade</label>
              <select id="pj-occ" className={field} value={occupation} onChange={e => { setOccupation(e.target.value); setTags([]); }}>
                {occupations.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            {availableTags.length > 0 && (
              <fieldset className="sm:col-span-2">
                <legend className={label}>Skills needed</legend>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map(t => {
                    const on = tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTags(on ? tags.filter(x => x !== t) : [...tags, t])}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-orange-600" />Site and geofence</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pj-site" className={label}>Site name</label>
                <input id="pj-site" className={field} value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="Shree Complex" />
              </div>
              <div>
                <label htmlFor="pj-area" className={label}>Area</label>
                <select id="pj-area" className={field} value={areaKey} onChange={e => pickArea(e.target.value)}>
                  {AREA_OPTIONS.map(([k]) => <option key={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">A 150 m geofence is created automatically around the selected employer area. Coordinates and radius are system-managed.</p>
          </section>

          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="pj-start" className={label}>Start date</label>
              <input id="pj-start" type="date" className={field} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pj-end" className={label}>End date</label>
              <input id="pj-end" type="date" className={field} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pj-s1" className={label}>Shift starts</label>
              <input id="pj-s1" type="time" className={field} value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pj-s2" className={label}>Shift ends</label>
              <input id="pj-s2" type="time" className={field} value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pj-dur" className={label}>Paid</label>
              <select id="pj-dur" className={field} value={duration} onChange={e => setDuration(e.target.value as DurationType)}>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="project">Per project</option>
              </select>
            </div>
            <div>
              <label htmlFor="pj-rate" className={label}>Rate offered (₹)</label>
              <input id="pj-rate" type="number" min={0} className={field} value={rate} onChange={e => setRate(Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="pj-head" className={label}>Workers needed</label>
              <input id="pj-head" type="number" min={1} max={50} className={field} value={headcount} onChange={e => setHeadcount(Math.max(1, Number(e.target.value)))} />
            </div>
            <div>
              <label htmlFor="pj-commute" className={label}>Max commute (km)</label>
              <input id="pj-commute" type="number" min={1} max={100} className={field} value={maxCommuteKm} onChange={e => setMaxCommuteKm(Math.max(1, Number(e.target.value)))} />
            </div>
          </section>

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2"><Users className="w-3.5 h-3.5 text-orange-600" />New and established registrations</legend>
            {MODES.map(m => (
              <label key={m.id} className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${mode === m.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="pj-mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="mt-0.5 accent-slate-900" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                  <span className="block text-xs text-slate-500">{m.help}</span>
                </span>
              </label>
            ))}
            {mode === 'balanced' && (
              <div className="pl-1 pt-1">
                <label htmlFor="pj-newslots" className={label}>Positions reserved for new registrations: {Math.min(newSlots, headcount)} of {headcount}</label>
                <input id="pj-newslots" type="range" min={0} max={headcount} value={Math.min(newSlots, headcount)} onChange={e => setNewSlots(Number(e.target.value))} className="w-full accent-amber-500" />
              </div>
            )}
          </fieldset>

          {error && <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-white">Cancel</button>
          <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg">Post job and build shortlist</button>
        </div>
      </form>
    </div>
  );
};
