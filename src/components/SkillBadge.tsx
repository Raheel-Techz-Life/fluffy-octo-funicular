import React from 'react';

interface SkillBadgeProps {
  label: string;
  isMatched?: boolean;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  label,
  isMatched = false,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (isMatched) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded border border-orange-200 bg-orange-50 text-orange-800 ${sizeClasses} whitespace-nowrap`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 shrink-0" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-normal rounded border border-slate-200 bg-slate-50/70 text-slate-700 ${sizeClasses} whitespace-nowrap`}
    >
      {label}
    </span>
  );
};
