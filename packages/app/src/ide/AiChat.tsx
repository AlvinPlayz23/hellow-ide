import { useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Close } from "./icons";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface Props {
  onClose: () => void;
}

export function AiChat({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm your AI coding assistant. Ask me anything about your code." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "ai", text: "AI integration coming soon. Stay tuned!" },
    ]);
    setInput("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-l border-black/40 bg-[#2b2d30]">
      {/* header */}
      <div className="flex h-[26px] shrink-0 items-center border-b border-black/30 px-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa0a4]">AI Chat</span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="grid h-5 w-5 place-items-center rounded text-[#9aa0a4] hover:bg-[#464a4d]"
        >
          <Close className="h-3 w-3" />
        </button>
      </div>

      {/* messages */}
      <div className="scroll-jb min-h-0 flex-1 overflow-auto px-3 py-2 text-[12.5px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "mb-2 max-w-[90%] rounded-[4px] px-2.5 py-1.5 leading-[1.5]",
              m.role === "user"
                ? "ml-auto bg-[#214283] text-[#dce6f0]"
                : "bg-[#3c3f41] text-[#c8c8c8]",
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* input */}
      <div className="shrink-0 border-t border-black/30 p-2">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask AI… (Enter to send)"
          spellCheck={false}
          className="scroll-jb w-full resize-none rounded-[3px] border border-[#4a4d50] bg-[#1e1f22] px-2 py-1.5 text-[12px] text-[#c8c8c8] outline-none placeholder:text-[#5a5d5f] focus:border-[#4b6eaf]"
        />
      </div>
    </div>
  );
}
