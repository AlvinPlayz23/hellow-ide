import { useMemo, useState } from "react";
import { TopBar, type IdeActions } from "./ide/TopBar";
import { Toolbar } from "./ide/Toolbar";
import { FileTree } from "./ide/FileTree";
import { EditorArea } from "./ide/EditorArea";
import { BottomPanel, type BottomTab } from "./ide/BottomPanel";
import { StatusBar } from "./ide/StatusBar";
import { AiChat } from "./ide/AiChat";
import { ToolStrip, type StripItem } from "./ide/ToolStrip";
import { Cube, Commit, Bookmark, Sparkles } from "./ide/icons";
import { TREE, FILE_MAP, type DirNode } from "./ide/projectData";

const APP_ID = "root/src/App.tsx";

const LANG_LABEL: Record<string, string> = {
  tsx: "TypeScript JSX",
  ts: "TypeScript",
  css: "CSS",
  json: "JSON",
  html: "HTML",
  md: "Markdown",
  svg: "SVG",
  txt: "Text",
};

function collectExpanded(node: DirNode, acc: Set<string>) {
  if (node.expanded) {
    acc.add(node.id);
    for (const c of node.children) if (c.type === "dir") collectExpanded(c, acc);
  }
}

function ancestorsOf(id: string): string[] {
  const parts = id.split("/");
  const res: string[] = [];
  for (let i = 1; i < parts.length; i++) res.push(parts.slice(0, i).join("/"));
  return res;
}

function defaultCursor(id: string): number {
  const f = FILE_MAP[id];
  if (!f) return 1;
  const ls = f.content.split("\n");
  if (id === APP_ID) {
    const idx = ls.findIndex((l) => l.includes("FilterBar"));
    if (idx >= 0) return idx + 1;
  }
  return Math.min(9, Math.max(1, ls.length));
}


export default function App() {
  const initialExpanded = useMemo(() => {
    const acc = new Set<string>();
    collectExpanded(TREE, acc);
    ancestorsOf(APP_ID).forEach((a) => acc.add(a));
    return acc;
  }, []);

  const [openTabs, setOpenTabs] = useState<string[]>([APP_ID]);
  const [activeId, setActiveId] = useState<string>(APP_ID);
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);
  const [leftOpen, setLeftOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>("terminal");
  const [cursorLine, setCursorLine] = useState<number>(defaultCursor(APP_ID));

  const activeFile = FILE_MAP[activeId] ?? null;
  const tabs = openTabs.map((id) => FILE_MAP[id]).filter(Boolean);
  const fileCount = Object.keys(FILE_MAP).length;

  const openFile = (id: string) => {
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveId(id);
    setExpanded((prev) => {
      const n = new Set(prev);
      ancestorsOf(id).forEach((a) => n.add(a));
      return n;
    });
    setCursorLine(defaultCursor(id));
  };

  const activateTab = (id: string) => {
    setActiveId(id);
    setCursorLine(defaultCursor(id));
  };

  const closeTab = (id: string) => {
    const idx = openTabs.indexOf(id);
    const next = openTabs.filter((t) => t !== id);
    setOpenTabs(next);
    if (activeId === id) {
      const fallback = next[idx] ?? next[idx - 1] ?? next[next.length - 1] ?? null;
      if (fallback) {
        setActiveId(fallback);
        setCursorLine(defaultCursor(fallback));
      } else {
        setActiveId("");
      }
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const jumpTo = (fileId: string, line: number) => {
    openFile(fileId);
    setCursorLine(Math.max(1, line));
    setBottomOpen(true);
  };

  const actions: IdeActions = {
    onRun: () => {},
    onStop: () => {},
    onToggleProject: () => setLeftOpen((o) => !o),
    onToggleStructure: () => setAiOpen((o) => !o),
    onToggleBottom: (tab) => {
      if (tab) {
        setBottomOpen(true);
        setBottomTab(tab as BottomTab);
      } else {
        setBottomOpen((o) => !o);
      }
    },
    onFind: () => {
      setBottomOpen(true);
    },
  };

  const leftItems: StripItem[] = [
    { id: "project", icon: Cube, label: "Project (⌘1)", active: leftOpen, onClick: () => setLeftOpen((o) => !o) },
    { id: "commit", icon: Commit, label: "Commit (⌘0)", active: false, onClick: () => {} },
    { id: "bookmark", icon: Bookmark, label: "Bookmarks (⌘2)", active: false, onClick: () => {} },
  ];
  const rightItems: StripItem[] = [
    { id: "ai", icon: Sparkles, label: "AI Chat", active: aiOpen, onClick: () => setAiOpen((o) => !o) },
  ];

  const cursorCol = activeFile
    ? (activeFile.content.split("\n")[cursorLine - 1]?.length ?? 0) + 1
    : 1;

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#2b2b2b] text-[#c8c8c8]">
      <TopBar actions={actions} />
      <Toolbar running={false} onRun={() => {}} onStop={() => {}} />

      <div className="flex min-h-0 flex-1">
        <ToolStrip side="left" top={leftItems} />

        {leftOpen && (
          <div className="w-60 shrink-0 border-r border-black/40">
            <FileTree
              root={TREE}
              expanded={expanded}
              activeId={activeId}
              onToggle={toggleExpand}
              onOpen={openFile}
              fileCount={fileCount}
            />
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorArea
            tabs={tabs}
            activeFile={activeFile}
            cursorLine={cursorLine}
            onActivate={activateTab}
            onClose={closeTab}
            onLineClick={(line) => setCursorLine(Math.max(1, line))}
          />
          {bottomOpen && (
            <BottomPanel
              tab={bottomTab}
              onTab={setBottomTab}
              onClose={() => setBottomOpen(false)}
              onJump={jumpTo}
              errors={1}
              warnings={2}
            />
          )}
        </div>

        {aiOpen && <AiChat onClose={() => setAiOpen(false)} />}

        <ToolStrip side="right" top={rightItems} />
      </div>

      <StatusBar
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        langLabel={activeFile ? LANG_LABEL[activeFile.lang] ?? "Text" : "—"}
        running={false}
        errors={1}
        warnings={2}
      />
    </div>
  );
}
