import React, { useState } from 'react';
import { WorkerProfile, WorkerSkill, DurationType } from '../types/worker';
import { X, PhoneCall, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

interface ContactRequestModalProps {
  worker: WorkerProfile | null;
  skill: WorkerSkill | null;
  onClose: () => void;
}

export const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  worker,
  skill,
  onClose,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [duration, setDuration] = useState<DurationType>('daily');
  const [projectBrief, setProjectBrief] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dispatchTrackingId, setDispatchTrackingId] = useState('');

  if (!worker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingId = `REQ-${Date.now().toString().slice(-6)}`;
    setDispatchTrackingId(trackingId);
    setSubmitted(true);

    // This dispatches the Worker ID to the teammate's contact-management module
    console.log('[KaamKaro Module Handoff] Dispatching contact request to Teammate Module:', {
      trackingId,
      workerId: worker.workerId,
      workerName: worker.fullName,
      assignedAgentId: worker.agentId,
      skillId: skill?.skillId,
      requestedOccupation: skill?.occupation,
      customerName,
      customerPhone,
      duration,
      projectBrief,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-orange-400" />
              <h3 className="text-base font-bold text-white">
                Request Field Agent Contact
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Handoff to Contact Management Module
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Worker Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {worker.fullName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Permanent Worker ID: {worker.workerId}
                  </div>
                </div>
                {skill && (
                  <div className="text-right">
                    <span className="text-xs font-semibold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                      {skill.occupation}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {worker.location}
                    </div>
                  </div>
                )}
              </div>

              {/* Security Privacy Notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Worker Privacy Protected:</strong> Direct phone numbers are protected from public scraping. Our assigned field agent (<strong>{worker.agentId}</strong>) will coordinate the job details and connect you.
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Your Name / Organization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Hegde or Modern Enterprises"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Your Contact Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Duration Required
                    </label>
                    <select
                      value={duration}
                      onChange={e => setDuration(e.target.value as DurationType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="hourly">Hourly (Urgent Repair)</option>
                      <option value="daily">Daily Work (1–3 Days)</option>
                      <option value="weekly">Weekly Work</option>
                      <option value="monthly">Monthly Project</option>
                      <option value="project">Project / Custom Scope</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Work Location &amp; Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Need residential switchboard rewire and AC point wiring at Vidyanagar, Hubballi"
                    value={projectBrief}
                    onChange={e => setProjectBrief(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  Confirm &amp; Dispatch to Agent
                </button>
              </div>
            </form>
          ) : (
            <div className="py-4 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Contact Request Dispatched!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Tracking ID: <strong className="font-mono text-slate-900">{dispatchTrackingId}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Field Agent <strong>{worker.agentId}</strong> has been assigned to confirm availability with {worker.fullName} and facilitate work coordination.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-left text-xs space-y-1 font-mono text-slate-600">
                <div>// Payload exported to Teammate Contact Module:</div>
                <div>Worker ID: {worker.workerId}</div>
                <div>Skill ID: {skill?.skillId}</div>
                <div>Status: Dispatched to Agent queue</div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Return to Directory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
