import { cn } from "../utils/cn";
import { getStructure, type StructureItem } from "./highlight";
import { Search, Close } from "./icons";
import type { FileNode } from "./projectData";

const glyph: Record<StructureItem["kind"], { ch: string; color: string }> = {
  function: { ch: "ƒ", color: "#ffc66d" },
  const: { ch: "v", color: "#86c272" },
  interface: { ch: "I", color: "#6897bb" },
  type: { ch: "T", color: "#6897bb" },
  class: { ch: "C", color: "#e8bf6a" },
  var: { ch: "v", color: "#86c272" },
};

interface Props {
  file: FileNode;
  onJump: (line: number) => void;
  onClose: () => void;
}

export function StructurePanel({ file, onJump, onClose }: Props) {
  const items = getStructure(file.content);
  return (
    <div className="flex h-full w-56 flex-col bg-[#3c3f41]">
      <div className="flex h-[26px] shrink-0 items-center px-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa0a4]">
        <span>Structure</span>
        <div className="flex-1" />
        <button className="grid h-5 w-5 place-items-center rounded hover:bg-[#464a4d]">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button onClick={onClose} className="grid h-5 w-5 place-items-center rounded hover:bg-[#464a4d]">
          <Close className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-2 pb-1 text-[12px] text-[#c8c8c8]">
        <FileBadgeMini ext={file.ext} />
        <span className="truncate text-[#dcdcdc]">{file.name}</span>
      </div>

      <div className="scroll-jb min-h-0 flex-1 overflow-auto py-1 text-[12.5px]">
        {items.map((it) => {
          const g = glyph[it.kind];
          return (
            <button
              key={it.line}
              onClick={() => onJump(it.line)}
              className="flex w-full items-center gap-2 px-3 py-[3px] hover:bg-[#3a3d3f]"
            >
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded-[3px] text-[9px] font-bold"
                style={{ color: g.color, border: `1px solid ${g.color}55` }}
              >
                {g.ch}
              </span>
              <span className={cn("truncate text-[#c8c8c8]", it.kind === "const" && "italic")}>
                {it.name}
              </span>
              <span className="ml-auto text-[10px] text-[#6f7377]">{it.line}</span>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="px-3 py-2 text-[12px] text-[#6f7377]">No declarations found.</div>
        )}
      </div>

      <div className="flex h-7 shrink-0 items-center border-t border-black/30 px-2 text-[11px] text-[#9aa0a4]">
        {items.length} members
      </div>
    </div>
  );
}

function FileBadgeMini({ ext }: { ext: string }) {
  const colors: Record<string, string> = {
    tsx: "#3178c6",
    ts: "#3178c6",
    css: "#42a5f5",
    json: "#b7b73b",
    md: "#519aba",
    html: "#e44d26",
  };
  const letters: Record<string, string> = { tsx: "TS", ts: "TS", css: "#", json: "{}", md: "M↓", html: "<>" };
  return (
    <span
      className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[3px] text-[8px] font-bold text-white"
      style={{ background: colors[ext] ?? "#8a8a8a" }}
    >
      {letters[ext] ?? "?"}
    </span>
  );
}
