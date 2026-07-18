"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, Keyboard, Mic } from "lucide-react";

interface MessageComposerProps {
  draft: string;
  isTyping: boolean;
  isSending: boolean;
  isListening: boolean;
  speechSupported: boolean;
  recognitionError?: string | null;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onToggleListening: () => void;
}

export function MessageComposer({
  draft,
  isTyping,
  isSending,
  isListening,
  speechSupported,
  recognitionError,
  onDraftChange,
  onSubmit,
  onToggleListening,
}: MessageComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }, [draft]);

  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-black/30 p-3 backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
          <Keyboard className="h-4 w-4" />
          Keyboard fallback
        </div>
        <button
          type="button"
          onClick={onToggleListening}
          disabled={!speechSupported || isSending}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-200/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-amber-50 transition hover:bg-amber-200/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Mic className="h-4 w-4" />
          {isListening ? "Stop voice" : "Talk instead"}
        </button>
      </div>
      <textarea
        ref={ref}
        value={draft}
        placeholder="Say the thing that matters."
        className="min-h-[60px] w-full resize-none bg-transparent px-2 py-2 text-sm leading-7 text-white/90 outline-none placeholder:text-white/25"
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            {isListening
              ? "live speech transcript"
              : isTyping
                ? "typing detected"
                : "presence listening"}
          </p>
          {recognitionError ? (
            <p className="text-xs text-rose-200/75">{recognitionError}</p>
          ) : !speechSupported ? (
            <p className="text-xs text-white/45">
              Browser speech recognition is not available here.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSending || draft.trim().length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-200/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-50 transition hover:bg-cyan-200/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
