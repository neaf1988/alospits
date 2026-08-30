import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  variant?: 'default' | 'accent' | 'warning' | 'critical';
}

const variantStyles: Record<NonNullable<MetricCardProps['variant']>, string> = {
  default: 'border-slate-700/60 bg-slate-900/40',
  accent: 'border-pit-accent/40 bg-pit-accent/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
  critical: 'border-red-500/40 bg-red-500/10',
};

export function MetricCard({
  label,
  value,
  hint,
  variant = 'default',
}: MetricCardProps) {
  return (
    <div className={`rounded-xl border p-3 ${variantStyles[variant]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function DashboardSection({
  title,
  children,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      {isEmpty ? <p className="text-sm text-slate-500">{emptyMessage}</p> : children}
    </section>
  );
}
