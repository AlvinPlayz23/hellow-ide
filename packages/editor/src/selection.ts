import type { SelectionRange } from './model';

export function isCollapsed(selection: SelectionRange) {
  return selection.anchor.line === selection.head.line && selection.anchor.col === selection.head.col;
}
