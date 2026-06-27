export type VcsStatus = "modified" | "added" | "untracked" | "ignored";

export interface FileNode {
  type: "file";
  id: string;
  name: string;
  ext: string;
  lang: string;
  vcs?: VcsStatus;
  content: string;
  loaded?: boolean;
  dirty?: boolean;
  size?: number;
  skippedReason?: string;
}

export interface DirNode {
  type: "dir";
  id: string;
  name: string;
  expanded: boolean;
  children: TreeNode[];
}

export type TreeNode = FileNode | DirNode;

export function flattenFiles(node: TreeNode, acc: Record<string, FileNode> = {}): Record<string, FileNode> {
  if (node.type === "file") {
    acc[node.id] = node;
  } else {
    for (const child of node.children) flattenFiles(child, acc);
  }
  return acc;
}
