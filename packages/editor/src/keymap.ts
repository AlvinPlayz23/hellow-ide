export type EditorCommand = 'save' | 'undo' | 'redo' | 'select-all' | 'close-tab';

export const defaultKeymap: Record<string, EditorCommand> = {
  'Ctrl+S': 'save',
  'Ctrl+Z': 'undo',
  'Ctrl+Y': 'redo',
  'Ctrl+A': 'select-all',
  'Ctrl+W': 'close-tab'
};
