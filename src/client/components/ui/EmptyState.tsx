import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="py-24 px-6 text-center">
    <h2 className="text-base font-medium text-slate-200">{title}</h2>
    {description && <p className="mt-1.5 max-w-sm mx-auto text-sm leading-relaxed text-slate-400">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

interface StatProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  dot?: string;
}

/** A quiet metric: label above, value below, optional status dot. */
export const Stat: React.FC<StatProps> = ({ label, value, hint, dot }) => (
  <div className="space-y-1">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="flex items-center gap-2 text-xl font-medium text-slate-100">
      {dot && <span className={`dot ${dot}`} />}
      {value}
    </div>
    {hint && <div className="text-xs text-slate-400">{hint}</div>}
  </div>
);
