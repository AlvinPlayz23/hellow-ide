export interface LanguageServerClientOptions {
  command: string;
  args?: string[];
}

export class LanguageServerClient {
  constructor(readonly options: LanguageServerClientOptions) {}
}
