import { cn } from "../utils/cn";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileBadge, Search, Sync, Gear, Plus, Close } from "./icons";
import type { DirNode, FileNode, TreeNode, VcsStatus } from "./projectData";

function nodeHasChanges(node: TreeNode): boolean {
  if (node.type === "file") return !!node.vcs && node.vcs !== "ignored";
  return node.children.some(nodeHasChanges);
}

const vcsClass = (v?: VcsStatus) =>
  v === "modified" ? "vcs-modified" : v === "added" ? "vcs-added" : v === "ignored" ? "vcs-ignored" : "";

interface RowProps {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  activeId: string | null;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
}

function Row({ node, depth, expanded, activeId, onToggle, onOpen, onSelect }: RowProps) {
  const pad = 8 + depth * 14;

  if (node.type === "dir") {
    const isOpen = expanded.has(node.id);
    const active = activeId === node.id;
    const changed = nodeHasChanges(node);
    return (
      <div>
        <button
          onClick={() => {
            onSelect(node.id);
            onToggle(node.id);
          }}
          className={cn(
            "group flex w-full items-center gap-1 py-[2px] pr-2 text-left text-[12.5px] hover:bg-[#3a3d3f]",
            active && "bg-[#2f5f8f] text-white",
            changed ? "text-[#82a6cf]" : "text-[#c8c8c8]",
          )}
          style={{ paddingLeft: pad }}
        >
          <span className="grid h-3 w-3 place-items-center text-[#9aa0a4]">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
          {isOpen ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen &&
          node.children.map((child) => (
            <Row
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeId={activeId}
              onToggle={onToggle}
              onOpen={onOpen}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const active = activeId === node.id;
  return (
    <button
      onClick={() => onOpen(node.id)}
      className={cn(
        "flex w-full items-center gap-1.5 py-[2px] pr-2 text-left text-[12.5px]",
        active ? "bg-[#2f5f8f] text-white" : "hover:bg-[#3a3d3f]",
      )}
      style={{ paddingLeft: pad + 18 }}
    >
      <FileBadge ext={node.ext} />
      <span className={cn("truncate", active ? "text-white" : vcsClass(node.vcs))}>{node.name}</span>
    </button>
  );
}

interface Props {
  root: DirNode;
  expanded: Set<string>;
  activeId: string | null;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
  onOpenFolder: () => void;
  onRefresh: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDeleteActive: () => void;
  fileCount: number;
  isRealWorkspace: boolean;
}

export function FileTree({
  root,
  expanded,
  activeId,
  onToggle,
  onOpen,
  onSelect,
  onOpenFolder,
  onRefresh,
  onCreateFile,
  onCreateFolder,
  onDeleteActive,
  fileCount,
  isRealWorkspace,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-[#3c3f41]">
      {/* header */}
      <div className="flex h-[26px] shrink-0 items-center px-2 text-[11px] font-semibold uppercase tracking-wide text-[#9aa0a4]">
        <span>Project</span>
        <div className="flex-1" />
        <button onClick={onOpenFolder} title="Open Folder" className="grid h-5 w-5 place-items-center rounded text-[#9aa0a4] hover:bg-[#464a4d]">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button onClick={onRefresh} title="Refresh Project" className="grid h-5 w-5 place-items-center rounded text-[#9aa0a4] hover:bg-[#464a4d]">
          <Sync className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* project selector row */}
      <div className="flex items-center gap-1.5 px-2 py-1 text-[12.5px] text-[#dcdcdc]">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="truncate font-medium" title={root.id}>{root.name}</span>
        <ChevronDown className="h-3 w-3 text-[#9aa0a4]" />
      </div>

      <div className="flex h-[26px] shrink-0 items-center gap-1 border-y border-black/25 px-2 text-[11.5px] text-[#b9bec3]">
        <button
          onClick={onCreateFile}
          disabled={!isRealWorkspace}
          title={isRealWorkspace ? "New File" : "Open a real folder to create files"}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#464a4d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> File
        </button>
        <button
          onClick={onCreateFolder}
          disabled={!isRealWorkspace}
          title={isRealWorkspace ? "New Folder" : "Open a real folder to create folders"}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#464a4d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Folder className="h-3.5 w-3.5" /> Folder
        </button>
        <div className="flex-1" />
        <button
          onClick={onDeleteActive}
          disabled={!isRealWorkspace || !activeId}
          title={isRealWorkspace ? "Delete Active File/Folder" : "Open a real folder to delete entries"}
          className="grid h-5 w-5 place-items-center rounded text-[#c58b82] hover:bg-[#464a4d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Close className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* tree */}
      <div className="scroll-jb min-h-0 flex-1 overflow-auto py-1">
        {root.children.map((child) => (
          <Row
            key={child.id}
            node={child}
            depth={0}
            expanded={expanded}
            activeId={activeId}
            onToggle={onToggle}
            onOpen={onOpen}
            onSelect={onSelect}
          />
        ))}
        <div className="px-3 pb-4 pt-3 text-[10.5px] text-[#6f7377]">
          {fileCount} files · {expanded.size} open folders
        </div>
      </div>

      <div className="flex h-7 shrink-0 items-center justify-between border-t border-black/30 px-2 text-[#9aa0a4]">
        <span className="text-[11px]">Project</span>
        <Gear className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

export type { FileNode };
