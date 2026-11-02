import React from 'react';
import { Star, Sparkles } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  totalRatings: number;
  completedJobs?: number;
  size?: 'sm' | 'md' | 'lg';
  showJobsCount?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  totalRatings,
  completedJobs,
  size = 'md',
  showJobsCount = true,
}) => {
  const isUnrated = totalRatings === 0 || rating === 0;

  if (isUnrated) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/70 font-medium whitespace-nowrap">
        <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
        <span>New – Not Yet Rated</span>
      </div>
    );
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <div className="inline-flex items-center gap-1 text-amber-600">
        <Star className={`${iconSizes[size]} fill-amber-400 text-amber-400`} />
        <span className={`${textSizes[size]} text-slate-900 tabular-nums`}>
          {rating.toFixed(1)}
        </span>
      </div>

      {showJobsCount && (
        <span className="text-xs text-slate-500 tabular-nums">
          ({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
          {completedJobs !== undefined && completedJobs !== totalRatings ? ` · ${completedJobs} jobs` : ''})
        </span>
      )}
    </div>
  );
};
