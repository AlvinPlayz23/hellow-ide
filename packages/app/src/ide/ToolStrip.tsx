import type { ComponentType, SVGProps } from "react";
import { cn } from "../utils/cn";

export interface StripItem {
  id: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function StripButton({ side, item }: { side: "left" | "right"; item: StripItem }) {
  const Icon = item.icon;
  return (
    <button
      title={item.label}
      onClick={item.onClick}
      className={cn(
        "relative grid h-7 w-7 place-items-center text-[#9aa0a4] hover:bg-[#464a4d]",
        item.active && "bg-[#464a4d] text-white",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.active && (
        <span
          className={cn(
            "absolute bottom-0 top-0 w-[2px] bg-[#5b9bd5]",
            side === "left" ? "right-0" : "left-0",
          )}
        />
      )}
    </button>
  );
}

export function ToolStrip({
  side,
  top,
  bottom,
}: {
  side: "left" | "right";
  top: StripItem[];
  bottom?: StripItem[];
}) {
  return (
    <div className="flex w-7 shrink-0 flex-col bg-[#3c3f41]">
      <div className="flex flex-col">
        {top.map((it) => (
          <StripButton key={it.id} side={side} item={it} />
        ))}
      </div>
      <div className="flex-1" />
      {bottom?.map((it) => (
        <StripButton key={it.id} side={side} item={it} />
      ))}
    </div>
  );
}
