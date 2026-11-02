import React, { useState } from 'react';
import { AvailabilityStatus, WorkerProfile, WorkerSkill } from '../types/worker';
import {
  getAllWorkers,
  getWorkerSkills,
  updateWorkerAvailability,
} from '../services/workerService';
import { X, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface AgentAvailabilityModalProps {
  initialWorkerId?: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export const AgentAvailabilityModal: React.FC<AgentAvailabilityModalProps> = ({
  initialWorkerId = 'KK00126', // defaults to Imran Shaikh who is currently Temporarily Unavailable
  onClose,
  onUpdated,
}) => {
  const allWorkers = getAllWorkers();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(initialWorkerId);
  const worker = allWorkers.find(w => w.workerId === selectedWorkerId) || allWorkers[0];
  const workerSkills = getWorkerSkills(selectedWorkerId);

  const [status, setStatus] = useState<AvailabilityStatus>('available');
  const [agentId, setAgentId] = useState('AGT-HB01');
  const [targetScope, setTargetScope] = useState<'global' | string>('global');
  const [reason, setReason] = useState('Completed previous site work; verified available for dispatch.');
  const [expectedAvailableAt, setExpectedAvailableAt] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleWorkerSelect = (id: string) => {
    setSelectedWorkerId(id);
    const target = allWorkers.find(w => w.workerId === id);
    if (target) {
      setReason(target.unavailabilityReason || '');
      setExpectedAvailableAt(target.expectedAvailableAt ? target.expectedAvailableAt.slice(0, 16) : '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkerAvailability(selectedWorkerId, {
      workerId: selectedWorkerId,
      status,
      reason: reason || undefined,
      expectedAvailableAt: status === 'temporarily_unavailable' && expectedAvailableAt ? new Date(expectedAvailableAt).toISOString() : null,
      agentId,
      skillSpecificSkillId: targetScope === 'global' ? undefined : targetScope,
    });

    setSuccessNotice(`Updated availability for ${worker.fullName} (${worker.workerId}).`);
    setTimeout(() => {
      if (onUpdated) onUpdated();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Field Agent Availability Management
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Workers do not log in. Field agents verify and update real-world dispatch availability.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {successNotice ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">Status Updated</h4>
              <p className="text-xs text-emerald-800">{successNotice}</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Select Worker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Worker Profile
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={e => handleWorkerSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                >
                  {allWorkers.map(w => (
                    <option key={w.workerId} value={w.workerId}>
                      {w.fullName} ({w.workerId}) - {w.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope: Global vs Specific Skill */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Scope
                </label>
                <select
                  value={targetScope}
                  onChange={e => setTargetScope(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="global">All Trades / Global Availability</option>
                  {workerSkills.map(s => (
                    <option key={s.skillId} value={s.skillId}>
                      Only {s.occupation} Trade
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Rule: Declining a job in one trade does not force global unavailability across all trades.
                </p>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Availability Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as AvailabilityStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="available">Available (Agent Confirmed)</option>
                  <option value="temporarily_unavailable">Temporarily Unavailable (Busy on Project)</option>
                  <option value="availability_pending">Availability Pending (Requires Field Check)</option>
                  <option value="contact_unsuccessful">Contact Unsuccessful (No Answer)</option>
                  <option value="not_interested">Not Interested (Declined Current Offer)</option>
                  <option value="profile_inactive">Profile Inactive (Administrative Hold)</option>
                </select>
              </div>

              {/* If Temporarily Unavailable: Expected Return Time */}
              {status === 'temporarily_unavailable' && (
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-3 space-y-2">
                  <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider">
                    Expected Next Available Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={expectedAvailableAt}
                    onChange={e => setExpectedAvailableAt(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                  />
                  <p className="text-[11px] text-amber-800">
                    Important: When this timestamp passes, the system flags the profile as <strong>"Confirmation Needed"</strong> rather than automatically assuming availability.
                  </p>
                </div>
              )}

              {/* Agent ID & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Agent Badge ID
                  </label>
                  <input
                    type="text"
                    required
                    value={agentId}
                    onChange={e => setAgentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmation Notes / Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Spoke on phone, ready for assignment"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  Save Agent Confirmation
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
