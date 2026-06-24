import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...props,
});

export const ChevronRight = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3l5 5-5 5" />
  </svg>
);

export const ChevronDown = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6l5 5 5-5" />
  </svg>
);

export const Folder = (p: P) => (
  <svg {...base(p)}>
    <path d="M1.2 3.6c0-.86.7-1.56 1.56-1.56h3.1l1.25 1.56h6.13c.86 0 1.56.7 1.56 1.56v7.24c0 .86-.7 1.56-1.56 1.56H2.76c-.86 0-1.56-.7-1.56-1.56V3.6z" fill="#c9a45c" />
    <path d="M1.2 3.6c0-.86.7-1.56 1.56-1.56h3.1l1.25 1.56h6.13c.86 0 1.56.7 1.56 1.56v.4H1.2v-.4z" fill="#d8b878" />
  </svg>
);

export const FolderOpen = (p: P) => (
  <svg {...base(p)}>
    <path d="M1.2 3.6c0-.86.7-1.56 1.56-1.56h3.1l1.25 1.56h6.13c.86 0 1.56.7 1.56 1.56v.9H1.2v-.9z" fill="#c9a45c" />
    <path d="M2.5 6.2h12l-1.5 6.4c-.16.7-.78 1.2-1.5 1.2H1.7c-.95 0-1.62-.9-1.4-1.82l1.1-5.1A1.45 1.45 0 0 1 2.5 6.2z" fill="#d8b878" />
  </svg>
);

export const CaretRun = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 2.5l9 5.5-9 5.5z" fill="#5fb96b" />
  </svg>
);

export const Debug = (p: P) => (
  <svg {...base(p)} stroke="#5fb96b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="8" cy="8.5" rx="3.2" ry="3.6" fill="none" />
    <path d="M4.8 8.5h6.4M8 5v7M3 6.2l1.8 1.2M13 6.2l-1.8 1.2M3 11l1.8-1.2M13 11l-1.8-1.2M5.4 4.4L6.4 5.6M10.6 4.4L9.6 5.6" />
  </svg>
);

export const Stop = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="10" height="10" rx="1.6" fill="#c7551b" />
  </svg>
);

export const Hammer = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 3.2l3.3 3.3-1.7 1.7-1-.2-3.9 3.9-1.4-1.4 3.9-3.9-.2-1z" fill="none" />
    <path d="M3.4 11.2l1.4 1.4" />
  </svg>
);

export const ArrowLeft = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L4 8l6 5" />
  </svg>
);

export const ArrowRight = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3l6 5-6 5" />
  </svg>
);

export const Sync = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 8a5 5 0 0 1-8.6 3.5M3 8a5 5 0 0 1 8.6-3.5" />
    <path d="M11 2.5V5h-2.5M5 13.5V11h2.5" />
  </svg>
);

export const Search = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="4.2" />
    <path d="M10.2 10.2L13.5 13.5" />
  </svg>
);

export const Gear = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" fill="none">
    <circle cx="8" cy="8" r="2.1" />
    <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5L3.4 3.4" strokeLinecap="round" />
  </svg>
);

export const Close = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export const Plus = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const Terminal = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" fill="none" />
    <path d="M4 6l2.2 2L4 10M7.5 10.2h4" />
  </svg>
);

export const ListCheck = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d="M6 3.5h7M6 8h7M6 12.5h7" />
    <path d="M1.5 3.5l1 1 1.6-2M1.5 8l1 1 1.6-2M1.5 12.5l1 1 1.6-2" />
  </svg>
);

export const GitBranch = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none">
    <circle cx="4" cy="3.5" r="1.6" />
    <circle cx="4" cy="12.5" r="1.6" />
    <circle cx="11.5" cy="5" r="1.6" />
    <path d="M4 5.1v5.8M11.5 6.6c0 3-7.5 1.4-7.5 4.3" />
  </svg>
);

export const ArrowUp = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 12V4M4 8l4-4 4 4" />
  </svg>
);

export const ArrowDown = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4v8M4 8l4 4 4-4" />
  </svg>
);

export const Commit = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none">
    <path d="M8 2v12" />
    <circle cx="8" cy="8" r="2.4" fill="#2b2b2b" />
  </svg>
);

export const Cube = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none">
    <path d="M8 1.5l5.5 3v7L8 14.5 2.5 11.5v-7z" />
    <path d="M2.5 4.5L8 7.5l5.5-3M8 7.5v7" />
  </svg>
);

export const Stack = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none">
    <path d="M8 1.5l6 3-6 3-6-3z" />
    <path d="M2 8l6 3 6-3M2 11l6 3 6-3" />
  </svg>
);

export const Bookmark = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round">
    <path d="M4 2.5h8v11l-4-3-4 3z" />
  </svg>
);

export const Warning = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 1.5l6.8 12H1.2z" fill="#caa53a" />
    <path d="M8 6.2v3M8 11v.4" stroke="#2b2b2b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ErrorIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="6.4" fill="#c7551b" />
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#2b2b2b" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const Info = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="6.4" fill="#5b87b5" />
    <path d="M8 5v.2M8 7v4" stroke="#2b2b2b" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const Sparkles = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5l1.2 3.3 3.3 1.2-3.3 1.2L8 10.5l-1.2-3.3-3.3-1.2 3.3-1.2z" />
    <path d="M13 10l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    <path d="M3.5 11.5l.5 1.2 1.2.5-1.2.5-.5 1.3-.5-1.3-1.2-.5 1.2-.5z" />
  </svg>
);

export const Bell = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round">
    <path d="M3.5 12h9l-1.2-1.6V7a3.3 3.3 0 0 0-6.6 0v3.4z" />
    <path d="M6.6 13.5a1.4 1.4 0 0 0 2.8 0" />
  </svg>
);

export const Lock = (p: P) => (
  <svg {...base(p)} stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round">
    <rect x="3" y="7" width="10" height="7" rx="1.3" />
    <path d="M5 7V5.2a3 3 0 0 1 6 0V7" />
  </svg>
);

export const ChevronRightSmall = ChevronRight;

/* ---------- file-type badges ---------- */
interface BadgeProps {
  ext: string;
  className?: string;
}
const badgeMap: Record<string, { label: string; color: string }> = {
  tsx: { label: "TS", color: "#3178c6" },
  ts: { label: "TS", color: "#3178c6" },
  jsx: { label: "JS", color: "#d4b54a" },
  js: { label: "JS", color: "#d4b54a" },
  json: { label: "{}", color: "#b7b73b" },
  css: { label: "#", color: "#42a5f5" },
  scss: { label: "#", color: "#c2619a" },
  html: { label: "<>", color: "#e44d26" },
  md: { label: "M↓", color: "#519aba" },
  svg: { label: "▲", color: "#d4904a" },
  ico: { label: "◆", color: "#7e57c2" },
  gitignore: { label: "G", color: "#8a8a8a" },
  config: { label: "⚙", color: "#7e9c6e" },
  txt: { label: "T", color: "#8a8a8a" },
};

export function FileBadge({ ext, className }: BadgeProps) {
  const b = badgeMap[ext] ?? { label: "?", color: "#8a8a8a" };
  return (
    <span
      className={`inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold leading-none text-white ${className ?? ""}`}
      style={{ background: b.color }}
      aria-hidden
    >
      {b.label}
    </span>
  );
}
