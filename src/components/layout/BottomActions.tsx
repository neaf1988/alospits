import type { ReactNode } from 'react';

interface BottomActionsProps {
  children: ReactNode;
}

export function BottomActions({ children }: BottomActionsProps) {
  return (
    <footer className="shrink-0 border-t border-slate-700/60 bg-pit-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {children}
    </footer>
  );
}
