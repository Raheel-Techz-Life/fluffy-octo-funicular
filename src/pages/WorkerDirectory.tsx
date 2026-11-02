import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchCriteria,
  WorkerSearchResult,
  WorkerProfile,
  WorkerSkill,
} from '../types/worker';
import {
  searchWorkers,
  subscribeToWorkerUpdates,
  getAllAvailableOccupations,
  getTagsForOccupation,
  getWorkerSearchProfile,
  getWorkerSkills,
  getWorkerById,
  resetToDemoData,
} from '../services/workerService';
import { SearchFilters } from '../components/SearchFilters';
import { WorkerCard } from '../components/WorkerCard';
import { NewWorkerCard } from '../components/NewWorkerCard';
import { WorkerProfileModal } from '../components/WorkerProfileModal';
import { RankingExplanationModal } from '../components/RankingExplanationModal';
import { AgentAvailabilityModal } from '../components/AgentAvailabilityModal';
import { ContactRequestModal } from '../components/ContactRequestModal';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Database,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface WorkerDirectoryProps {
  agentManagerOpen: boolean;
  onCloseAgentManager: () => void;
  onRequestElectricianDemo: boolean;
  onResetElectricianDemoTrigger: () => void;
}

export const WorkerDirectory: React.FC<WorkerDirectoryProps> = ({
  agentManagerOpen,
  onCloseAgentManager,
  onRequestElectricianDemo,
  onResetElectricianDemoTrigger,
}) => {
  // Search Criteria State
  const [criteria, setCriteria] = useState<SearchCriteria>({
    occupation: 'all',
    selectedTags: [],
    location: 'all',
    duration: 'any',
    budgetMin: undefined,
    budgetMax: undefined,
    availability: 'all',
    minRating: 0,
    minExperience: 0,
    includeNewWorkers: true,
    sortBy: 'relevance',
  });

  // State revision counter to re-render on database updates
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return subscribeToWorkerUpdates(() => {
      setRevision(r => r + 1);
    });
  }, []);

  // Modal States
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<WorkerSearchResult | null>(null);
  const [contactRequestTarget, setContactRequestTarget] = useState<{
    worker: WorkerProfile;
    skill: WorkerSkill | null;
  } | null>(null);

  // Auto-trigger electrician demo if requested from navigation
  useEffect(() => {
    if (onRequestElectricianDemo) {
      applyPreset('electrician_demo');
      onResetElectricianDemoTrigger();
    }
  }, [onRequestElectricianDemo]);

  // Occupations and Tags
  const availableOccupations = useMemo(() => {
    return getAllAvailableOccupations();
  }, [revision]);

  const availableTags = useMemo(() => {
    return getTagsForOccupation(criteria.occupation);
  }, [criteria.occupation, revision]);

  // Run Search & Ranking
  const searchResults: WorkerSearchResult[] = useMemo(() => {
    return searchWorkers(criteria);
  }, [criteria, revision]);

  // Handle criteria update
  const handleCriteriaChange = (updated: Partial<SearchCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setCriteria({
      occupation: 'all',
      selectedTags: [],
      location: 'all',
      duration: 'any',
      budgetMin: undefined,
      budgetMax: undefined,
      availability: 'all',
      minRating: 0,
      minExperience: 0,
      includeNewWorkers: true,
      sortBy: 'relevance',
    });
  };

  // Preset Handlers
  const applyPreset = (preset: 'electrician_demo' | 'plumber_demo' | 'carpenter_demo') => {
    if (preset === 'electrician_demo') {
      // Scenario from Section 16:
      // 1. Customer searches for an electrician in Hubballi
      // 2. Customer selects Wiring and Maintenance tags
      // 3. Customer chooses a daily hiring duration
      // 4. Platform filters and ranks
      setCriteria({
        occupation: 'Electrician',
        selectedTags: ['Wiring', 'Maintenance'],
        location: 'Hubballi',
        duration: 'daily',
        budgetMin: undefined,
        budgetMax: undefined,
        availability: 'all',
        minRating: 0,
        minExperience: 0,
        includeNewWorkers: true,
        sortBy: 'relevance',
      });
    } else if (preset === 'plumber_demo') {
      setCriteria({
        occupation: 'Plumber',
        selectedTags: ['Pipe Fitting', 'Leakage Repair'],
        location: 'all',
        duration: 'daily',
        budgetMin: undefined,
        budgetMax: undefined,
        availability: 'all',
        minRating: 0,
        minExperience: 0,
        includeNewWorkers: true,
        sortBy: 'relevance',
      });
    } else if (preset === 'carpenter_demo') {
      setCriteria({
        occupation: 'Carpenter',
        selectedTags: ['Furniture Repair', 'Woodwork'],
        location: 'all',
        duration: 'daily',
        budgetMin: undefined,
        budgetMax: undefined,
        availability: 'all',
        minRating: 0,
        minExperience: 0,
        includeNewWorkers: true,
        sortBy: 'relevance',
      });
    }
  };

  // Open profile modal
  const handleViewProfile = (workerId: string) => {
    setSelectedProfileId(workerId);
  };

  // Open contact modal
  const handleRequestContact = (workerId: string, skillId: string) => {
    const worker = getWorkerById(workerId);
    if (!worker) return;
    const skills = getWorkerSkills(workerId);
    const skill = skills.find(s => s.skillId === skillId) || skills[0] || null;
    setContactRequestTarget({ worker, skill });
  };

  // Current selected profile for detailed modal
  const profileData = selectedProfileId ? getWorkerSearchProfile(selectedProfileId) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
              Worker Profile Management &amp; Skill Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mt-1 text-white">
              Skills That Work. Opportunities That Matter.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed">
              Connect informal and semi-formal workers with employers who need verified skills for daily, hourly, weekly or project work. Workers never need a smartphone—records and real-world availability are managed by certified field agents.
            </p>

            {/* Architecture Invariants Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1 Permanent Worker ID across all trades</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Isolated ratings &amp; job counts per skill</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Fair placement for newly registered workers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Search & Filter Component */}
        <SearchFilters
          criteria={criteria}
          availableOccupations={availableOccupations}
          availableTags={availableTags}
          onCriteriaChange={handleCriteriaChange}
          onResetFilters={handleResetFilters}
          onApplyPreset={applyPreset}
          totalResultsCount={searchResults.length}
        />

        {/* Results Header */}
        <div className="mt-8 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Matching Workers &amp; Trade Profiles
            </h2>
            <p className="text-xs text-slate-500">
              Ordered by Bayesian skill relevance score. New workers interleaved at 2:1 ratio.
            </p>
          </div>

        </div>

        {/* Result Cards Grid */}
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {searchResults.map(result => {
              const isNewWorker = result.ranking.isNewWorker || result.isNewPlacementSlot;

              if (isNewWorker) {
                return (
                  <NewWorkerCard
                    key={`${result.worker.workerId}_${result.matchingSkill.skillId}_new`}
                    result={result}
                    onViewProfile={handleViewProfile}
                    onRequestContact={handleRequestContact}
                    onExplainRanking={setExplainResult}
                  />
                );
              }

              return (
                <WorkerCard
                  key={`${result.worker.workerId}_${result.matchingSkill.skillId}`}
                  result={result}
                  onViewProfile={handleViewProfile}
                  onRequestContact={handleRequestContact}
                  onExplainRanking={setExplainResult}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No matching workers found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No workers matched your specific combination of occupation, tags, budget, and location. Try loosening filters.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Worker Profile Modal */}
      {selectedProfileId && profileData && (
        <WorkerProfileModal
          worker={profileData.worker}
          skills={profileData.skills}
          reviews={profileData.reviews}
          onClose={() => setSelectedProfileId(null)}
          onRequestContact={handleRequestContact}
          onUpdateAvailability={workerId => {
            // Handled via state trigger
            setSelectedProfileId(null);
          }}
        />
      )}

      {/* 2. Ranking Explanation Modal */}
      {explainResult && (
        <RankingExplanationModal
          result={explainResult}
          onClose={() => setExplainResult(null)}
        />
      )}

      {/* Agent Availability Manager */}
      {agentManagerOpen && (
        <AgentAvailabilityModal
          onClose={onCloseAgentManager}
          onUpdated={() => {
            setRevision(r => r + 1);
          }}
        />
      )}

      {/* Contact Request Modal */}
      {contactRequestTarget && (
        <ContactRequestModal
          worker={contactRequestTarget.worker}
          skill={contactRequestTarget.skill}
          onClose={() => setContactRequestTarget(null)}
        />
      )}

    </div>
  );
};
