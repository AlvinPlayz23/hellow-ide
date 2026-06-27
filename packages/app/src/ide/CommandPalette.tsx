import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Search } from "./icons";

export interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

interface Props {
  commands: PaletteCommand[];
  onClose: () => void;
}

export function CommandPalette({ commands, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const execute = useCallback((cmd: PaletteCommand) => {
    onClose();
    cmd.action();
  }, [onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd) execute(cmd);
      return;
    }
  }, [activeIdx, execute, filtered, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-[480px] overflow-hidden rounded-lg border border-[#464a4d] bg-[#3c3f41] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#464a4d] px-3">
          <Search className="h-4 w-4 shrink-0 text-[#9aa0a4]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command..."
            spellCheck={false}
            className="flex-1 border-none bg-transparent py-3 text-[13px] text-[#c8c8c8] outline-none placeholder:text-[#5a5d5f]"
          />
        </div>

        <div ref={listRef} className="scroll-jb max-h-[300px] overflow-auto py-1">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => execute(cmd)}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left text-[12.5px]",
                i === activeIdx ? "bg-[#2f5f8f] text-white" : "text-[#c8c8c8] hover:bg-[#464a4d]",
              )}
            >
              <span className="flex-1 truncate">{cmd.label}</span>
              {cmd.shortcut && (
                <span className="shrink-0 rounded border border-[#555] px-1.5 text-[10.5px] text-[#9aa0a4]">
                  {cmd.shortcut}
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-[12px] text-[#6f7377]">
              No matching commands
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
