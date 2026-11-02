import React from 'react';
import { SearchCriteria, DurationType, AvailabilityStatus } from '../types/worker';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  IndianRupee,
  Star,
  Award,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface SearchFiltersProps {
  criteria: SearchCriteria;
  availableOccupations: string[];
  availableTags: string[];
  onCriteriaChange: (newCriteria: Partial<SearchCriteria>) => void;
  onResetFilters: () => void;
  onApplyPreset: (preset: 'electrician_demo' | 'plumber_demo' | 'carpenter_demo') => void;
  totalResultsCount: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  criteria,
  availableOccupations,
  availableTags,
  onCriteriaChange,
  onResetFilters,
  onApplyPreset,
  totalResultsCount,
}) => {
  const toggleTag = (tag: string) => {
    const isSelected = criteria.selectedTags.includes(tag);
    if (isSelected) {
      onCriteriaChange({
        selectedTags: criteria.selectedTags.filter(t => t !== tag),
      });
    } else {
      onCriteriaChange({
        selectedTags: [...criteria.selectedTags, tag],
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
      {/* Search Header & Quick Scenario Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">
              Worker Search &amp; Skill Matching
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by Bayesian skill performance, trade experience, and agent-verified availability
          </p>
        </div>

        {/* Quick Demo Scenario Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium hidden lg:inline">
            Quick Demos:
          </span>
          <button
            onClick={() => onApplyPreset('electrician_demo')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-colors"
            title="Demonstrate Section 16: Electrician in Hubballi with Wiring & Maintenance tags"
          >
            <Zap className="w-3 h-3 text-orange-600" />
            <span>Electrician Demo (Hubballi)</span>
          </button>
          <button
            onClick={() => onApplyPreset('plumber_demo')}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>Plumbers Demo</span>
          </button>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Reset all search filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Occupation / Trade
          </label>
          <div className="relative">
            <select
              value={criteria.occupation}
              onChange={e => onCriteriaChange({ occupation: e.target.value, selectedTags: [] })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            >
              <option value="all">All Occupations ({availableOccupations.length})</option>
              {availableOccupations.map(occ => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Location
          </label>
          <div className="relative">
            <select
              value={criteria.location}
              onChange={e => onCriteriaChange({ location: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            >
              <option value="all">All Locations (Twin-Cities)</option>
              <option value="Hubballi">Hubballi</option>
              <option value="Dharwad">Dharwad</option>
            </select>
          </div>
        </div>

        {/* Work Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Hiring Duration
          </label>
          <select
            value={criteria.duration}
            onChange={e => onCriteriaChange({ duration: e.target.value as 'any' | DurationType })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            <option value="any">Any Duration</option>
            <option value="hourly">Hourly Basis</option>
            <option value="daily">Daily Basis</option>
            <option value="weekly">Weekly Basis</option>
            <option value="monthly">Monthly Basis</option>
            <option value="project">Project / Task</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Sort Priority
          </label>
          <select
            value={criteria.sortBy}
            onChange={e =>
              onCriteriaChange({
                sortBy: e.target.value as SearchCriteria['sortBy'],
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            <option value="relevance">Best Match (Bayesian Score)</option>
            <option value="rating">Highest Skill Rating</option>
            <option value="jobs">Most Completed Jobs</option>
            <option value="experience">Trade Experience (Years)</option>
            <option value="price_low_high">Price (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Row 2: Secondary Controls: Budget, Availability, Rating, New Worker Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Budget Range */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Budget Range (₹)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={criteria.budgetMin ?? ''}
              onChange={e =>
                onCriteriaChange({
                  budgetMin: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={criteria.budgetMax ?? ''}
              onChange={e =>
                onCriteriaChange({
                  budgetMax: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Availability
          </label>
          <select
            value={criteria.availability}
            onChange={e =>
              onCriteriaChange({
                availability: e.target.value as 'all' | AvailabilityStatus,
              })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available Today (Agent Confirmed)</option>
            <option value="availability_pending">Agent Confirmation Required</option>
            <option value="temporarily_unavailable">Busy / Project Engaged</option>
          </select>
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Minimum Rating
          </label>
          <select
            value={criteria.minRating}
            onChange={e => onCriteriaChange({ minRating: Number(e.target.value) })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          >
            <option value={0}>Any Rating (Includes New)</option>
            <option value={4.5}>4.5★ and above</option>
            <option value={4.0}>4.0★ and above</option>
            <option value={3.5}>3.5★ and above</option>
          </select>
        </div>

        {/* New Worker Visibility Interleaving */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100/70 transition-colors">
            <input
              type="checkbox"
              checked={criteria.includeNewWorkers}
              onChange={e => onCriteriaChange({ includeNewWorkers: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-600" />
                <span>New Worker Discovery</span>
              </span>
              <span className="text-[10px] text-slate-500">
                Interleave 1 new worker per 2 regular
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Row 3: Skill Tags Selector */}
      {availableTags.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Required Skill Tags:
            </label>
            {criteria.selectedTags.length > 0 && (
              <button
                onClick={() => onCriteriaChange({ selectedTags: [] })}
                className="text-[11px] text-orange-600 hover:text-orange-800"
              >
                Clear tags ({criteria.selectedTags.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableTags.map(tag => {
              const isSelected = criteria.selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <span className="mr-1 text-orange-400">✓</span>}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing <strong className="text-slate-900 font-mono">{totalResultsCount}</strong> candidate profile{totalResultsCount === 1 ? '' : 's'} matching search criteria
        </span>
        {criteria.selectedTags.length > 0 && (
          <span className="text-orange-700 font-medium">
            Filtering by tags: {criteria.selectedTags.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};
