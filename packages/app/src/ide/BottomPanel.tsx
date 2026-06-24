import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Terminal, ListCheck, Close, Gear } from "./icons";
import { FILE_MAP } from "./projectData";

export type BottomTab = "terminal" | "problems";

/** Line of the unresolved <FilterBar /> reference in App.tsx — kept in sync dynamically. */
const FILTERBAR_LINE = (() => {
  const f = FILE_MAP["root/src/App.tsx"];
  const idx = f ? f.content.split("\n").findIndex((l) => l.includes("FilterBar")) : -1;
  return idx >= 0 ? idx + 1 : 44;
})();

interface Props {
  tab: BottomTab;
  onTab: (t: BottomTab) => void;
  onClose: () => void;
  onJump: (fileId: string, line: number) => void;
  errors: number;
  warnings: number;
}

const TABS: { id: BottomTab; label: string; icon: typeof Terminal }[] = [
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "problems", label: "Problems", icon: ListCheck },
];

export function BottomPanel(props: Props) {
  const { tab, onTab, onClose, onJump, errors, warnings } = props;
  return (
    <div className="flex h-[208px] shrink-0 flex-col border-t border-black/40 bg-[#2b2b2b]">
      <div className="flex h-[26px] items-center bg-[#3c3f41] pr-1 text-[12px]">
        <div className="flex h-full items-stretch">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 border-r border-black/20 px-3 text-[12.5px]",
                  active ? "bg-[#2b2b2b] text-[#e6e6e6]" : "text-[#9aa0a4] hover:bg-[#464a4d]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.id === "problems" && errors + warnings > 0 && (
                  <span className="ml-0.5 rounded bg-[#525557] px-1 text-[10px] text-[#dcdcdc]">
                    {errors + warnings}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <button className="grid h-6 w-6 place-items-center rounded text-[#9aa0a4] hover:bg-[#464a4d]">
          <Gear className="h-3.5 w-3.5" />
        </button>
        <button onClick={onClose} className="grid h-6 w-6 place-items-center rounded text-[#9aa0a4] hover:bg-[#464a4d]">
          <Close className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === "terminal" && <TerminalView />}
        {tab === "problems" && <ProblemsView onJump={onJump} />}
      </div>
    </div>
  );
}

/* ----------------------------- Terminal ----------------------------- */
type TermLine = { type: "cmd" | "out" | "ok" | "err" | "sys" | "link"; text: string };

const termColor: Record<TermLine["type"], string> = {
  cmd: "text-[#c8c8c8]",
  out: "text-[#b8b8b8]",
  ok: "text-[#86c272]",
  err: "text-[#e08a7a]",
  sys: "text-[#7f8590]",
  link: "text-[#5fa6c9]",
};

const PROMPT = (
  <>
    <span className="text-[#86c272]">➜</span>{" "}
    <span className="text-[#5fa6c9]">taskflow</span>{" "}
    <span className="text-[#e0a48a]">git:(</span>
    <span className="text-[#cf9c6e]">main</span>
    <span className="text-[#e0a48a]">)</span>
  </>
);

function TerminalView() {
  const [lines, setLines] = useState<TermLine[]>([
    { type: "sys", text: "WebStorm Terminal — zsh" },
    { type: "sys", text: "Type 'help' for available commands." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const run = (raw: string): TermLine[] => {
    const c = raw.trim();
    const [name, ...args] = c.split(/\s+/);
    switch (name) {
      case "":
        return [];
      case "help":
        return [{ type: "out", text: "commands: ls, pwd, whoami, date, echo, clear, git status, git log, npm run dev, npm run build, npm test" }];
      case "ls":
        return [{ type: "ok", text: "public/   src/   tests/   index.html   package.json   tsconfig.json   vite.config.ts   README.md" }];
      case "pwd":
        return [{ type: "ok", text: "/Users/ada/dev/taskflow" }];
      case "whoami":
        return [{ type: "ok", text: "ada" }];
      case "date":
        return [{ type: "ok", text: new Date().toString() }];
      case "echo":
        return [{ type: "ok", text: args.join(" ") }];
      case "clear":
        return [{ type: "out", text: "__clear__" }];
      case "git":
        if (args[0] === "status")
          return [
            { type: "ok", text: "On branch main" },
            { type: "ok", text: "Your branch is ahead of 'origin/main' by 1 commit." },
            { type: "out", text: "" },
            { type: "out", text: "Changes not staged for commit:" },
            { type: "err", text: "  modified:   src/App.tsx" },
            { type: "err", text: "  modified:   src/utils/sort.ts" },
            { type: "ok", text: "  added:      src/types.ts" },
          ];
        if (args[0] === "log")
          return [
            { type: "ok", text: "commit a4f2c91 (HEAD -> main)" },
            { type: "out", text: "Author: Ada Lovelace <ada@taskflow.dev>" },
            { type: "out", text: "    feat: persist tasks to localStorage" },
          ];
        return [{ type: "err", text: `git: '${args[0] ?? ""}' is not a git command. See 'git --help'.` }];
      case "npm":
        if (args[0] === "run" && args[1] === "dev")
          return [
            { type: "sys", text: "> taskflow@1.4.2 dev" },
            { type: "sys", text: "> vite" },
            { type: "out", text: "" },
            { type: "ok", text: "  VITE v7.3.2  ready in 421 ms" },
            { type: "out", text: "" },
            { type: "link", text: "  ➜  Local:   http://localhost:5173/" },
            { type: "link", text: "  ➜  Network: use --host to expose" },
            { type: "out", text: "  ➜  press h + enter to show help" },
          ];
        if (args[0] === "run" && args[1] === "build")
          return [
            { type: "sys", text: "> taskflow@1.4.2 build" },
            { type: "sys", text: "> tsc && vite build" },
            { type: "ok", text: "  ✓ built dist/taskflow.js   (44.21 kB)" },
            { type: "ok", text: "  ✓ built dist/style.css     (2.10 kB)" },
            { type: "ok", text: "  ✓ built in 1.83s" },
          ];
        if (args[0] === "test")
          return [
            { type: "sys", text: "RUN  v2.1.0" },
            { type: "ok", text: " ✓ sort.test.ts (2)" },
            { type: "out", text: " Test Files  1 passed (1)" },
            { type: "out", text: "      Tests  2 passed (2)" },
            { type: "ok", text: " Duration  312ms" },
          ];
        return [{ type: "out", text: `npm ${args.join(" ")}` }];
      case "node":
      case "npx":
        return [{ type: "out", text: `${name} ${args.join(" ")}` }];
      default:
        return [{ type: "err", text: `zsh: command not found: ${name}` }];
    }
  };

  const submit = () => {
    const value = input;
    const produced = run(value);
    if (produced.length === 1 && produced[0].text === "__clear__") {
      setLines([]);
    } else {
      const cmdLine: TermLine = { type: "cmd", text: value };
      setLines((prev) => [...prev, cmdLine, ...produced]);
    }
    if (value.trim()) setHistory((h) => [...h, value]);
    setHIdx(-1);
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length) {
        const ni = hIdx === -1 ? history.length - 1 : Math.max(0, hIdx - 1);
        setHIdx(ni);
        setInput(history[ni]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === -1) return;
      const ni = hIdx + 1;
      if (ni >= history.length) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(ni);
        setInput(history[ni]);
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      className="scroll-jb h-full overflow-auto px-3 py-2 font-mono-jb text-[12.5px] leading-[18px]"
      onMouseDown={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) =>
        l.type === "cmd" ? (
          <div key={i} className="whitespace-pre-wrap break-all">
            {PROMPT} <span className={termColor.cmd}>{l.text}</span>
          </div>
        ) : (
          <div key={i} className={cn("whitespace-pre-wrap break-all", termColor[l.type])}>
            {l.text || "\u00A0"}
          </div>
        ),
      )}
      <div className="flex items-center">
        <span className="shrink-0">{PROMPT}&nbsp;</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          className="flex-1 border-none bg-transparent text-[#c8c8c8] outline-none"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}

/* ----------------------------- Problems ----------------------------- */
interface Problem {
  sev: "error" | "warn" | "info";
  fileId: string;
  line: number;
  col: number;
  code: string;
  msg: string;
}

const PROBLEMS: Problem[] = [
  { sev: "error", fileId: "root/src/App.tsx", line: FILTERBAR_LINE, col: 6, code: "ts(2304)", msg: "Cannot find name 'FilterBar'." },
  { sev: "warn", fileId: "root/src/hooks/useLocalStorage.ts", line: 13, col: 3, code: "react-hooks(6)", msg: "React Hook useEffect has a missing dependency: 'initial'." },
  { sev: "info", fileId: "root/src/utils/sort.ts", line: 5, col: 3, code: "JSDoc", msg: "Missing JSDoc @returns tag." },
];

function ProblemsView({ onJump }: { onJump: (fileId: string, line: number) => void }) {
  return (
    <div className="scroll-jb h-full overflow-auto py-1 font-mono-jb text-[12px]">
      {PROBLEMS.map((p, i) => {
        const file = FILE_MAP[p.fileId];
        const dot = p.sev === "error" ? "bg-[#c7551b]" : p.sev === "warn" ? "bg-[#caa53a]" : "bg-[#5b87b5]";
        return (
          <button
            key={i}
            onClick={() => onJump(p.fileId, p.line)}
            className="flex w-full items-start gap-2 px-3 py-1 text-left hover:bg-[#33363a]"
          >
            <span className={cn("mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full", dot)} />
            <span className="text-[#c8c8c8]">{p.msg}</span>
            <span className="text-[#8b9094]">{p.code}</span>
            <span className="ml-auto shrink-0 text-[#8b9094]">
              {file?.name}:{p.line}:{p.col}
            </span>
          </button>
        );
      })}
    </div>
  );
}
