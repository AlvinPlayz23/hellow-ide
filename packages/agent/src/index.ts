export interface InlineSuggestionRequest {
  path: string;
  prefix: string;
  suffix: string;
}

export interface InlineSuggestion {
  text: string;
}
