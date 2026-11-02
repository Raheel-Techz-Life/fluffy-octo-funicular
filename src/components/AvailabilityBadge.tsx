import React from 'react';
import { AvailabilityStatus } from '../types/worker';
import { resolveAvailability } from '../services/availabilityService';
import { CheckCircle2, Clock, AlertCircle, PhoneOff, UserX, ShieldAlert } from 'lucide-react';

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  expectedAvailableAt?: string | null;
  unavailabilityReason?: string;
  showDetails?: boolean;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  status,
  expectedAvailableAt = null,
  unavailabilityReason,
  showDetails = false,
}) => {
  const resolution = resolveAvailability(status, expectedAvailableAt, unavailabilityReason);

  const getIcon = () => {
    switch (resolution.currentStatus) {
      case 'available':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'temporarily_unavailable':
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'availability_pending':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'contact_unsuccessful':
        return <PhoneOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'not_interested':
        return <UserX className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      case 'profile_inactive':
        return <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
  };

  const getStyle = () => {
    switch (resolution.badgeVariant) {
      case 'green':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'red':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border ${getStyle()} whitespace-nowrap`}
        title={resolution.explanation}
      >
        {getIcon()}
        <span>{resolution.statusLabel}</span>
      </span>
      {showDetails && resolution.explanation && (
        <span className="text-[11px] text-slate-500 mt-0.5 max-w-xs leading-tight">
          {resolution.explanation}
        </span>
      )}
    </div>
  );
};
