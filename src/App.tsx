import React, { useState } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { WorkerDirectory } from './pages/WorkerDirectory';
import { Recruitment } from './pages/Recruitment';
import { JobTracking } from './pages/JobTracking';
import { SectionTabs, AppView } from './components/SectionTabs';

export default function App() {
  const [agentManagerOpen, setAgentManagerOpen] = useState(false);
  const [requestElectricianDemo, setRequestElectricianDemo] = useState(false);
  const [view, setView] = useState<AppView>('directory');
  const [focusJobId, setFocusJobId] = useState<string | null>(null);

  const goTo = (next: AppView, jobId: string | null = null) => {
    setFocusJobId(jobId);
    setView(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar with 3-Zone contract */}
      <TopNavigation
        onOpenAgentManager={() => { setView('directory'); setAgentManagerOpen(true); }}
        onRunElectricianDemo={() => {
          setView('directory');
          setRequestElectricianDemo(true);
        }}
      />
      <SectionTabs view={view} onChange={v => goTo(v)} />

      {/* Main Worker Directory & Skill Intelligence Page */}
      <div className="flex-1">
        {view === 'recruitment' && <Recruitment focusJobId={focusJobId} onTrackJob={id => goTo('tracking', id)} />}
        {view === 'tracking' && <JobTracking focusJobId={focusJobId} onRecruit={id => goTo('recruitment', id)} />}
        <div hidden={view !== 'directory'}>
        <WorkerDirectory
          agentManagerOpen={agentManagerOpen}
          onCloseAgentManager={() => setAgentManagerOpen(false)}
          onRequestElectricianDemo={requestElectricianDemo}
          onResetElectricianDemoTrigger={() => setRequestElectricianDemo(false)}
        />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-900">KaamKaro</strong> · Skills That Work. Opportunities That Matter.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setView('directory'); setAgentManagerOpen(true); }}
              className="hover:text-slate-900 transition-colors"
            >
              Agent Availability Manager
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
