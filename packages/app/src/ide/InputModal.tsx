import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

interface InputModalProps {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({ title, defaultValue = "", placeholder, confirmLabel = "Create", onConfirm, onCancel }: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
    else onCancel();
  }, [value, onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="w-[380px] overflow-hidden rounded-lg border border-[#464a4d] bg-[#3c3f41] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2 text-[13px] font-medium text-[#dcdcdc]">{title}</div>
        <div className="px-4 pb-2">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); submit(); }
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            placeholder={placeholder}
            spellCheck={false}
            className="w-full rounded border border-[#555] bg-[#2b2b2b] px-2.5 py-1.5 text-[13px] text-[#c8c8c8] outline-none focus:border-[#4b6eaf]"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-[#464a4d] px-4 py-2.5">
          <button onClick={onCancel} className="rounded px-3 py-1 text-[12px] text-[#9aa0a4] hover:bg-[#464a4d]">
            Cancel
          </button>
          <button onClick={submit} className="rounded bg-[#4a6e9e] px-3 py-1 text-[12px] text-white hover:bg-[#5b7faf]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel = "Delete", onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="w-[380px] overflow-hidden rounded-lg border border-[#464a4d] bg-[#3c3f41] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-1 text-[13px] font-medium text-[#dcdcdc]">{title}</div>
        <div className="px-4 pb-2 text-[12.5px] text-[#9aa0a4]">{message}</div>
        <div className="flex justify-end gap-2 border-t border-[#464a4d] px-4 py-2.5">
          <button onClick={onCancel} className="rounded px-3 py-1 text-[12px] text-[#9aa0a4] hover:bg-[#464a4d]">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded bg-[#c7551b] px-3 py-1 text-[12px] text-white hover:bg-[#d4662b]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface UnsavedChangesModalProps {
  fileName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({ fileName, onSave, onDiscard, onCancel }: UnsavedChangesModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="w-[420px] overflow-hidden rounded-lg border border-[#464a4d] bg-[#3c3f41] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-1 text-[13px] font-medium text-[#dcdcdc]">Save changes?</div>
        <div className="px-4 pb-2 text-[12.5px] text-[#9aa0a4]">
          <span className="text-[#dcdcdc]">{fileName}</span> has unsaved changes.
        </div>
        <div className="flex justify-end gap-2 border-t border-[#464a4d] px-4 py-2.5">
          <button onClick={onCancel} className="rounded px-3 py-1 text-[12px] text-[#9aa0a4] hover:bg-[#464a4d]">
            Cancel
          </button>
          <button onClick={onDiscard} className="rounded px-3 py-1 text-[12px] text-[#d6b36a] hover:bg-[#464a4d]">
            Discard
          </button>
          <button onClick={onSave} className="rounded bg-[#4a6e9e] px-3 py-1 text-[12px] text-white hover:bg-[#5b7faf]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
