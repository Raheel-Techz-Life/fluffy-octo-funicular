import React from 'react';
import { Users, Briefcase, Navigation } from 'lucide-react';

export type AppView = 'directory' | 'recruitment' | 'tracking';

const TABS: { id: AppView; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'directory', label: 'Find workers', icon: Users },
  { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
  { id: 'tracking', label: 'Job sites', icon: Navigation },
];

export const SectionTabs: React.FC<{ view: AppView; onChange: (v: AppView) => void }> = ({ view, onChange }) => (
  <div className="bg-white border-b border-slate-200">
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto" aria-label="Sections">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-current={view === id ? 'page' : undefined}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${
            view === id ? 'border-orange-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${view === id ? 'text-orange-600' : ''}`} />
          {label}
        </button>
      ))}
    </nav>
  </div>
);
