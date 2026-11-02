import React, { useState } from 'react';
import { WorkerProfile, WorkerSkill, DurationType, FeedbackMediaType } from '../types/worker';
import {
  updateSkillStatistics,
  getAllWorkers,
  getWorkerSkills,
} from '../services/workerService';
import { X, CheckCircle, Sparkles, ArrowRight, ShieldCheck, Camera, Video, Upload, AlertCircle } from 'lucide-react';

interface JobCompletionModalProps {
  initialWorkerId?: string;
  initialSkillId?: string;
  /** When set, the worker/skill is fixed to the hire being completed (real job-tracking flow, not the demo picker). */
  lockWorkerSkill?: boolean;
  jobId?: string;
  employerName?: string;
  onClose: () => void;
  onCompleted?: (workerId: string, skillId: string) => void;
}

export const JobCompletionModal: React.FC<JobCompletionModalProps> = ({
  initialWorkerId = 'KK00124',
  initialSkillId = 'KK00124_plumber',
  lockWorkerSkill = false,
  jobId,
  employerName,
  onClose,
  onCompleted,
}) => {
  const allWorkers = getAllWorkers();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(initialWorkerId);
  const workerSkills = getWorkerSkills(selectedWorkerId);

  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    initialSkillId && workerSkills.some(s => s.skillId === initialSkillId)
      ? initialSkillId
      : workerSkills[0]?.skillId || ''
  );

  const [customerName, setCustomerName] = useState(employerName || 'Deepa Deshpande');
  const [rating, setRating] = useState<number>(5.0);
  const [duration, setDuration] = useState('1 Day');
  const [durationUnit, setDurationUnit] = useState<DurationType>('daily');
  const [feedback, setFeedback] = useState(
    lockWorkerSkill ? '' : 'Fixed bathroom concealed valve pressure fault efficiently. Prompt and professional.'
  );

  const [mediaType, setMediaType] = useState<FeedbackMediaType>('photo');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [mediaError, setMediaError] = useState<string>('');

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isPhoto = file.type.startsWith('image/');
    if (!isVideo && !isPhoto) {
      setMediaError('Please choose an image or video file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setMediaType(isVideo ? 'video' : 'photo');
      setMediaFileName(file.name);
      setMediaError('');
    };
    reader.readAsDataURL(file);
  };

  // Snapshot before update
  const [completionResult, setCompletionResult] = useState<{
    workerName: string;
    updatedSkillName: string;
    beforeSkills: WorkerSkill[];
    afterSkills: WorkerSkill[];
  } | null>(null);

  const handleWorkerChange = (newWorkerId: string) => {
    setSelectedWorkerId(newWorkerId);
    const newSkills = getWorkerSkills(newWorkerId);
    if (newSkills.length > 0) {
      setSelectedSkillId(newSkills[0].skillId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      setMediaError('Photo or video feedback is required before you can complete this job.');
      return;
    }
    const currentWorker = allWorkers.find(w => w.workerId === selectedWorkerId);
    if (!currentWorker) return;

    const beforeSkills = JSON.parse(JSON.stringify(getWorkerSkills(selectedWorkerId)));
    const targetSkill = beforeSkills.find((s: WorkerSkill) => s.skillId === selectedSkillId);
    if (!targetSkill) return;

    const result = updateSkillStatistics(selectedWorkerId, selectedSkillId, {
      jobId: jobId || `JOB_SIM_${Date.now().toString().slice(-4)}`,
      workerId: selectedWorkerId,
      skillId: selectedSkillId,
      customerId: 'CUST_DEMO_01',
      customerName,
      agreedStartDate: new Date().toISOString(),
      agreedEndDate: new Date().toISOString(),
      jobDuration: duration,
      jobDurationUnit: durationUnit,
      customerRating: rating,
      feedback,
      isDisputed: false,
      mediaType,
      mediaUrl,
    });

    const afterSkills = getWorkerSkills(selectedWorkerId);

    setCompletionResult({
      workerName: currentWorker.fullName,
      updatedSkillName: targetSkill.occupation,
      beforeSkills,
      afterSkills,
    });

    if (onCompleted) {
      onCompleted(selectedWorkerId, selectedSkillId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <h3 className="text-base font-bold text-white">
                {lockWorkerSkill ? 'Complete Job & Leave Feedback' : 'Demonstrate Skill Isolation & Job Completion'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {lockWorkerSkill
                ? 'A photo or video of the finished work is required before the job can be marked complete.'
                : 'Verify that updating one skill NEVER modifies statistics of another skill'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!completionResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Worker & Skill Selection */}
              {lockWorkerSkill ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Completing job for</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {allWorkers.find(w => w.workerId === selectedWorkerId)?.fullName ?? selectedWorkerId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Trade</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {workerSkills.find(s => s.skillId === selectedSkillId)?.occupation ?? selectedSkillId}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Worker Profile
                    </label>
                    <select
                      value={selectedWorkerId}
                      onChange={e => handleWorkerChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                    >
                      {allWorkers.map(w => (
                        <option key={w.workerId} value={w.workerId}>
                          {w.fullName} ({w.workerId}) - {w.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Completed Trade/Skill
                    </label>
                    <select
                      value={selectedSkillId}
                      onChange={e => setSelectedSkillId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                    >
                      {workerSkills.map(s => (
                        <option key={s.skillId} value={s.skillId}>
                          {s.occupation} (Currently: {s.completedJobs} jobs · {s.averageRating > 0 ? `${s.averageRating}★` : 'New'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Current Skills Preview Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                <div className="font-semibold text-slate-900 mb-1">
                  Active Baseline Statistics for this Worker:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  {workerSkills.map(skill => (
                    <div
                      key={skill.skillId}
                      className={`p-2 rounded border bg-white ${
                        skill.skillId === selectedSkillId
                          ? 'border-orange-500 bg-orange-50/40 font-semibold'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center text-slate-900">
                        <span>{skill.occupation}</span>
                        {skill.skillId === selectedSkillId && (
                          <span className="text-[10px] bg-orange-600 text-white px-1.5 rounded">
                            Target
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {skill.completedJobs} jobs · {skill.averageRating > 0 ? `${skill.averageRating}★` : 'Unrated'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Feedback Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Rating (1-5★)
                  </label>
                  <select
                    value={rating}
                    onChange={e => setRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                  >
                    <option value={5.0}>5.0 ★★★★★ (Exceptional)</option>
                    <option value={4.8}>4.8 ★★★★½ (Very Good)</option>
                    <option value={4.5}>4.5 ★★★★½ (Good)</option>
                    <option value={4.0}>4.0 ★★★★☆ (Satisfactory)</option>
                    <option value={3.5}>3.5 ★★★☆☆ (Average)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Job Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Review Note
                </label>
                <textarea
                  rows={2}
                  required
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              {/* Photo / Video Feedback — required proof of work for the worker's record */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Photo or Video Feedback <span className="text-rose-600">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Required. Attach a photo or short video of the finished work — it's shown on the worker's profile as verified evidence.
                </p>

                {!mediaUrl ? (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Camera className="w-5 h-5" />
                      <Video className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Choose a photo or video
                    </span>
                    <span className="text-[11px] text-slate-400">JPG, PNG, MP4 or MOV</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      capture="environment"
                      onChange={handleMediaChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                    <div className="rounded-lg overflow-hidden bg-black max-h-56 flex items-center justify-center">
                      {mediaType === 'photo' ? (
                        <img src={mediaUrl} alt="Work evidence preview" className="max-h-56 w-full object-contain" />
                      ) : (
                        <video src={mediaUrl} controls className="max-h-56 w-full" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 truncate">{mediaFileName}</span>
                      <label className="text-xs font-semibold text-orange-700 hover:text-orange-900 cursor-pointer shrink-0">
                        Replace
                        <input
                          type="file"
                          accept="image/*,video/*"
                          capture="environment"
                          onChange={handleMediaChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {mediaError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {mediaError}
                  </p>
                )}
              </div>

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
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{lockWorkerSkill ? 'Complete Job & Submit Feedback' : 'Submit Completion & Verify Stats'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Result Audit View */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">
                    {lockWorkerSkill ? 'Feedback submitted!' : 'Job Completed & Skill Isolation Verified!'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {lockWorkerSkill
                      ? `Your photo/video feedback for ${completionResult.workerName}'s ${completionResult.updatedSkillName} work is now on their profile.`
                      : `Completed 1 ${completionResult.updatedSkillName} job for ${completionResult.workerName}. Observe below that ONLY the targeted skill was updated.`}
                  </p>
                </div>
              </div>

              {/* Side-by-side comparison table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold text-left">
                      <th className="p-3">Skill / Trade</th>
                      <th className="p-3">Before (Jobs · Rating)</th>
                      <th className="p-3"></th>
                      <th className="p-3">After (Jobs · Rating)</th>
                      <th className="p-3">Isolation Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completionResult.beforeSkills.map(beforeSkill => {
                      const afterSkill = completionResult.afterSkills.find(
                        s => s.skillId === beforeSkill.skillId
                      )!;
                      const isTarget = beforeSkill.skillId === selectedSkillId;

                      return (
                        <tr
                          key={beforeSkill.skillId}
                          className={isTarget ? 'bg-orange-50/40 font-medium' : 'bg-white'}
                        >
                          <td className="p-3 font-bold text-slate-900">
                            {beforeSkill.occupation}
                            {isTarget && (
                              <span className="ml-2 text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded">
                                Updated
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono tabular-nums text-slate-600">
                            {beforeSkill.completedJobs} jobs · {beforeSkill.averageRating > 0 ? `${beforeSkill.averageRating}★` : 'Unrated'}
                          </td>
                          <td className="p-3 text-slate-400">
                            <ArrowRight className="w-3.5 h-3.5 inline" />
                          </td>
                          <td className="p-3 font-mono tabular-nums text-slate-900 font-bold">
                            {afterSkill.completedJobs} jobs · {afterSkill.averageRating > 0 ? `${afterSkill.averageRating}★` : 'Unrated'}
                          </td>
                          <td className="p-3">
                            {isTarget ? (
                              <span className="text-emerald-700 font-semibold">
                                +1 Job, Rating Recalculated
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-[11px]">
                                100% Unchanged ✓
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {!lockWorkerSkill && (
                  <button
                    onClick={() => setCompletionResult(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Run Another Test
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
