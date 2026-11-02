import React from 'react';
import { WorkerSearchResult } from '../types/worker';
import { X, CheckCircle, HelpCircle, Award, TrendingUp, MapPin, Clock, Star, Tag } from 'lucide-react';

interface RankingExplanationModalProps {
  result: WorkerSearchResult | null;
  onClose: () => void;
}

export const RankingExplanationModal: React.FC<RankingExplanationModalProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  const { worker, matchingSkill, ranking } = result;

  const factors = [
    {
      title: 'Skill & Tag Match',
      weight: '35%',
      score: ranking.tagMatchScore,
      max: 35,
      icon: <Tag className="w-4 h-4 text-orange-600" />,
      color: 'bg-orange-500',
      description: `Matched ${ranking.matchedTags.length} required tags for ${matchingSkill.occupation}`,
    },
    {
      title: 'Skill-Specific Rating',
      weight: '25%',
      score: ranking.ratingScore,
      max: 25,
      icon: <Star className="w-4 h-4 text-amber-500" />,
      color: 'bg-amber-500',
      description: matchingSkill.totalRatings > 0
        ? `Raw ${matchingSkill.averageRating}★ (${matchingSkill.totalRatings} ratings), Bayesian-dampened against sample size`
        : `New unrated worker: Assigned standard baseline discovery score without fake ratings`,
    },
    {
      title: 'Completed Jobs',
      weight: '15%',
      score: ranking.jobsScore,
      max: 15,
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-500',
      description: `${matchingSkill.completedJobs} completed jobs specifically in ${matchingSkill.occupation}`,
    },
    {
      title: 'Trade Experience',
      weight: '10%',
      score: ranking.experienceScore,
      max: 10,
      icon: <Award className="w-4 h-4 text-purple-600" />,
      color: 'bg-purple-500',
      description: `${matchingSkill.experienceYears} years dedicated experience in this specific trade`,
    },
    {
      title: 'Availability Status',
      weight: '10%',
      score: ranking.availabilityScore,
      max: 10,
      icon: <Clock className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-500',
      description: `Agent confirmed status: ${matchingSkill.availabilityStatus.replace('_', ' ')}`,
    },
    {
      title: 'Location Proximity',
      weight: '5%',
      score: ranking.locationScore,
      max: 5,
      icon: <MapPin className="w-4 h-4 text-rose-600" />,
      color: 'bg-rose-500',
      description: `Based in ${worker.location} (${worker.area})`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Ranking Intelligence
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Why this worker was recommended
            </h3>
            <p className="text-xs text-slate-500">
              {worker.fullName} ({worker.workerId}) · {matchingSkill.occupation}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Total Score Summary Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Relevance Score</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                  {ranking.totalScore}
                </span>
                <span className="text-sm text-slate-500 font-mono">/ 100</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Weighted composite for <strong>{matchingSkill.occupation}</strong> search query
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-2.5 py-1 text-xs font-semibold rounded ${
                  ranking.totalScore >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : ranking.totalScore >= 60
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {ranking.totalScore >= 80 ? 'Optimal Match' : ranking.totalScore >= 60 ? 'Strong Match' : 'Potential Match'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Independent of other skills
              </p>
            </div>
          </div>

          {/* Breakdown Items */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Weighted Factor Breakdown
            </h4>

            <div className="space-y-3.5">
              {factors.map((factor, idx) => {
                const percentage = Math.round((factor.score / factor.max) * 100);
                return (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {factor.icon}
                        <span>{factor.title}</span>
                        <span className="text-slate-400 font-mono">({factor.weight})</span>
                      </div>
                      <div className="font-mono text-slate-900 font-semibold tabular-nums">
                        {factor.score} / {factor.max} pts
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${factor.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Algorithmic Observations */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-3.5 text-xs text-amber-900">
            <div className="font-semibold flex items-center gap-1.5 mb-1.5 text-amber-900">
              <CheckCircle className="w-4 h-4 text-amber-700" />
              <span>Skill Isolation &amp; Bayesian Fairness Invariant</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>
                This ranking evaluates <strong>only {worker.fullName}'s {matchingSkill.occupation} record</strong>.
                {result.allSkills.length > 1 && (
                  <span>
                    {' '}Ratings from other registered skills ({result.allSkills.filter(s => s.skillId !== matchingSkill.skillId).map(s => s.occupation).join(', ')}) do not affect this result.
                  </span>
                )}
              </li>
              <li>
                Bayesian adjustment ensures a worker with 40+ proven jobs is not unfairly superseded by a single unverified 5-star rating.
              </li>
              {ranking.isNewWorker && (
                <li>
                  New worker visibility policy grants fair search discovery based on certified training, experience, and agent-checked status.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
