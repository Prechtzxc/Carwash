import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, className = "h-5 w-5", ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m13 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M8 7h9v9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

export function Boxes(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 7 3.5-7 3.5-7-3.5L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m5 6.5 7 3.5 7-3.5M5 6.5V14l7 3.5 7-3.5V6.5M12 10v7.5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m5 14-2 1v4l7 3.5 7-3.5v-2M19 14l2 1v4l-4 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function CarFront(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 17.5h13a1.5 1.5 0 0 0 1.5-1.5v-3.3a2 2 0 0 0-.3-1.1l-2-3.3a2 2 0 0 0-1.7-1H8a2 2 0 0 0-1.7 1l-2 3.3a2 2 0 0 0-.3 1.1V16a1.5 1.5 0 0 0 1.5 1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M4.2 12h15.6M7 17.5v2M17 17.5v2M7.5 14.7h.1M16.4 14.7h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function ChartLine(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 19V5M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="m7 15 3-4 3 2 5-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M16 7h2v2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function CheckCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

export function CircleDashed(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1.7" />
      <circle cx="12" cy="12" fill="currentColor" r="1.5" />
    </Icon>
  );
}

export function Clock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v5l3.2 1.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function ClipboardCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.5h6M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M8 6H6.5A1.5 1.5 0 0 0 5 7.5v11A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 17.5 6H16" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m8.5 13 2.2 2.2 4.8-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

export function Droplets(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.3 4.3C8.3 4.3 5 8.1 5 10.6a3.3 3.3 0 0 0 6.6 0c0-2.5-3.3-6.3-3.3-6.3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M16.5 9.8c0 2.1-2.5 5-2.5 5a2.5 2.5 0 0 0 5 0c0-2-2.5-5-2.5-5ZM15 19.5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function LayoutDashboard(props: IconProps) {
  return (
    <Icon {...props}>
      <rect height="6.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="6.5" x="4" y="4" />
      <rect height="6.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="6.5" x="13.5" y="4" />
      <rect height="6.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="6.5" x="4" y="13.5" />
      <rect height="6.5" rx="1" stroke="currentColor" strokeWidth="1.7" width="6.5" x="13.5" y="13.5" />
    </Icon>
  );
}

export function Layers(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 8 4-8 4-8-4 8-4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m4 12 8 4 8-4M4 16l8 4 8-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function LogOut(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M11 12h8M16 8.5l3.5 3.5-3.5 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function QrCode(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M14 14h3v3h-3zM20 14v3M17 20h3M14 20v-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}

export function Sparkles(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.1 4.1L17 8.2l-3.9 1.1L12 13.5l-1.1-4.2L7 8.2l3.9-1.1L12 3ZM18.5 14l.6 2.1 2.1.6-2.1.6-.6 2.2-.6-2.2-2.1-.6 2.1-.6.6-2.1ZM5 14l.7 2.8 2.8.7-2.8.7L5 21l-.7-2.8-2.8-.7 2.8-.7L5 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </Icon>
  );
}

export function ShieldCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 19 6v5.1c0 4.4-2.8 7.6-7 9.4-4.2-1.8-7-5-7-9.4V6l7-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m8.7 12 2.1 2.1 4.5-4.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </Icon>
  );
}

export function Users(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a2.8 2.8 0 0 1 0 5.4M16.5 13.7a5.3 5.3 0 0 1 4 5.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </Icon>
  );
}
