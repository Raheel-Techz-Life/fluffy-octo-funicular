import React, { useState } from 'react';
import { WorkerProfile, WorkerSkill, SkillReview } from '../types/worker';
import { RatingDisplay } from './RatingDisplay';
import { AvailabilityBadge } from './AvailabilityBadge';
import { SkillBadge } from './SkillBadge';
import {
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  Briefcase,
  PhoneCall,
  Lock,
  Clock,
  MessageSquare,
  CheckCircle,
  ExternalLink,
  Camera,
  Video,
} from 'lucide-react';
import { workerAvatarUrl } from '../utils/workerAvatar';

interface WorkerProfileModalProps {
  worker: WorkerProfile | null;
  skills: WorkerSkill[];
  reviews: SkillReview[];
  onClose: () => void;
  onRequestContact: (workerId: string, skillId: string) => void;
  onUpdateAvailability: (workerId: string) => void;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  worker,
  skills,
  reviews,
  onClose,
  onRequestContact,
  onUpdateAvailability,
}) => {
  const [selectedSkillTab, setSelectedSkillTab] = useState<string>(
    skills.length > 0 ? skills[0].skillId : ''
  );

  if (!worker) return null;

  const activeSkill = skills.find(s => s.skillId === selectedSkillTab) || skills[0];
  const skillReviews = reviews.filter(r => r.skillId === activeSkill?.skillId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-start gap-4">
              <img src={workerAvatarUrl(worker.workerId)} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-inner" />

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {worker.fullName}
                  </h2>
                  <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    ID: {worker.workerId}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      worker.registrationStatus === 'new'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {worker.registrationStatus === 'new' ? 'New Worker' : 'Regular Verified'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    {worker.location} ({worker.area})
                  </span>
                  <span>·</span>
                  <span>{worker.experienceYears} Years Overall Experience</span>
                  <span>·</span>
                  <span>Speaks: {worker.preferredLanguages.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Availability & Agent Confirmation Header Action */}
            <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0">
              <AvailabilityBadge
                status={activeSkill?.availabilityStatus || 'available'}
                expectedAvailableAt={worker.expectedAvailableAt}
                unavailabilityReason={worker.unavailabilityReason}
              />
              <button
                onClick={() => onUpdateAvailability(worker.workerId)}
                className="text-[11px] text-orange-400 hover:text-orange-300 underline underline-offset-2 flex items-center gap-1"
              >
                <span>Agent Status Manager</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Privacy Notice Banner */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Contact Protection: Direct phone numbers are managed through field agents.</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Last Agent Check: {new Date(worker.lastAvailabilityConfirmation).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} by {worker.agentId}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Independent Skills Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Independent Skills ({skills.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Each trade has isolated ratings and job counts
              </span>
            </div>

            {/* Skill Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {skills.map(skill => {
                const isSelected = skill.skillId === (activeSkill?.skillId || skills[0].skillId);
                return (
                  <button
                    key={skill.skillId}
                    onClick={() => setSelectedSkillTab(skill.skillId)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">
                        {skill.occupation}
                      </span>
                      {skill.totalRatings > 0 ? (
                        <span className="text-xs font-bold text-amber-700 font-mono">
                          {skill.averageRating}★
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">
                          New
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>{skill.completedJobs} jobs done</span>
                      <span>{skill.experienceYears} yrs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Skill Deep Dive Card */}
          {activeSkill && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold text-slate-900">
                      {activeSkill.occupation} Record
                    </h4>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono break-all">
                      {activeSkill.skillId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeSkill.workDescription}
                  </p>
                </div>

                {/* Rating summary */}
                <div className="shrink-0">
                  <RatingDisplay
                    rating={activeSkill.averageRating}
                    totalRatings={activeSkill.totalRatings}
                    completedJobs={activeSkill.completedJobs}
                    size="lg"
                  />
                </div>
              </div>

              {/* Skill Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Trade Experience
                  </span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {activeSkill.experienceYears} Years
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Verified Jobs
                  </span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {activeSkill.completedJobs} Done
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Customer Ratings
                  </span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {activeSkill.totalRatings} Reviews
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Verification
                  </span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="capitalize">{activeSkill.verificationLevel.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Service Rates Sheet */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-2">
                  Duration-Based Service Pricing:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeSkill.serviceRates.hourly && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500">Hourly Rate</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ₹{activeSkill.serviceRates.hourly} / hr
                      </div>
                    </div>
                  )}
                  {activeSkill.serviceRates.daily && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500">Daily Rate (8 hrs)</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ₹{activeSkill.serviceRates.daily.toLocaleString('en-IN')} / day
                      </div>
                    </div>
                  )}
                  {activeSkill.serviceRates.weekly && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500">Weekly Rate (6 days)</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ₹{activeSkill.serviceRates.weekly.toLocaleString('en-IN')} / wk
                      </div>
                    </div>
                  )}
                  {activeSkill.serviceRates.monthly && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500">Monthly Contract</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ₹{activeSkill.serviceRates.monthly.toLocaleString('en-IN')} / mo
                      </div>
                    </div>
                  )}
                  {activeSkill.serviceRates.project && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500">Project / Lump Sum</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        Custom Quote
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-2">
                  Specialized Skills &amp; Tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSkill.skillTags.map(tag => (
                    <SkillBadge key={tag} label={tag} size="sm" />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Customer Reviews for this specific skill */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Customer Reviews for {activeSkill?.occupation} ({skillReviews.length})</span>
              </h3>
            </div>

            {skillReviews.length > 0 ? (
              <div className="space-y-3">
                {skillReviews.map(review => (
                  <div
                    key={review.reviewId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {review.customerName}
                        </span>
                        {review.customerLocation && (
                          <span className="text-slate-400 text-[11px]">
                            · {review.customerLocation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-600 font-mono">
                        <span>{review.rating}★</span>
                        <span className="text-slate-400 font-normal text-[11px] ml-1">
                          ({review.jobDuration})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 italic">
                      "{review.feedback}"
                    </p>

                    {review.mediaUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-black max-h-48 flex items-center justify-center relative">
                        {review.mediaType === 'video' ? (
                          <video src={review.mediaUrl} controls className="max-h-48 w-full" />
                        ) : (
                          <a href={review.mediaUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={review.mediaUrl}
                              alt={`Work evidence from ${review.customerName}`}
                              className="max-h-48 w-full object-cover"
                            />
                          </a>
                        )}
                        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                          {review.mediaType === 'video' ? <Video className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
                          {review.mediaType} evidence
                        </span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400">
                      Verified Completion: {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  No verified customer reviews yet for this specific trade.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reviews for other trades remain independent.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-500">
            Worker ID: <strong className="font-mono text-slate-800">{worker.workerId}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>

            {activeSkill && (
              <button
                onClick={() => {
                  onRequestContact(worker.workerId, activeSkill.skillId);
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Request Contact for {activeSkill.occupation}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
