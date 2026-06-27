import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "./ide/Toolbar";
import { FileTree } from "./ide/FileTree";
import { EditorArea } from "./ide/EditorArea";
import { BottomPanel, type BottomTab } from "./ide/BottomPanel";
import { StatusBar } from "./ide/StatusBar";
import { AiChat } from "./ide/AiChat";
import { CommandPalette } from "./ide/CommandPalette";
import { InputModal, ConfirmModal, UnsavedChangesModal } from "./ide/InputModal";
import { ToolStrip, type StripItem } from "./ide/ToolStrip";
import { Cube, Commit, Bookmark, Sparkles, Folder } from "./ide/icons";
import { flattenFiles, type DirNode, type FileNode, type TreeNode } from "./ide/projectData";

const LS_PREFIX = "hellow:";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch { /* noop */ }
}

interface DirEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: DirEntry[];
}

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;

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
  const skippedReason = entry.size && entry.size > MAX_TEXT_FILE_BYTES ? "File is too large to open" : undefined;
  return {
    type: "file",
    id: entry.path,
    name: entry.name,
    ext,
    lang: languageOf(ext),
    content: "",
    loaded: false,
    size: entry.size,
    skippedReason,
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
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [leftOpen, setLeftOpen] = useState(() => lsGet("leftOpen", true));
  const [aiOpen, setAiOpen] = useState(() => lsGet("aiOpen", true));
  const [bottomOpen, setBottomOpen] = useState(() => lsGet("bottomOpen", true));
  const [bottomTab, setBottomTab] = useState<BottomTab>(() => lsGet("bottomTab", "terminal"));
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [running, setRunning] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [workspaceRoot, setWorkspaceRoot] = useState<DirNode | null>(null);
  const [fileMap, setFileMap] = useState<Record<string, FileNode>>({});
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>([]);
  const toastTimer = useRef<number | null>(null);
  const shiftTapTimer = useRef<number | null>(null);

  const [inputModal, setInputModal] = useState<{ title: string; defaultValue: string; placeholder?: string; onConfirm: (v: string) => void } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);

  const activeFile = activeId ? fileMap[activeId] ?? null : null;
  const tabs = openTabs.map((id) => fileMap[id]).filter(Boolean);
  const fileCount = Object.keys(fileMap).length;
  const isRealWorkspace = workspaceRoot !== null;
  const dirtyFiles = useMemo(() => Object.values(fileMap).filter((file) => file.dirty), [fileMap]);
  const dirtyCount = dirtyFiles.length;

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

  /* layout persistence */
  useEffect(() => { lsSet("leftOpen", leftOpen); }, [leftOpen]);
  useEffect(() => { lsSet("aiOpen", aiOpen); }, [aiOpen]);
  useEffect(() => { lsSet("bottomOpen", bottomOpen); }, [bottomOpen]);
  useEffect(() => { lsSet("bottomTab", bottomTab); }, [bottomTab]);

  const refreshRecentWorkspaces = useCallback(() => {
    void window.ide?.getRecentWorkspaces?.().then(setRecentWorkspaces, () => setRecentWorkspaces([]));
  }, []);

  useEffect(() => {
    refreshRecentWorkspaces();
  }, [refreshRecentWorkspaces]);

  const openFile = useCallback(async (id: string) => {
    const file = fileMap[id];
    if (!file) return;

    if (file.skippedReason) {
      announce(`${file.name}: ${file.skippedReason}`);
      return;
    }

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
    setCursorLine(1);
    setCursorCol(1);
  }, [announce, fileMap]);

  const activateTab = useCallback((id: string) => {
    setActiveId(id);
    setCursorLine(1);
    setCursorCol(1);
  }, []);

  const closeTabDirect = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const idx = prev.indexOf(id);
      const next = prev.filter((t) => t !== id);
      setActiveId((current) => {
        if (current !== id) return current;
        const fallback = next[idx] ?? next[idx - 1] ?? next[next.length - 1] ?? "";
        if (fallback) { setCursorLine(1); setCursorCol(1); }
        return fallback;
      });
      return next;
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    const file = fileMap[id];
    if (file?.dirty) {
      setPendingCloseId(id);
      return;
    }
    closeTabDirect(id);
  }, [closeTabDirect, fileMap]);

  const closeActiveTab = useCallback(() => {
    if (!activeId) return;
    closeTab(activeId);
  }, [activeId, announce, closeTab]);

  const saveFile = useCallback(async (file: FileNode) => {
    await (window.ide?.writeFile?.(file.id, file.content) ?? Promise.resolve());
    setFileMap((current) => ({
      ...current,
      [file.id]: { ...current[file.id], dirty: false },
    }));
  }, []);

  const saveActiveFile = useCallback(() => {
    if (!activeFile) {
      announce("No file to save");
      return;
    }
    void saveFile(activeFile).then(
      () => announce(`Saved ${activeFile.name}`),
      () => announce(`Could not save ${activeFile.name}`),
    );
  }, [activeFile, announce, saveFile]);

  const saveAllFiles = useCallback(() => {
    if (dirtyFiles.length === 0) {
      announce("No unsaved files");
      return;
    }

    void Promise.all(dirtyFiles.map(saveFile)).then(
      () => announce(`Saved ${dirtyFiles.length} file${dirtyFiles.length === 1 ? "" : "s"}`),
      () => announce("Could not save all files"),
    );
  }, [announce, dirtyFiles, saveFile]);

  const saveAndClosePendingTab = useCallback(() => {
    if (!pendingCloseId) return;
    const file = fileMap[pendingCloseId];
    if (!file) {
      setPendingCloseId(null);
      return;
    }

    void saveFile(file).then(
      () => {
        closeTabDirect(file.id);
        setPendingCloseId(null);
        announce(`Saved ${file.name}`);
      },
      () => announce(`Could not save ${file.name}`),
    );
  }, [announce, closeTabDirect, fileMap, pendingCloseId, saveFile]);

  const discardAndClosePendingTab = useCallback(() => {
    if (!pendingCloseId) return;
    closeTabDirect(pendingCloseId);
    setFileMap((current) => current[pendingCloseId] ? {
      ...current,
      [pendingCloseId]: { ...current[pendingCloseId], dirty: false },
    } : current);
    setPendingCloseId(null);
  }, [closeTabDirect, pendingCloseId]);

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
    await window.ide?.addRecentWorkspace?.(folder);
    refreshRecentWorkspaces();
  }, [refreshRecentWorkspaces]);

  const openFolderAction = useCallback(async () => {
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
      setCursorCol(1);
      announce(`Opened folder: ${folder.split(/[\\/]/).filter(Boolean).pop() ?? folder}`);
    } catch {
      announce("Could not read folder");
    }
  }, [announce, loadWorkspace]);

  const refreshWorkspace = useCallback(async () => {
    if (!isRealWorkspace || !workspaceRoot) {
      announce("Open a real folder first");
      return;
    }

    try {
      await loadWorkspace(workspaceRoot.id);
      announce("Project refreshed");
    } catch {
      announce("Could not refresh project");
    }
  }, [announce, isRealWorkspace, loadWorkspace, workspaceRoot]);

  const openRecentWorkspace = useCallback(async (workspacePath: string) => {
    try {
      await loadWorkspace(workspacePath);
      setOpenTabs([]);
      setActiveId("");
      setCursorLine(1);
      setCursorCol(1);
      announce(`Opened folder: ${workspacePath.split(/[\\/]/).filter(Boolean).pop() ?? workspacePath}`);
    } catch {
      announce("Could not open recent workspace");
    }
  }, [announce, loadWorkspace]);

  const reloadActiveFileFromDisk = useCallback(() => {
    if (!activeFile) {
      announce("No file to reload");
      return;
    }

    const reload = async () => {
      try {
        const content = await window.ide?.readFile?.(activeFile.id);
        if (typeof content !== "string") throw new Error("No content returned");
        setFileMap((current) => ({
          ...current,
          [activeFile.id]: { ...current[activeFile.id], content, dirty: false, loaded: true },
        }));
        announce(`Reloaded ${activeFile.name}`);
      } catch {
        announce(`Could not reload ${activeFile.name}`);
      }
    };

    if (activeFile.dirty) {
      setConfirmModal({
        title: "Reload from Disk",
        message: `Discard unsaved changes and reload ${activeFile.name} from disk?`,
        onConfirm: () => {
          setConfirmModal(null);
          void reload();
        },
      });
      return;
    }

    void reload();
  }, [activeFile, announce]);

  const targetDirectory = useCallback(() => {
    if (!isRealWorkspace || !workspaceRoot) return "";
    const activeNode = activeId ? findTreeNode(workspaceRoot, activeId) : null;
    if (activeNode?.type === "dir") return activeNode.id;
    if (activeNode?.type === "file") return parentPathOf(activeNode.id) || workspaceRoot.id;
    return workspaceRoot.id;
  }, [activeId, isRealWorkspace, workspaceRoot]);

  const createFileAction = useCallback(() => {
    const directory = targetDirectory();
    if (!directory || !workspaceRoot) {
      announce("Open a real folder first");
      return;
    }

    setInputModal({
      title: "New File",
      defaultValue: "untitled.ts",
      placeholder: "Enter file name...",
      onConfirm: async (name: string) => {
        setInputModal(null);
        const filePath = joinPath(directory, name);
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
              name,
              ext: extensionOf(name),
              lang: languageOf(extensionOf(name)),
              content: "",
              loaded: true,
              dirty: false,
            },
          }));
          setCursorLine(1);
          setCursorCol(1);
          announce(`Created ${name}`);
        } catch {
          announce(`Could not create ${name}`);
        }
      },
    });
  }, [announce, loadWorkspace, targetDirectory, workspaceRoot]);

  const createFolderAction = useCallback(() => {
    const directory = targetDirectory();
    if (!directory || !workspaceRoot) {
      announce("Open a real folder first");
      return;
    }

    setInputModal({
      title: "New Folder",
      defaultValue: "new-folder",
      placeholder: "Enter folder name...",
      onConfirm: async (name: string) => {
        setInputModal(null);
        const directoryPath = joinPath(directory, name);
        try {
          await window.ide?.createDirectory?.(directoryPath);
          await loadWorkspace(workspaceRoot.id);
          setExpanded((prev) => new Set(prev).add(directoryPath));
          announce(`Created folder ${name}`);
        } catch {
          announce(`Could not create folder ${name}`);
        }
      },
    });
  }, [announce, loadWorkspace, targetDirectory, workspaceRoot]);

  const deleteActiveEntry = useCallback(() => {
    if (!isRealWorkspace || !activeId || !workspaceRoot) {
      announce("Select a real file or folder first");
      return;
    }

    const node = findTreeNode(workspaceRoot, activeId);
    if (!node) {
      announce("Select a file or folder first");
      return;
    }

    const affectedDirtyFiles = Object.values(fileMap).filter((file) =>
      file.dirty && (file.id === node.id || file.id.startsWith(`${node.id}/`) || file.id.startsWith(`${node.id}\\`)),
    );

    setConfirmModal({
      title: "Delete",
      message: affectedDirtyFiles.length > 0
        ? `Delete ${node.name}? This will discard ${affectedDirtyFiles.length} unsaved file${affectedDirtyFiles.length === 1 ? "" : "s"}. This cannot be undone.`
        : `Delete ${node.name}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await window.ide?.deleteEntry?.(node.id);
          setOpenTabs((prev) => prev.filter((id) => id !== node.id && !id.startsWith(`${node.id}/`) && !id.startsWith(`${node.id}\\`)));
          setActiveId((current) => current === node.id || current.startsWith(`${node.id}/`) || current.startsWith(`${node.id}\\`) ? "" : current);
          await loadWorkspace(workspaceRoot.id);
          announce(`Deleted ${node.name}`);
        } catch {
          announce(`Could not delete ${node.name}`);
        }
      },
    });
  }, [activeId, announce, fileMap, isRealWorkspace, loadWorkspace, workspaceRoot]);

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
    setCursorCol(1);
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
    setCommandPaletteOpen(true);
  }, []);

  const toggleBottom = useCallback((tab?: BottomTab) => {
    if (tab) {
      setBottomOpen(true);
      setBottomTab(tab);
    } else {
      setBottomOpen((o) => !o);
    }
  }, []);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  const commandActions = useMemo(() => {
    const items: { id: string; label: string; shortcut?: string; action: () => void }[] = [
      { id: "open-folder", label: "Open Folder", shortcut: "Ctrl+O", action: () => { closeCommandPalette(); void openFolderAction(); } },
      { id: "new-file", label: "New File", shortcut: "Ctrl+N", action: () => { closeCommandPalette(); void createFileAction(); } },
      { id: "new-folder", label: "New Folder", action: () => { closeCommandPalette(); void createFolderAction(); } },
      { id: "save", label: "Save", shortcut: "Ctrl+S", action: () => { closeCommandPalette(); saveActiveFile(); } },
      { id: "save-all", label: "Save All", shortcut: "Ctrl+Shift+S", action: () => { closeCommandPalette(); saveAllFiles(); } },
      { id: "reload-from-disk", label: "Reload Active File from Disk", shortcut: "Ctrl+Alt+R", action: () => { closeCommandPalette(); reloadActiveFileFromDisk(); } },
      { id: "close-tab", label: "Close Tab", shortcut: "Ctrl+W", action: () => { closeCommandPalette(); closeActiveTab(); } },
      { id: "toggle-sidebar", label: "Toggle Project Panel", shortcut: "Ctrl+B", action: () => { closeCommandPalette(); setLeftOpen((o) => !o); } },
      { id: "toggle-ai", label: "Toggle AI Chat", action: () => { closeCommandPalette(); setAiOpen((o) => !o); } },
      { id: "toggle-terminal", label: "Toggle Terminal", shortcut: "Alt+F12", action: () => { closeCommandPalette(); toggleBottom("terminal"); } },
      { id: "toggle-problems", label: "Toggle Problems", shortcut: "Ctrl+6", action: () => { closeCommandPalette(); toggleBottom("problems"); } },
      { id: "next-tab", label: "Next Tab", shortcut: "Ctrl+E", action: () => { closeCommandPalette(); activateRelativeTab(1); } },
      { id: "prev-tab", label: "Previous Tab", shortcut: "Ctrl+Shift+E", action: () => { closeCommandPalette(); activateRelativeTab(-1); } },
      { id: "run", label: "Run Active File", shortcut: "Ctrl+R", action: () => { closeCommandPalette(); run(); } },
      { id: "stop", label: "Stop", shortcut: "Ctrl+F2", action: () => { closeCommandPalette(); stop(); } },
      { id: "refresh-project", label: "Refresh Project", action: () => { closeCommandPalette(); void refreshWorkspace(); } },
      ...recentWorkspaces.map((workspacePath) => ({
        id: `recent-${workspacePath}`,
        label: `Open Recent: ${workspacePath.split(/[\\/]/).filter(Boolean).pop() ?? workspacePath}`,
        shortcut: undefined,
        action: () => { closeCommandPalette(); void openRecentWorkspace(workspacePath); },
      })),
    ];
    return items;
  }, [activateRelativeTab, closeActiveTab, closeCommandPalette, createFileAction, createFolderAction, openFolderAction, openRecentWorkspace, recentWorkspaces, refreshWorkspace, reloadActiveFileFromDisk, run, saveActiveFile, saveAllFiles, stop, toggleBottom]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (commandPaletteOpen) return;

      const chord = keyChord(event);
      const editable = isEditableTarget(event.target);

      if (editable && !["Ctrl+S", "Ctrl+Shift+S", "Ctrl+Alt+R", "Ctrl+O", "Ctrl+N", "Ctrl+W", "Ctrl+Shift+P", "Ctrl+Shift+A", "Ctrl+J", "Alt+F12"].includes(chord)) {
        return;
      }

      /* double-shift for command palette */
      if (event.key === "Shift" && !editable) {
        if (shiftTapTimer.current) {
          window.clearTimeout(shiftTapTimer.current);
          shiftTapTimer.current = null;
          event.preventDefault();
          setCommandPaletteOpen(true);
          return;
        }
        shiftTapTimer.current = window.setTimeout(() => { shiftTapTimer.current = null; }, 400);
      }

      const handled: Record<string, () => void> = {
        "Ctrl+S": saveActiveFile,
        "Ctrl+Shift+S": saveAllFiles,
        "Ctrl+Alt+R": reloadActiveFileFromDisk,
        "Ctrl+O": () => void openFolderAction(),
        "Ctrl+N": () => void createFileAction(),
        "Ctrl+W": closeActiveTab,
        "Ctrl+B": () => setLeftOpen((o) => !o),
        "Ctrl+J": () => toggleBottom(),
        "Alt+F12": () => toggleBottom("terminal"),
        "Ctrl+6": () => toggleBottom("problems"),
        "Ctrl+Shift+P": openCommandPalette,
        "Ctrl+Shift+A": openCommandPalette,
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
  }, [activateRelativeTab, closeActiveTab, openCommandPalette, openFolderAction, createFileAction, reloadActiveFileFromDisk, run, saveActiveFile, saveAllFiles, stop, toggleBottom, commandPaletteOpen]);

  useEffect(() => {
    return window.ide?.onMenuAction?.((action) => {
      switch (action) {
        case "open-folder":
          void openFolderAction();
          break;
        case "new-file":
          void createFileAction();
          break;
        case "new-folder":
          void createFolderAction();
          break;
        case "save":
          saveActiveFile();
          break;
        case "save-all":
          saveAllFiles();
          break;
        case "reload-from-disk":
          reloadActiveFileFromDisk();
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
  }, [closeActiveTab, createFileAction, createFolderAction, openFind, openFolderAction, reloadActiveFileFromDisk, run, saveActiveFile, saveAllFiles, stop, toggleBottom]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setRunning(false), 1800);
    return () => window.clearTimeout(timer);
  }, [running]);

  useEffect(() => {
    if (cursorLine < 1) setCursorLine(1);
  }, [cursorLine]);

  useEffect(() => {
    if (activeId && !fileMap[activeId] && openTabs[0]) {
      setActiveId(openTabs[0]);
    }
  }, [activeId, fileMap, openTabs]);

  const leftItems: StripItem[] = [
    { id: "project", icon: Cube, label: "Project (⌘1)", active: leftOpen, onClick: () => setLeftOpen((o) => !o) },
    { id: "commit", icon: Commit, label: "Commit (⌘0)", active: false, onClick: () => {} },
    { id: "bookmark", icon: Bookmark, label: "Bookmarks (⌘2)", active: false, onClick: () => {} },
  ];
  const rightItems: StripItem[] = [
    { id: "ai", icon: Sparkles, label: "AI Chat", active: aiOpen, onClick: () => setAiOpen((o) => !o) },
  ];

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#2b2b2b] text-[#c8c8c8]">
      <Toolbar
        running={running}
        onRun={run}
        onStop={stop}
        onFind={openFind}
        onOpenFolder={() => void openFolderAction()}
        onCreateFile={() => void createFileAction()}
        onCreateFolder={() => void createFolderAction()}
        isRealWorkspace={isRealWorkspace}
      />

      {actionToast && (
        <div className="pointer-events-none fixed left-1/2 top-12 z-50 -translate-x-1/2 rounded-md border border-black/40 bg-[#3c3f41] px-3 py-2 text-[12px] text-[#dcdcdc] shadow-2xl shadow-black/40">
          {actionToast}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <ToolStrip side="left" top={leftItems} />

        {leftOpen && (
          <div className="w-60 shrink-0 border-r border-black/40">
            {workspaceRoot ? (
              <FileTree
                root={workspaceRoot}
                expanded={expanded}
                activeId={activeId}
                onToggle={toggleExpand}
                onOpen={(id) => void openFile(id)}
                onSelect={setActiveId}
                onOpenFolder={() => void openFolderAction()}
                onRefresh={() => void refreshWorkspace()}
                onCreateFile={() => void createFileAction()}
                onCreateFolder={() => void createFolderAction()}
                onDeleteActive={() => void deleteActiveEntry()}
                fileCount={fileCount}
                isRealWorkspace={isRealWorkspace}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#3c3f41] px-4 text-center text-[12px] text-[#6f7377]">
                <Folder className="h-10 w-10 opacity-30" />
                <p>No folder is open</p>
                <button
                  onClick={() => void openFolderAction()}
                  className="rounded bg-[#4a6e9e] px-3 py-1 text-white hover:bg-[#5b7faf]"
                >
                  Open Folder
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorArea
            tabs={tabs}
            activeFile={activeFile}
            cursorLine={cursorLine}
            cursorCol={cursorCol}
            onActivate={activateTab}
            onClose={closeTab}
            onCursorChange={(line, col) => { setCursorLine(line); setCursorCol(col); }}
            onChange={changeFileContent}
          />
          {bottomOpen && (
            <BottomPanel
              tab={bottomTab}
              onTab={setBottomTab}
              onClose={() => setBottomOpen(false)}
              onJump={jumpTo}
              errors={0}
              warnings={0}
              cwd={workspaceRoot?.id}
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
        errors={0}
        warnings={0}
        dirtyCount={dirtyCount}
      />

      {commandPaletteOpen && (
        <CommandPalette
          commands={commandActions}
          onClose={closeCommandPalette}
        />
      )}

      {inputModal && (
        <InputModal
          title={inputModal.title}
          defaultValue={inputModal.defaultValue}
          placeholder={inputModal.placeholder}
          onConfirm={inputModal.onConfirm}
          onCancel={() => setInputModal(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {pendingCloseId && fileMap[pendingCloseId] && (
        <UnsavedChangesModal
          fileName={fileMap[pendingCloseId].name}
          onSave={saveAndClosePendingTab}
          onDiscard={discardAndClosePendingTab}
          onCancel={() => setPendingCloseId(null)}
        />
      )}
    </div>
  );
}
