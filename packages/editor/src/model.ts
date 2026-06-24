export interface DocumentState {
  path: string;
  lines: string[];
  dirty: boolean;
  language: string;
}

export interface EditorState {
  documents: DocumentState[];
  activeDocIndex: number;
  cursor: Cursor;
  selection: SelectionRange | null;
  scrollTop: number;
}

export interface Cursor {
  line: number;
  col: number;
}

export interface SelectionRange {
  anchor: Cursor;
  head: Cursor;
}

export function createDocument(path: string, content: string): DocumentState {
  return {
    path,
    lines: content.split(/\r?\n/),
    dirty: false,
    language: inferLanguage(path)
  };
}

function inferLanguage(path: string) {
  const extension = path.split('.').pop()?.toLowerCase();
  if (!extension) return 'text';
  return extension;
}
