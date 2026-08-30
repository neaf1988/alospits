import type { VehicleType } from '../../types';

interface VehicleTypeIconProps {
  type: VehicleType;
  className?: string;
}

export function VehicleTypeIcon({ type, className = 'h-5 w-5' }: VehicleTypeIconProps) {
  if (type === 'MOTORCYCLE') {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <circle cx="5.5" cy="17.5" r="2.5" />
        <circle cx="18.5" cy="17.5" r="2.5" />
        <path d="M8 17.5h7M5.5 17.5L9 10h4l2 3h3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        d="M5 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15h1.5l1.2-4.5H11l2 4.5h6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 10.5h4" strokeLinecap="round" />
    </svg>
  );
}
