import React from 'react';
import { WorkerSearchResult } from '../types/worker';
import { AvailabilityBadge } from './AvailabilityBadge';
import { MapPin, PhoneCall, ChevronRight } from 'lucide-react';
import { workerAvatarUrl } from '../utils/workerAvatar';

interface WorkerCardProps {
  result: WorkerSearchResult;
  onViewProfile: (workerId: string) => void;
  onRequestContact: (workerId: string, skillId: string) => void;
  onExplainRanking: (result: WorkerSearchResult) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ result, onViewProfile, onRequestContact }) => {
  const { worker, matchingSkill } = result;
  return (
    <article
      className="worker-summary-card bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 cursor-pointer"
      onClick={() => onViewProfile(worker.workerId)}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onViewProfile(worker.workerId); }}
      role="button"
      tabIndex={0}
      aria-label={`View ${worker.fullName}'s full profile`}
    >
      <img src={workerAvatarUrl(worker.workerId)} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 truncate">{worker.fullName}</h3>
          <span className="text-[10px] text-slate-400 font-mono">{worker.workerId}</span>
        </div>
        <p className="text-xs font-semibold text-slate-700 mt-0.5">{matchingSkill.occupation}</p>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 shrink-0" />{worker.location} · {worker.area}
        </p>
      </div>
      <div className="hidden sm:block shrink-0"><AvailabilityBadge status={matchingSkill.availabilityStatus} expectedAvailableAt={worker.expectedAvailableAt} unavailabilityReason={worker.unavailabilityReason} /></div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={event => { event.stopPropagation(); onRequestContact(worker.workerId, matchingSkill.skillId); }}
          className="p-2 rounded-lg text-slate-500 hover:bg-lime-100 hover:text-slate-900"
          aria-label={`Request contact for ${worker.fullName}`}
        ><PhoneCall className="w-4 h-4" /></button>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </article>
  );
};
