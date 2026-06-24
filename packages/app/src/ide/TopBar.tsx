import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Search } from "./icons";

export interface IdeActions {
  onRun: () => void;
  onStop: () => void;
  onToggleProject: () => void;
  onToggleStructure: () => void;
  onToggleBottom: (tab?: string) => void;
  onFind: () => void;
}

interface MenuItem {
  label?: string;
  shortcut?: string;
  sep?: boolean;
  action?: () => void;
  disabled?: boolean;
}
interface MenuDef {
  label: string;
  items: MenuItem[];
}

export function TopBar({ actions }: { actions: IdeActions }) {
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const noop = () => setOpen(null);

  const menus: MenuDef[] = [
    {
      label: "File",
      items: [
        { label: "New…", shortcut: "⌘N", action: noop },
        { label: "Open…", shortcut: "⌘O", action: noop },
        { label: "Settings…", shortcut: "⌘,", action: noop },
        { sep: true },
        { label: "Close Project", action: noop },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Find…", shortcut: "⌘F", action: actions.onFind },
        { label: "Replace…", shortcut: "⌘R", action: noop },
        { label: "Find in Files…", shortcut: "⌘⇧F", action: actions.onFind },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Tool Windows", disabled: true },
        { label: "  Project", shortcut: "⌘1", action: actions.onToggleProject },
        { label: "  Structure", shortcut: "⌘7", action: actions.onToggleStructure },
        { label: "  Terminal", shortcut: "⌥F12", action: () => actions.onToggleBottom("terminal") },
        { label: "  Problems", shortcut: "⌘6", action: () => actions.onToggleBottom("problems") },
        { sep: true },
        { label: "Compact Mode", action: noop },
      ],
    },
    {
      label: "Navigate",
      items: [
        { label: "Class…", shortcut: "⌘O", action: noop },
        { label: "File…", shortcut: "⌘⇧O", action: noop },
        { label: "Symbol…", shortcut: "⌘⌥O", action: noop },
        { sep: true },
        { label: "Line/Column…", shortcut: "⌘L", action: noop },
        { label: "Recent Files", shortcut: "⌘E", action: noop },
      ],
    },
    {
      label: "Code",
      items: [
        { label: "Reformat Code", shortcut: "⌘⌥L", action: noop },
        { label: "Optimize Imports", shortcut: "⌃⌥O", action: noop },
        { sep: true },
        { label: "Comment with Line Comment", shortcut: "⌘/", action: noop },
      ],
    },
    {
      label: "Refactor",
      items: [
        { label: "Rename…", shortcut: "⇧F6", action: noop },
        { label: "Extract Variable", shortcut: "⌥⌘V", action: noop },
        { label: "Extract Method", shortcut: "⌥⌘M", action: noop },
      ],
    },
    {
      label: "Build",
      items: [
        { label: "Build Project", shortcut: "⌘F9", action: noop },
        { label: "Recompile 'App.tsx'", shortcut: "⌘⇧F9", action: noop },
      ],
    },
    {
      label: "Run",
      items: [
        { label: "Run 'App.tsx'", shortcut: "⌃R", action: actions.onRun },
        { label: "Debug 'App.tsx'", shortcut: "⌃D", action: actions.onRun },
        { sep: true },
        { label: "Stop 'taskflow'", shortcut: "⌘F2", action: actions.onStop },
        { sep: true },
        { label: "Edit Configurations…", action: noop },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Tasks & Contexts", action: noop },
        { label: "HTTP Client", action: noop },
      ],
    },
    {
      label: "VCS",
      items: [
        { label: "Commit…", shortcut: "⌘K", action: noop },
        { label: "Update Project", shortcut: "⌘T", action: noop },
        { label: "Push…", shortcut: "⌘⇧K", action: noop },
        { sep: true },
        { label: "Git: Branches…", action: noop },
      ],
    },
    { label: "Window", items: [{ label: "Restore Default Layout", action: noop }] },
    {
      label: "Help",
      items: [
        { label: "Find Action…", shortcut: "⌘⇧A", action: noop },
        { label: "Keyboard Shortcuts", action: noop },
        { sep: true },
        { label: "About WebStorm", action: noop },
      ],
    },
  ];

  return (
    <div className="flex h-7 items-stretch bg-[#3c3f41] text-[12.5px] text-[#bbbbbb]">
      {/* menus */}
      <nav ref={navRef} className="flex items-stretch">
        {menus.map((m) => (
          <div key={m.label} className="relative">
            <button
              className={cn(
                "px-2 leading-7 outline-none transition-colors",
                open === m.label ? "bg-[#4b6eaf] text-white" : "hover:bg-[#464a4d]",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen((o) => (o === m.label ? null : m.label));
              }}
              onMouseEnter={() => open && setOpen(m.label)}
            >
              {m.label}
            </button>
            {open === m.label && (
              <div className="absolute left-0 top-7 z-50 min-w-[230px] rounded border border-black/40 bg-[#3c3f41] py-1 text-[12.5px] shadow-2xl shadow-black/50 fade-in">
                {m.items.map((it, i) =>
                  it.sep ? (
                    <div key={i} className="my-1 h-px bg-[#525557]" />
                  ) : (
                    <button
                      key={i}
                      disabled={it.disabled}
                      onClick={() => {
                        setOpen(null);
                        it.action?.();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-6 px-3 py-[3px] text-left",
                        it.disabled
                          ? "text-[#6f7377]"
                          : "text-[#cfcfcf] hover:bg-[#4b6eaf] hover:text-white",
                      )}
                    >
                      <span>{it.label}</span>
                      {it.shortcut && (
                        <span className="text-[11px] text-[#8b9094]">{it.shortcut}</span>
                      )}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* centered search pill */}
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={actions.onFind}
          className="flex items-center gap-2 rounded-md bg-[#2b2b2b] px-2.5 py-0.5 text-[12px] text-[#8b9094] hover:bg-[#313131]"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search Everywhere</span>
          <span className="rounded border border-[#555] px-1 text-[10px]">⇧⇧</span>
        </button>
      </div>
    </div>
  );
}
