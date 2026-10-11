import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="slg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#slg)" />
      <path
        d="M16 24s6.4-6.1 6.4-11A6.4 6.4 0 0 0 16 6.6 6.4 6.4 0 0 0 9.6 13c0 4.9 6.4 11 6.4 11Z"
        fill="#ffffff"
      />
      <circle cx="16" cy="12.9" r="2.55" fill="#059669" />
    </svg>
  );
}

export function NavigationIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M3 11.5 21 3l-8.5 18-2.2-7.3z" />
    </svg>
  );
}

export function ChevronDownIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function ClockIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function MapPinIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function CarIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M4.5 16.5v2.2a1 1 0 0 0 1 1h1.6a1 1 0 0 0 1-1v-1.4m8.8 0v1.4a1 1 0 0 0 1 1h1.6a1 1 0 0 0 1-1v-2.2" />
      <path d="M3.5 16.5v-3.1c0-.5.2-1 .6-1.3l1.6-1.4 1.4-2.6c.2-.4.6-.6 1-.6h6.8c.4 0 .8.2 1 .6l1.4 2.6 1.6 1.4c.4.3.6.8.6 1.3v3.1z" />
      <path d="M6.5 13.5h11" />
    </svg>
  );
}

export function CartIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2.2l2.1 10.4a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6" />
    </svg>
  );
}

export function UsersIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 19a5 5 0 0 0-2-4" />
    </svg>
  );
}

export function CheckIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="m4.5 12.5 4.5 4.5 10.5-11" />
    </svg>
  );
}

export function CloseIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function WazeIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M16.7 4.2A6.9 6.9 0 0 0 5.9 9.9c-.1 1 .1 1.9.3 2.5-.6.7-1 1.6-1 2.5a3.4 3.4 0 0 0 4.2 3.3 4.6 4.6 0 0 0 7 .6c1-.8 1.7-2 2-3.3.3-1.4 0-2.8-.6-4a6.9 6.9 0 0 0-1.1-7.3Zm-8 11.5a2.2 2.2 0 0 1 1.5-3.9c.1.5.3 1 .5 1.4.5.9 1.3 1.6 2.2 2a2.4 2.4 0 0 1-4.2.5Z"
      />
      <circle cx="10.4" cy="9.6" r="1" fill="#fff" />
      <circle cx="14.6" cy="9.6" r="1" fill="#fff" />
    </svg>
  );
}

export function BuildingIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M4 20.5V6.2a1 1 0 0 1 .7-1l7-2.5a1 1 0 0 1 1.3 1v16.8" />
      <path d="M13 9.5h6a1 1 0 0 1 1 1v10M2.5 20.5h19" />
      <path d="M7 8.5h3M7 12h3M7 15.5h3M16 13h1.5M16 16.5h1.5" />
    </svg>
  );
}

export function ChartIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M8 15.5 11.5 11l3 2.5L19 7" />
    </svg>
  );
}

export function RadarIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 12l5-4" />
    </svg>
  );
}

export function SlidersIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h1" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function ShareIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M12 15V3.5m0 0 3.5 3.5M12 3.5 8.5 7" />
      <path d="M5 12.5v6a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-6" />
    </svg>
  );
}

export function SparkIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2.5 13.7 9l6.5 1.7-6.5 1.7L12 19l-1.7-6.6L3.8 10.7 10.3 9z"
      />
    </svg>
  );
}

export function AndroidIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.87 3.23a11.5 11.5 0 0 0-9.82 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.6 10.6 0 0 0 1.5 18h21a10.6 10.6 0 0 0-4.9-8.52ZM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"
      />
    </svg>
  );
}

export function AppleIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M16.36 12.78c.02 2.5 2.2 3.33 2.22 3.34-.02.06-.35 1.2-1.15 2.37-.69 1.01-1.41 2.01-2.55 2.03-1.12.02-1.48-.66-2.76-.66-1.28 0-1.68.64-2.74.68-1.1.04-1.94-1.09-2.64-2.09-1.43-2.07-2.52-5.84-1.05-8.39.73-1.26 2.03-2.06 3.45-2.08 1.08-.02 2.1.73 2.76.73.66 0 1.9-.9 3.2-.77.55.02 2.08.22 3.06 1.66-.08.05-1.83 1.07-1.81 3.18M14.3 4.9c.59-.71 1-1.7.88-2.68-.85.03-1.88.57-2.49 1.28-.55.63-1.03 1.64-.9 2.6.95.07 1.92-.48 2.51-1.2"
      />
    </svg>
  );
}

export function QrIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3M20.5 14v.01M14 20.5h3.5M20.5 17.5v3" />
    </svg>
  );
}

export function DownloadIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M12 3.5v11m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 17.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1" />
    </svg>
  );
}

export function UserIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function LogoutIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M14 7.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h6.5A1.5 1.5 0 0 0 14 18v-1.5" />
      <path d="M10 12h10m0 0-3-3m3 3-3 3" />
    </svg>
  );
}

export function ShieldIcon({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true" {...props}>
      <path d="M12 3.2 5 6v5.2c0 4.2 2.9 7.6 7 9.6 4.1-2 7-5.4 7-9.6V6l-7-2.8Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </svg>
  );
}
