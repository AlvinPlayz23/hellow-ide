export interface Token {
  text: string;
  type: 'plain' | 'keyword' | 'string' | 'comment';
}

export function tokenizeLine(line: string): Token[] {
  return [{ text: line, type: 'plain' }];
}
