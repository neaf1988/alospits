interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
  disabled?: boolean;
}

function BellIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
      />
    </svg>
  );
}

export function NotificationBadge({ count, onClick, disabled }: NotificationBadgeProps) {
  const label =
    count === 0
      ? 'Sin alertas pendientes'
      : `${count} alerta${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-600/80 text-slate-300 transition hover:border-pit-accent/50 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
    >
      <BellIcon />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-pit-surface"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
