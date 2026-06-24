import type { Cursor, DocumentState } from './model';

export function clampCursor(document: DocumentState, cursor: Cursor): Cursor {
  const line = Math.max(0, Math.min(cursor.line, document.lines.length - 1));
  const col = Math.max(0, Math.min(cursor.col, document.lines[line]?.length ?? 0));
  return { line, col };
}
