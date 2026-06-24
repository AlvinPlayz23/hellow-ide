import type { DocumentState } from './model';

export interface HistoryStack {
  undo: DocumentState[];
  redo: DocumentState[];
}

export function createHistory(): HistoryStack {
  return { undo: [], redo: [] };
}
