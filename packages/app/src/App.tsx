import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "./ide/Toolbar";
import { FileTree } from "./ide/FileTree";
import { EditorArea } from "./ide/EditorArea";
import { BottomPanel, type BottomTab } from "./ide/BottomPanel";
import { StatusBar } from "./ide/StatusBar";
import { AiChat } from "./ide/AiChat";
import { ToolStrip, type StripItem } from "./ide/ToolStrip";
import { Cube, Commit, Bookmark, Sparkles } from "./ide/icons";
import { TREE, FILE_MAP, flattenFiles, type DirNode, type FileNode, type TreeNode } from "./ide/projectData";

const APP_ID = "root/src/App.tsx";

interface DirEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: DirEntry[];
}

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

const TEXT_EXTENSIONS = new Set([
  "css",
  "gitignore",
  "html",
  "js",
  "json",
  "jsx",
  "md",
  "mjs",
  "cjs",
  "svg",
  "ts",
  "tsx",
  "txt",
  "xml",
  "yaml",
  "yml",
]);

function collectExpanded(node: DirNode, acc: Set<string>) {
  if (node.expanded) {
    acc.add(node.id);
    for (const c of node.children) if (c.type === "dir") collectExpanded(c, acc);
  }
}

function ancestorsOf(id: string): string[] {
  const parts = id.split(/[\\/]/);
  const res: string[] = [];
  for (let i = 1; i < parts.length; i++) res.push(parts.slice(0, i).join("/"));
  return res;
}

function parentPathOf(id: string) {
  const idx = Math.max(id.lastIndexOf("/"), id.lastIndexOf("\\"));
  return idx > 0 ? id.slice(0, idx) : "";
}

function joinPath(base: string, name: string) {
  const separator = base.includes("\\") ? "\\" : "/";
  return `${base.replace(/[\\/]$/, "")}${separator}${name}`;
}

function findTreeNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  if (node.type === "file") return null;
  for (const child of node.children) {
    const found = findTreeNode(child, id);
    if (found) return found;
  }
  return null;
}

function extensionOf(name: string) {
  if (name === ".gitignore") return "gitignore";
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && ext !== name.toLowerCase() ? ext : "txt";
}

function languageOf(ext: string) {
  if (ext === "gitignore") return "txt";
  return ext;
}

function isLikelyTextFile(name: string) {
  return TEXT_EXTENSIONS.has(extensionOf(name));
}

function dirEntryToNode(entry: DirEntry): TreeNode | null {
  if (entry.type === "directory") {
    return {
      type: "dir",
      id: entry.path,
      name: entry.name,
      expanded: false,
      children: (entry.children ?? []).map(dirEntryToNode).filter((node): node is TreeNode => node !== null),
    };
  }

  if (!isLikelyTextFile(entry.name)) return null;

  const ext = extensionOf(entry.name);
  return {
    type: "file",
    id: entry.path,
    name: entry.name,
    ext,
    lang: languageOf(ext),
    content: "",
    loaded: false,
  };
}

function workspaceTreeFromEntries(folderPath: string, entries: DirEntry[]): DirNode {
  const name = folderPath.split(/[\\/]/).filter(Boolean).pop() ?? folderPath;
  return {
    type: "dir",
    id: folderPath,
    name,
    expanded: true,
    children: entries.map(dirEntryToNode).filter((node): node is TreeNode => node !== null),
  };
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

function cursorForFile(file: FileNode | null): number {
  if (!file) return 1;
  return Math.min(9, Math.max(1, file.content.split("\n").length));
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

function keyChord(event: KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  parts.push(key);
  return parts.join("+");
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
  const [running, setRunning] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [workspaceRoot, setWorkspaceRoot] = useState<DirNode>(TREE);
  const [fileMap, setFileMap] = useState<Record<string, FileNode>>(FILE_MAP);
  const toastTimer = useRef<number | null>(null);

  const activeFile = fileMap[activeId] ?? null;
  const tabs = openTabs.map((id) => fileMap[id]).filter(Boolean);
  const fileCount = Object.keys(fileMap).length;
  const isRealWorkspace = workspaceRoot.id !== TREE.id;

  const announce = useCallback((message: string) => {
    setActionToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setActionToast(null), 1300);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const openFile = useCallback(async (id: string) => {
    const file = fileMap[id];
    if (!file) return;

    if (file.loaded === false) {
      try {
        const content = await window.ide?.readFile?.(id);
        if (typeof content === "string") {
          setFileMap((current) => ({
            ...current,
            [id]: { ...current[id], content, loaded: true },
          }));
        }
      } catch {
        announce(`Could not open ${file.name}`);
        return;
      }
    }

    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveId(id);
    setExpanded((prev) => {
      const n = new Set(prev);
      ancestorsOf(id).forEach((a) => n.add(a));
      return n;
    });
    setCursorLine(cursorForFile(fileMap[id] ?? file));
  }, [announce, fileMap]);

  const activateTab = useCallback((id: string) => {
    setActiveId(id);
    setCursorLine(cursorForFile(fileMap[id] ?? null));
  }, [fileMap]);

  const closeTab = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const idx = prev.indexOf(id);
      const next = prev.filter((t) => t !== id);
      setActiveId((current) => {
        if (current !== id) return current;
        const fallback = next[idx] ?? next[idx - 1] ?? next[next.length - 1] ?? "";
        if (fallback) setCursorLine(cursorForFile(fileMap[fallback] ?? null));
        return fallback;
      });
      return next;
    });
  }, [fileMap]);

  const closeActiveTab = useCallback(() => {
    if (!activeId) return;
    closeTab(activeId);
    announce("Closed current tab");
  }, [activeId, announce, closeTab]);

  const saveActiveFile = useCallback(() => {
    if (!activeFile) {
      announce("No file to save");
      return;
    }
    const save = window.ide?.writeFile?.(activeFile.id, activeFile.content) ?? Promise.resolve();
    void save.then(
      () => {
        setFileMap((current) => ({
          ...current,
          [activeFile.id]: { ...current[activeFile.id], dirty: false },
        }));
        announce(`Saved ${activeFile.name}`);
      },
      () => announce(`Could not save ${activeFile.name}`),
    );
  }, [activeFile, announce]);

  const changeFileContent = useCallback((id: string, content: string) => {
    setFileMap((current) => {
      const file = current[id];
      if (!file) return current;
      return {
        ...current,
        [id]: { ...file, content, dirty: true, loaded: true },
      };
    });
  }, []);

  const loadWorkspace = useCallback(async (folder: string) => {
    const entries = await window.ide?.readDir?.(folder);
    if (!entries) throw new Error("No directory entries returned");
    const root = workspaceTreeFromEntries(folder, entries);
    const nextFileMap = flattenFiles(root);
    setWorkspaceRoot(root);
    setFileMap((current) => {
      const merged = { ...nextFileMap };
      for (const [id, file] of Object.entries(merged)) {
        const loaded = current[id];
        if (loaded?.loaded) merged[id] = loaded;
      }
      return merged;
    });
    setExpanded((prev) => new Set([folder, ...Array.from(prev).filter((id) => id.startsWith(folder))]));
    setOpenTabs((current) => current.filter((id) => nextFileMap[id]));
    setActiveId((current) => current && nextFileMap[current] ? current : "");
  }, []);

  const openFolder = useCallback(async () => {
    const folder = await window.ide?.openFolder?.();
    if (!folder) {
      announce("Open folder cancelled");
      return;
    }

    try {
      await loadWorkspace(folder);
      setOpenTabs([]);
      setActiveId("");
      setCursorLine(1);
      announce(`Opened folder: ${folder.split(/[\\/]/).filter(Boolean).pop() ?? folder}`);
    } catch {
      announce("Could not read folder");
    }
  }, [announce, loadWorkspace]);

  const refreshWorkspace = useCallback(async () => {
    if (!isRealWorkspace) {
      announce("Open a real folder first");
      return;
    }

    try {
      await loadWorkspace(workspaceRoot.id);
      announce("Project refreshed");
    } catch {
      announce("Could not refresh project");
    }
  }, [announce, isRealWorkspace, loadWorkspace, workspaceRoot.id]);

  const targetDirectory = useCallback(() => {
    if (!isRealWorkspace) return "";
    const activeNode = activeId ? findTreeNode(workspaceRoot, activeId) : null;
    if (activeNode?.type === "dir") return activeNode.id;
    if (activeNode?.type === "file") return parentPathOf(activeNode.id) || workspaceRoot.id;
    return workspaceRoot.id;
  }, [activeId, isRealWorkspace, workspaceRoot]);

  const createFile = useCallback(async () => {
    const directory = targetDirectory();
    if (!directory) {
      announce("Open a real folder first");
      return;
    }

    const name = window.prompt("New file name", "untitled.ts");
    if (!name?.trim()) return;
    const filePath = joinPath(directory, name.trim());

    try {
      await window.ide?.createFile?.(filePath, "");
      await loadWorkspace(workspaceRoot.id);
      setOpenTabs((prev) => (prev.includes(filePath) ? prev : [...prev, filePath]));
      setActiveId(filePath);
      setFileMap((current) => ({
        ...current,
        [filePath]: {
          type: "file",
          id: filePath,
          name: name.trim(),
          ext: extensionOf(name.trim()),
          lang: languageOf(extensionOf(name.trim())),
          content: "",
          loaded: true,
          dirty: false,
        },
      }));
      setCursorLine(1);
      announce(`Created ${name.trim()}`);
    } catch {
      announce(`Could not create ${name.trim()}`);
    }
  }, [announce, loadWorkspace, openFile, targetDirectory, workspaceRoot.id]);

  const createFolder = useCallback(async () => {
    const directory = targetDirectory();
    if (!directory) {
      announce("Open a real folder first");
      return;
    }

    const name = window.prompt("New folder name", "new-folder");
    if (!name?.trim()) return;
    const directoryPath = joinPath(directory, name.trim());

    try {
      await window.ide?.createDirectory?.(directoryPath);
      await loadWorkspace(workspaceRoot.id);
      setExpanded((prev) => new Set(prev).add(directoryPath));
      announce(`Created folder ${name.trim()}`);
    } catch {
      announce(`Could not create folder ${name.trim()}`);
    }
  }, [announce, loadWorkspace, targetDirectory, workspaceRoot.id]);

  const deleteActiveEntry = useCallback(async () => {
    if (!isRealWorkspace || !activeId) {
      announce("Select a real file or folder first");
      return;
    }

    const node = findTreeNode(workspaceRoot, activeId);
    if (!node) {
      announce("Select a file or folder first");
      return;
    }

    const ok = window.confirm(`Delete ${node.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      await window.ide?.deleteEntry?.(node.id);
      setOpenTabs((prev) => prev.filter((id) => id !== node.id && !id.startsWith(`${node.id}/`) && !id.startsWith(`${node.id}\\`)));
      setActiveId((current) => current === node.id || current.startsWith(`${node.id}/`) || current.startsWith(`${node.id}\\`) ? "" : current);
      await loadWorkspace(workspaceRoot.id);
      announce(`Deleted ${node.name}`);
    } catch {
      announce(`Could not delete ${node.name}`);
    }
  }, [activeId, announce, isRealWorkspace, loadWorkspace, workspaceRoot]);

  const activateRelativeTab = useCallback((delta: number) => {
    if (openTabs.length === 0) return;
    const current = Math.max(0, openTabs.indexOf(activeId));
    const next = openTabs[(current + delta + openTabs.length) % openTabs.length];
    if (next) activateTab(next);
  }, [activateTab, activeId, openTabs]);

  const toggleExpand = useCallback((id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    }), []);

  const jumpTo = useCallback((fileId: string, line: number) => {
    void openFile(fileId);
    setCursorLine(Math.max(1, line));
    setBottomOpen(true);
  }, [openFile]);

  const run = useCallback(() => {
    setRunning(true);
    setBottomOpen(true);
    setBottomTab("terminal");
    announce("Running active file");
  }, [announce]);

  const stop = useCallback(() => {
    setRunning(false);
    announce("Stopped");
  }, [announce]);

  const openFind = useCallback(() => {
    setBottomOpen(true);
    announce("Search Everywhere");
  }, [announce]);

  const toggleBottom = useCallback((tab?: BottomTab) => {
    if (tab) {
      setBottomOpen(true);
      setBottomTab(tab);
    } else {
      setBottomOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const chord = keyChord(event);
      const editable = isEditableTarget(event.target);

      if (editable && !["Ctrl+S", "Ctrl+O", "Ctrl+W", "Ctrl+Shift+P", "Ctrl+Shift+A", "Ctrl+J", "Alt+F12"].includes(chord)) {
        return;
      }

      const handled: Record<string, () => void> = {
        "Ctrl+S": saveActiveFile,
        "Ctrl+O": () => void openFolder(),
        "Ctrl+W": closeActiveTab,
        "Ctrl+B": () => setLeftOpen((o) => !o),
        "Ctrl+J": () => toggleBottom(),
        "Alt+F12": () => toggleBottom("terminal"),
        "Ctrl+6": () => toggleBottom("problems"),
        "Ctrl+Shift+P": openFind,
        "Ctrl+Shift+A": openFind,
        "Ctrl+E": () => activateRelativeTab(1),
        "Ctrl+Shift+E": () => activateRelativeTab(-1),
        "Ctrl+R": run,
        "Ctrl+D": run,
        "Ctrl+F2": stop,
        "Escape": () => setActionToast(null),
      };

      const handler = handled[chord];
      if (!handler) return;
      event.preventDefault();
      handler();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activateRelativeTab, closeActiveTab, openFind, openFolder, run, saveActiveFile, stop, toggleBottom]);

  useEffect(() => {
    return window.ide?.onMenuAction?.((action) => {
      switch (action) {
        case "open-folder":
          void openFolder();
          break;
        case "save":
          saveActiveFile();
          break;
        case "close-tab":
          closeActiveTab();
          break;
        case "find":
        case "find-in-files":
          openFind();
          break;
        case "toggle-project":
          setLeftOpen((o) => !o);
          break;
        case "toggle-structure":
          setAiOpen((o) => !o);
          break;
        case "toggle-terminal":
          toggleBottom("terminal");
          break;
        case "toggle-problems":
          toggleBottom("problems");
          break;
        case "run":
          run();
          break;
        case "stop":
          stop();
          break;
      }
    });
  }, [closeActiveTab, openFind, openFolder, run, saveActiveFile, stop, toggleBottom]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setRunning(false), 1800);
    return () => window.clearTimeout(timer);
  }, [running]);

  useEffect(() => {
    if (cursorLine < 1) setCursorLine(1);
  }, [cursorLine]);

  useEffect(() => {
    const selectedNode = activeId ? findTreeNode(workspaceRoot, activeId) : null;
    if (!selectedNode && !activeFile && openTabs[0]) {
      setActiveId(openTabs[0]);
    }
  }, [activeFile, activeId, openTabs, workspaceRoot]);

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
      <Toolbar running={running} onRun={run} onStop={stop} onFind={openFind} onOpenFolder={() => void openFolder()} />

      {actionToast && (
        <div className="pointer-events-none fixed left-1/2 top-12 z-50 -translate-x-1/2 rounded-md border border-black/40 bg-[#3c3f41] px-3 py-2 text-[12px] text-[#dcdcdc] shadow-2xl shadow-black/40">
          {actionToast}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <ToolStrip side="left" top={leftItems} />

        {leftOpen && (
          <div className="w-60 shrink-0 border-r border-black/40">
            <FileTree
              root={workspaceRoot}
              expanded={expanded}
              activeId={activeId}
              onToggle={toggleExpand}
              onOpen={(id) => void openFile(id)}
              onSelect={setActiveId}
              onOpenFolder={() => void openFolder()}
              onRefresh={() => void refreshWorkspace()}
              onCreateFile={() => void createFile()}
              onCreateFolder={() => void createFolder()}
              onDeleteActive={() => void deleteActiveEntry()}
              fileCount={fileCount}
              isRealWorkspace={isRealWorkspace}
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
            onChange={changeFileContent}
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
        langLabel={activeFile ? `${LANG_LABEL[activeFile.lang] ?? "Text"}${activeFile.dirty ? " • Modified" : ""}` : "—"}
        running={running}
        errors={1}
        warnings={2}
      />
    </div>
  );
}
