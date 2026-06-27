import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Terminal, ListCheck, Close, Gear } from "./icons";

export type BottomTab = "terminal" | "problems";

interface Props {
  tab: BottomTab;
  onTab: (t: BottomTab) => void;
  onClose: () => void;
  onJump: (fileId: string, line: number) => void;
  errors: number;
  warnings: number;
  cwd?: string;
}

const TABS: { id: BottomTab; label: string; icon: typeof Terminal }[] = [
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "problems", label: "Problems", icon: ListCheck },
];

export function BottomPanel(props: Props) {
  const { tab, onTab, onClose, onJump, errors, warnings, cwd } = props;
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
        {tab === "terminal" && <TerminalView cwd={cwd} />}
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

const TERMINAL_ID = "main";

function stripAnsi(text: string) {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

function Prompt({ cwd }: { cwd?: string }) {
  const label = cwd?.split(/[\\/]/).filter(Boolean).pop() ?? "workspace";
  return (
    <>
      <span className="text-[#86c272]">➜</span>{" "}
      <span className="text-[#5fa6c9]">{label}</span>
    </>
  );
}

function TerminalView({ cwd }: { cwd?: string }) {
  const [lines, setLines] = useState<TermLine[]>([
    { type: "sys", text: "Hellow Terminal — PTY shell" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  useEffect(() => {
    const offData = window.ide?.onTerminalData?.((event) => {
      if (event.id !== TERMINAL_ID) return;
      const text = stripAnsi(event.text).replace(/\r/g, "");
      if (!text) return;
      setLines((prev) => [...prev, { type: event.type === "stderr" ? "err" : "out", text }]);
    });
    const offExit = window.ide?.onTerminalExit?.((event) => {
      if (event.id !== TERMINAL_ID) return;
      setRunning(false);
      setLines((prev) => [...prev, { type: event.code === 0 ? "ok" : "err", text: `Process exited with code ${event.code ?? "unknown"}` }]);
    });

    return () => {
      offData?.();
      offExit?.();
    };
  }, []);

  useEffect(() => {
    setRunning(true);
    setLines((prev) => [...prev, { type: "sys", text: cwd ? `Terminal cwd: ${cwd}` : "Terminal cwd: application workspace" }]);
    void window.ide?.terminalStop?.(TERMINAL_ID).finally(() => {
      void window.ide?.terminalStart?.(TERMINAL_ID, cwd).catch((error) => {
        setRunning(false);
        setLines((prev) => [...prev, { type: "err", text: String(error) }]);
      });
    });
  }, [cwd]);

  const submit = () => {
    const value = input.trim();
    if (!value) return;

    if (value === "clear") {
      setLines([]);
    } else {
      setLines((prev) => [...prev, { type: "cmd", text: value }]);
      void window.ide?.terminalRun?.(TERMINAL_ID, value).catch((error) => {
        setRunning(false);
        setLines((prev) => [...prev, { type: "err", text: String(error) }]);
      });
    }
    if (value.trim()) setHistory((h) => [...h, value]);
    setHIdx(-1);
    setInput("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key.toLowerCase() === "c" && (e.ctrlKey || e.metaKey) && running) {
      e.preventDefault();
      void window.ide?.terminalWrite?.(TERMINAL_ID, "\x03");
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
            <Prompt cwd={cwd} /> <span className={termColor.cmd}>{l.text}</span>
          </div>
        ) : (
          <div key={i} className={cn("whitespace-pre-wrap break-all", termColor[l.type])}>
            {l.text || "\u00A0"}
          </div>
        ),
      )}
      <div className="flex items-center">
        <span className="shrink-0"><Prompt cwd={cwd} />&nbsp;</span>
        {running && <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-[#5fb96b]" />}
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
function ProblemsView({ onJump: _onJump }: { onJump: (fileId: string, line: number) => void }) {
  return (
    <div className="scroll-jb flex h-full items-center justify-center overflow-auto py-1 font-mono-jb text-[12px] text-[#6f7377]">
      No problems detected
    </div>
  );
}
