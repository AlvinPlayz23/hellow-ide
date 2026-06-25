import { Fragment, useMemo } from "react";
import { cn } from "../utils/cn";
import { getStructure } from "./highlight";
import { FileBadge, ChevronRight, Folder, FolderOpen, Close } from "./icons";
import type { FileNode } from "./projectData";

const APP_ID = "root/src/App.tsx";

interface CodeProps {
  file: FileNode;
  cursorLine: number;
  onLineClick: (line: number) => void;
  onChange: (content: string) => void;
}

function CodeView({ file, cursorLine, onLineClick, onChange }: CodeProps) {
  const rawLines = useMemo(() => file.content.split("\n"), [file.content]);

  return (
    <div className="scroll-jb relative min-h-0 flex-1 overflow-auto bg-[#2b2b2b] font-mono-jb text-[13px] leading-[21px]">
      <div className="flex min-h-full min-w-max pb-[35vh]">
        <div className="sticky left-0 z-10 select-none border-r border-black/30 bg-[#313335] py-0 text-right text-[#868686]" style={{ minWidth: 58 }}>
          {rawLines.map((_line, idx) => {
          const active = idx === cursorLine - 1;
          return (
              <button
                key={idx}
                onClick={() => onLineClick(idx + 1)}
                className={cn("block h-[21px] w-full pl-3 pr-2 text-right", active && "bg-[#3a3a3a] text-[#c9c9c9]")}
              >
                {idx + 1}
              </button>
          );
        })}
        </div>
        <textarea
          value={file.content}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => {
            const target = event.currentTarget;
            const line = target.value.slice(0, target.selectionStart).split("\n").length;
            onLineClick(line);
          }}
          onKeyUp={(event) => {
            const target = event.currentTarget;
            const line = target.value.slice(0, target.selectionStart).split("\n").length;
            onLineClick(line);
          }}
          className="min-h-full min-w-[900px] flex-1 resize-none border-0 bg-[#2b2b2b] px-3 py-0 font-mono-jb text-[13px] leading-[21px] text-[#c8c8c8] outline-none selection:bg-[#214283]"
        />
      </div>
    </div>
  );
}

function MarkerBar({ file }: { file: FileNode }) {
  const ls = file.content.split("\n");
  const total = Math.max(1, ls.length);
  const ticks: { top: number; color: string }[] = [];
  if (file.id === APP_ID) {
    const idx = ls.findIndex((l) => l.includes("FilterBar"));
    const errLine = idx >= 0 ? idx + 1 : 44;
    ticks.push({ top: (errLine / total) * 100, color: "#c7551b" });
    ticks.push({ top: (13 / total) * 100, color: "#caa53a" });
  } else {
    ticks.push({ top: 0.3, color: "#caa53a" });
  }
  return (
    <div className="pointer-events-none absolute right-[13px] top-0 z-20 h-full w-3">
      <div className="absolute inset-y-0 right-0 w-px bg-white/[0.06]" />
      {ticks.map((t, i) => (
        <span
          key={i}
          className="absolute right-0 h-[3px] w-3 rounded-sm"
          style={{ top: `${t.top}%`, background: t.color }}
        />
      ))}
    </div>
  );
}

function TabBar({
  tabs,
  activeId,
  onActivate,
  onClose,
}: {
  tabs: FileNode[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
}) {
  return (
    <div className="scroll-jb flex h-[30px] shrink-0 items-stretch overflow-x-auto whitespace-nowrap bg-[#36393b]">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <div
            key={t.id}
            onClick={() => onActivate(t.id)}
            className={cn(
              "group relative flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-black/30 pl-2.5 pr-2 text-[12.5px]",
              active ? "bg-[#2b2b2b] text-[#e6e6e6]" : "bg-[#36393b] text-[#9aa0a4] hover:bg-[#3c3f41]",
            )}
          >
            {active && <span className="absolute left-0 top-0 h-[2px] w-full bg-[#4d78b8]" />}
            <FileBadge ext={t.ext} />
            <span className="max-w-[150px] truncate">{t.name}</span>
            {t.dirty && <span className="h-1.5 w-1.5 rounded-full bg-[#8bb3dd]" title="Unsaved changes" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(t.id);
              }}
              className={cn(
                "grid h-4 w-4 place-items-center rounded hover:bg-[#4a4d50]",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Close className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Breadcrumb({ file }: { file: FileNode }) {
  const segs = file.id.split("/").slice(1);
  const symbol = getStructure(file.content)[0]?.name;
  return (
    <div className="flex h-[24px] shrink-0 items-center gap-1 border-b border-black/30 bg-[#323232] px-3 text-[12px] text-[#9aa0a4]">
      <FolderOpen className="h-3.5 w-3.5 text-[#c9a45c]" />
      <span className="text-[#c8c8c8]">taskflow</span>
      {segs.map((s, i) => {
        const last = i === segs.length - 1;
        return (
          <Fragment key={i}>
            <ChevronRight className="h-3 w-3 text-[#5a5d5f]" />
            {last ? (
              <span className="flex items-center gap-1 text-[#c8c8c8]">
                <FileBadge ext={file.ext} />
                {file.name}
              </span>
            ) : (
              <span className="text-[#9aa0a4]">{s}</span>
            )}
          </Fragment>
        );
      })}
      {symbol && (
        <>
          <ChevronRight className="h-3 w-3 text-[#5a5d5f]" />
          <span className="text-[#ffc66d]">{symbol}</span>
        </>
      )}
    </div>
  );
}

export interface EditorAreaProps {
  tabs: FileNode[];
  activeFile: FileNode | null;
  cursorLine: number;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onLineClick: (line: number) => void;
  onChange: (id: string, content: string) => void;
}

export function EditorArea({ tabs, activeFile, cursorLine, onActivate, onClose, onLineClick, onChange }: EditorAreaProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#2b2b2b]">
      <TabBar tabs={tabs} activeId={activeFile?.id ?? null} onActivate={onActivate} onClose={onClose} />
      {activeFile ? (
        <>
          <Breadcrumb file={activeFile} />
          <div className="relative flex min-h-0 flex-1">
            <CodeView file={activeFile} cursorLine={cursorLine} onLineClick={onLineClick} onChange={(content) => onChange(activeFile.id, content)} />
            <MarkerBar file={activeFile} />
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-[#2b2b2b] text-[#6f7377]">
          <div className="text-center">
            <Folder className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No file is open</p>
          </div>
        </div>
      )}
    </div>
  );
}
