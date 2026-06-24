import { cn } from "../utils/cn";
import { ArrowLeft, ArrowRight, CaretRun, ChevronDown, Debug, Stop, Sync, Hammer, Commit } from "./icons";

interface Props {
  running: boolean;
  onRun: () => void;
  onStop: () => void;
}

const sep = "mx-1.5 h-4 w-px bg-[#2b2b2b]/60";

export function Toolbar({ running, onRun, onStop }: Props) {
  return (
    <div className="flex h-8 items-center bg-[#3c3f41] px-2 text-[#bbbbbb]">
      {/* run configuration */}
      <button className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[#464a4d]">
        <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#3178c6] text-[7px] font-bold text-white">
          TS
        </span>
        <span className="text-[12px] text-[#dcdcdc]">App.tsx</span>
        <ChevronDown className="h-3 w-3 text-[#9aa0a4]" />
      </button>

      {/* run / debug / stop */}
      <button
        onClick={onRun}
        title="Run 'App.tsx' (⌃R)"
        className={cn(
          "ml-1 grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]",
          running && "bg-[#464a4d]",
        )}
      >
        <CaretRun className="h-4 w-4" />
      </button>
      <button
        onClick={onRun}
        title="Debug 'App.tsx' (⌃D)"
        className="grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]"
      >
        <Debug className="h-4 w-4" />
      </button>
      <button
        onClick={onStop}
        title="Stop (⌘F2)"
        className="grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]"
      >
        <Stop className="h-4 w-4" />
      </button>

      <div className={sep} />

      <button title="Build Project (⌘F9)" className="grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]">
        <Hammer className="h-4 w-4 text-[#bcbcbc]" />
      </button>

      <div className={sep} />

      <button title="Back (⌘⌥←)" className="grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]">
        <ArrowLeft className="h-4 w-4 text-[#bcbcbc]" />
      </button>
      <button title="Forward (⌘⌥→)" className="grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]">
        <ArrowRight className="h-4 w-4 text-[#bcbcbc]" />
      </button>

      <div className={sep} />

      <button title="Reload All from Disk" className="grid h-6 w-6 place-items-center rounded hover:bg-[#464a4d]">
        <Sync className="h-4 w-4 text-[#bcbcbc]" />
      </button>

      <div className="flex-1" />

      <button className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[12px] text-[#dcdcdc] hover:bg-[#464a4d]">
        <Commit className="h-4 w-4 text-[#7fd17f]" />
        Commit
      </button>
    </div>
  );
}
