import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base(props: P) {
  const { size = 20, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const IconBuddies = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8.5" cy="8" r="3.2" />
    <path d="M2.8 20c.6-3.4 2.9-5.2 5.7-5.2s5.1 1.8 5.7 5.2" />
    <circle cx="17" cy="9.5" r="2.4" />
    <path d="M16.2 14.9c2.7.2 4.4 1.8 5 4.6" />
  </svg>
);

export const IconMap = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.4-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.6-6.5 10-6.5 10Z" />
    <circle cx="12" cy="11" r="2.3" />
  </svg>
);

export const IconChat = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12a8 8 0 0 1-8 8H4.6l1.2-3.2A8 8 0 1 1 21 12Z" />
    <path d="M8.5 10.5h7M8.5 14h4" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const IconCamera = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8Z" />
    <circle cx="12" cy="13.5" r="3.4" />
  </svg>
);

export const IconMic = (p: P) => (
  <svg {...base(p)}>
    <rect x="9.2" y="3" width="5.6" height="10.5" rx="2.8" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </svg>
);

export const IconSend = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 12 16-7-4.5 15-4-6.5L4 12Z" />
    <path d="m11.5 13.5 8.5-8.5" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L20 6.5" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconFlag = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 21V4" />
    <path d="M5 4.8c4-2.3 6.8 2 12 .3V14c-5.2 1.7-8-2.6-12-.3" />
  </svg>
);

export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9L12 3.6Z" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.8-3.8" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </svg>
);

export const IconClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconFlame = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21c3.9 0 6.5-2.5 6.5-6.2 0-2.7-1.6-4.6-3-6.3-1.2-1.4-2.3-2.8-2.5-4.9-2.7 1.6-4 3.6-4.2 5.6-.9-.4-1.6-1.1-2-2.1-1.2 1.6-1.8 3.2-1.8 4.9 0 6 3.1 9 7 9Z" />
    <path d="M12 21c-1.8 0-3-1.4-3-3.1 0-1.5 1-2.5 2-3.7.6-.7 1.2-1.4 1.5-2.4 1.4 1.3 2.5 3 2.5 4.8 0 2.6-1.2 4.4-3 4.4Z" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="15" rx="2" />
    <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
  </svg>
);

export const IconFood = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 3v7a2 2 0 0 0 2 2v9M9 3v5M5 3v5" />
    <path d="M17 3c-1.8 1.4-2.5 3.6-2.5 6 0 1.7.9 2.5 2.5 2.5V21" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 5.8v5.4c0 4.4 2.9 7.6 7 9.3 4.1-1.7 7-4.9 7-9.3V5.8L12 3Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IconEyeOff = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 4.5 20 20M9.9 6.3A8.6 8.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a15.6 15.6 0 0 1-3.4 3.9M6.4 8.2A15 15 0 0 0 2.5 12S6 18.2 12 18.2a8.9 8.9 0 0 0 3-.5" />
    <path d="M10 10.6a2.8 2.8 0 0 0 3.8 3.8" />
  </svg>
);

export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" />
    <path d="M10.5 12H21m0 0-3.5-3.5M21 12l-3.5 3.5" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5L8 5.5Z" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
  </svg>
);

export const IconImage = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="9.5" r="1.6" />
    <path d="m4.5 17.5 4.6-4.3 3.4 3.1 3-2.7 4 3.9" />
  </svg>
);

export const IconSliders = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h9M17.5 7H20M4 16h4M12.5 16H20" />
    <circle cx="15" cy="7" r="2.2" />
    <circle cx="10" cy="16" r="2.2" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 4h4l1.5 4.5L8 10a12.5 12.5 0 0 0 6 6l1.5-2.5L20 15v4a1.9 1.9 0 0 1-2.1 1.9C9.6 20 4 14.4 3.1 6.1A1.9 1.9 0 0 1 5 4Z" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
);

export const IconId = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M5.5 16c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M14.5 9.5H19M14.5 13H19" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4M12 16.8v.4" />
  </svg>
);

export const IconFastForward = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 6.5v11l8-5.5-8-5.5Z" />
    <path d="M12.5 6.5v11l8-5.5-8-5.5Z" />
  </svg>
);

export const IconQuad = (p: P) => (
  <svg {...base(p)} strokeWidth={2.1}>
    <rect x="4" y="4" width="7" height="7" rx="1.6" />
    <rect x="13" y="4" width="7" height="7" rx="3.5" />
    <rect x="4" y="13" width="7" height="7" rx="3.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.6" />
  </svg>
);

export const IconWalk = (p: P) => (
  <svg {...base(p)}>
    <circle cx="13" cy="4.5" r="1.8" />
    <path d="m9 21 2-5-2.5-2 1-5.5L7 10l-1.5 3M11.5 8.5 14 10l3 .5M12 16l2.5 2 1 3.5" />
  </svg>
);

/* ----------------------------- Added Icons ----------------------------- */

export const IconSiren = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 18v-6a5 5 0 0 1 10 0v6" />
    <path d="M5 21h14a1 1 0 0 0 1-1v-2H4v2a1 1 0 0 0 1 1Z" />
    <path d="M12 2v2M4 7l1.5 1.5M20 7l-1.5 1.5" />
  </svg>
);

export const IconSparkles = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 3 1.9 4.8L18.7 9l-4.8 1.9L12 15.7l-1.9-4.8L5.3 9l4.8-1.9L12 3Z" />
    <path d="M18.5 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
  </svg>
);

export const IconNavigation = (p: P) => (
  <svg {...base(p)}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

export const IconLeaf = (p: P) => (
  <svg {...base(p)}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export const IconUserPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconCalendarCheck = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

export const IconBookmark = (p: P) => (
  <svg {...base(p)}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </svg>
);

export const IconRadar = (p: P) => (
  <svg {...base(p)}>
    <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07" />
    <path d="M16.24 7.76A6 6 0 0 0 7.76 16.24" />
    <path d="M13.41 10.59A2 2 0 0 0 10.59 13.41" />
    <path d="M2 12h20" />
  </svg>
);

export const IconBuilding = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
  </svg>
);

export const IconCoffee = (p: P) => (
  <svg {...base(p)}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

