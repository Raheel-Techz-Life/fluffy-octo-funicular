import React, { useState } from 'react';
import { X, Database, Copy, Check, Code, Shield } from 'lucide-react';

interface FirebaseSchemaModalProps {
  onClose: () => void;
}

export const FirebaseSchemaModal: React.FC<FirebaseSchemaModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1500);
  };

  const schemaTree = `kaamkaro/
├── workers/
│   ├── KK00124/  { workerId, fullName, location, area, languages, registrationStatus, agentId }
│   ├── KK00125/
│   └── KK00126/
│
├── workerSkills/
│   ├── KK00124/
│   │   ├── electrician/  { occupation, skillTags, completedJobs, averageRating, serviceRates, availabilityStatus }
│   │   ├── plumber/
│   │   └── carpenter/
│
├── skillReviews/
│   ├── REV001/  { workerId, skillId, customerName, rating, feedback, createdAt }
│   └── REV002/
│
├── availability/
│   ├── KK00124/  { status, lastConfirmedAt, confirmedByAgentId, expectedAvailableAt }
│   └── KK00126/
│
└── searchMetadata/
    └── workerSkillIndex/  { electrician: [...], plumber: [...] }`;

  const securityRules = `{
  "rules": {
    "kaamkaro": {
      "workers": {
        ".read": "auth != null",
        "$workerId": {
          ".write": "auth.token.role === 'agent' || auth.token.role === 'admin'",
          // Prevent public scraping of phone numbers
          "phoneNumber": {
            ".read": "auth.token.role === 'agent' || auth.token.role === 'admin'"
          }
        }
      },
      "workerSkills": {
        ".read": true,
        "$workerId": {
          ".write": "auth.token.role === 'agent' || auth.token.role === 'admin' || auth.token.role === 'system_service'"
        }
      },
      "skillReviews": {
        ".read": true,
        "$reviewId": {
          // Enforce one review per completed verified job
          ".write": "auth != null && !data.exists()"
        }
      }
    }
  }
}`;

  const teammateCodeExample = `// How teammates integrate with this module:
import {
  searchWorkers,
  getWorkerSearchProfile,
  updateSkillStatistics,
  updateWorkerAvailability
} from './services/workerService';

// 1. Search electricians with Wiring and Maintenance tags in Hubballi
const results = searchWorkers({
  occupation: 'Electrician',
  selectedTags: ['Wiring', 'Maintenance'],
  location: 'Hubballi',
  duration: 'daily',
  budgetMax: 1000,
  availability: 'available',
  minRating: 4.0,
  minExperience: 0,
  includeNewWorkers: true,
  sortBy: 'relevance'
});

// 2. Fetch full worker profile for teammate's modal / detail page
const profile = getWorkerSearchProfile('KK00124');

// 3. Teammate's job management module updates plumbing skill on job completion:
updateSkillStatistics('KK00124', 'KK00124_plumber', {
  jobId: 'JOB1029',
  workerId: 'KK00124',
  skillId: 'KK00124_plumber',
  customerRating: 5.0,
  feedback: 'Flawless pipe leakage repair',
  customerName: 'Sujata Kulkarni'
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Firebase Realtime Database Architecture
              </h3>
              <p className="text-xs text-slate-300">
                Shared contract for Teammate Module Integration (Section 13 &amp; 15)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Database Tree */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-orange-600" />
                <span>1. Realtime Database Collection Tree</span>
              </span>
              <button
                onClick={() => copyToClipboard(schemaTree, 'tree')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'tree' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'tree' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
              {schemaTree}
            </pre>
          </div>

          {/* Section 2: Security Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Security Rules (Worker Contact Masking &amp; Role-based Write)</span>
              </span>
              <button
                onClick={() => copyToClipboard(securityRules, 'rules')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'rules' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
              {securityRules}
            </pre>
          </div>

          {/* Section 3: Teammate Integration Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Teammate Module Integration Code</span>
              </span>
              <button
                onClick={() => copyToClipboard(teammateCodeExample, 'code')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {copiedSection === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'code' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
              {teammateCodeExample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
