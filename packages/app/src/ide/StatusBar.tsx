import { cn } from "../utils/cn";
import { GitBranch, ArrowUp, ArrowDown, ErrorIcon, Warning, Bell, Gear, Stack } from "./icons";

interface Props {
  cursorLine: number;
  cursorCol: number;
  langLabel: string;
  running: boolean;
  errors: number;
  warnings: number;
}

function Sep() {
  return <span className="mx-2 h-3 w-px bg-[#5a5d5f]/60" />;
}

export function StatusBar({ cursorLine, cursorCol, langLabel, running, errors, warnings }: Props) {
  return (
    <div className="flex h-[22px] shrink-0 items-center bg-[#3c3f41] text-[11.5px] text-[#9aa0a4]">
      <div className="flex items-center gap-1.5 border-r border-black/30 px-2.5 text-[#dcdcdc]">
        <GitBranch className="h-3.5 w-3.5 text-[#9aa0a4]" />
        <span className="font-medium">main</span>
        <ArrowUp className="h-3 w-3 text-[#7fd17f]" />
        <span className="text-[#7fd17f]">1</span>
        <ArrowDown className="h-3 w-3 text-[#cf9c6e]" />
        <span className="text-[#cf9c6e]">0</span>
      </div>

      <button className="flex items-center gap-1.5 px-2.5 hover:bg-[#464a4d]">
        <ErrorIcon className="h-3.5 w-3.5" />
        <span className={cn(errors ? "text-[#e0a48a]" : "text-[#9aa0a4]")}>{errors}</span>
        <Warning className="h-3.5 w-3.5" />
        <span className={cn(warnings ? "text-[#d6c770]" : "text-[#9aa0a4]")}>{warnings}</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 px-2.5">
        {running && (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#5fb96b]" />
            <span className="text-[#9bd0a2]">Running</span>
            <Sep />
          </>
        )}
        <span>UTF-8</span>
        <Sep />
        <span>LF</span>
        <Sep />
        <span>Spaces: 2</span>
        <Sep />
        <span>{langLabel}</span>
        <Sep />
        <span>
          {cursorLine}:{cursorCol}
        </span>
      </div>

      <button className="grid h-full w-7 place-items-center border-l border-black/30 hover:bg-[#464a4d]">
        <Stack className="h-3.5 w-3.5" />
      </button>
      <button className="grid h-full w-7 place-items-center hover:bg-[#464a4d]">
        <Bell className="h-3.5 w-3.5" />
      </button>
      <button className="grid h-full w-7 place-items-center hover:bg-[#464a4d]">
        <Gear className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
