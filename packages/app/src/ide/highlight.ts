export interface Token {
  t: string;
  c: string;
}

const KEYWORDS = new Set([
  "import", "from", "export", "default", "const", "let", "var", "function",
  "return", "if", "else", "for", "while", "do", "class", "extends",
  "implements", "new", "this", "super", "async", "await", "try", "catch",
  "finally", "throw", "typeof", "instanceof", "in", "of", "interface",
  "type", "enum", "namespace", "module", "declare", "abstract", "switch",
  "case", "break", "continue", "public", "private", "protected", "static",
  "readonly", "void", "delete", "yield", "as", "is", "get", "set",
  "override", "satisfies", "keyof", "infer",
]);

const LITERALS = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);

function tokenize(code: string): Token[] {
  const out: Token[] = [];
  const n = code.length;
  let i = 0;
  const push = (t: string, c: string) => {
    if (t) out.push({ t, c });
  };

  while (i < n) {
    const ch = code[i];

    // whitespace
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      let j = i;
      while (j < n && /[\s]/.test(code[j])) j++;
      push(code.slice(i, j), "ws");
      i = j;
      continue;
    }

    // line comment
    if (ch === "/" && code[i + 1] === "/") {
      let j = i;
      while (j < n && code[j] !== "\n") j++;
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // block comment
    if (ch === "/" && code[i + 1] === "*") {
      let j = i + 2;
      while (j < n - 1 && !(code[j] === "*" && code[j + 1] === "/")) j++;
      j = Math.min(n, j + 2);
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // strings (single, double, template)
    if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch;
      let j = i + 1;
      while (j < n) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === q) {
          j++;
          break;
        }
        if (code[j] === "\n" && q !== "`") break;
        j++;
      }
      push(code.slice(i, j), "string");
      i = j;
      continue;
    }

    // numbers
    if (ch >= "0" && ch <= "9") {
      let j = i;
      while (j < n) {
        const c = code[j];
        if (c === "+" || c === "-") {
          if (!/[eE]/.test(code[j - 1])) break;
          j++;
          continue;
        }
        if (/[0-9a-fA-FxXoObBeE._]/.test(c)) {
          j++;
          continue;
        }
        break;
      }
      push(code.slice(i, j), "number");
      i = j;
      continue;
    }

    // identifiers
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(code[j])) j++;
      const w = code.slice(i, j);
      let k = j;
      while (k < n && (code[k] === " " || code[k] === "\t")) k++;
      const isCall = code[k] === "(";
      let c = "plain";
      if (KEYWORDS.has(w)) c = "keyword";
      else if (LITERALS.has(w)) c = "constant";
      else if (/^[A-Z]/.test(w)) c = "type";
      else if (isCall) c = "fn";
      push(w, c);
      i = j;
      continue;
    }

    // decorators / annotations
    if (ch === "@") {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$.]/.test(code[j])) j++;
      push(code.slice(i, j), "annotation");
      i = j;
      continue;
    }

    // punctuation / operators
    push(ch, "punct");
    i++;
  }
  return out;
}

/** Split a flat token stream into per-line token arrays (handles newlines inside tokens). */
export function toLines(code: string): Token[][] {
  const tokens = tokenize(code);
  const lines: Token[][] = [[]];
  for (const tok of tokens) {
    const parts = tok.t.split("\n");
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ t: part, c: tok.c });
    });
  }
  return lines;
}

export interface StructureItem {
  name: string;
  kind: "function" | "const" | "interface" | "type" | "class" | "var";
  line: number;
}

/** Lightweight outline extractor for the Structure tool window. */
export function getStructure(code: string): StructureItem[] {
  const items: StructureItem[] = [];
  const lines = code.split("\n");
  const re =
    /^\s*(export\s+(default\s+)?)?(function|class|interface|type|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/;
  lines.forEach((ln, idx) => {
    const m = ln.match(re);
    if (!m) return;
    const kindWord = m[3];
    let kind: StructureItem["kind"] = "var";
    if (kindWord === "function") kind = "function";
    else if (kindWord === "class") kind = "class";
    else if (kindWord === "interface") kind = "interface";
    else if (kindWord === "type") kind = "type";
    else if (kindWord === "const" || kindWord === "let" || kindWord === "var")
      kind = "const";
    items.push({ name: m[4], kind, line: idx + 1 });
  });
  return items;
}
