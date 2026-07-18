"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { ChatMessage } from "@/types/companion";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[];
  pendingEcho?: string | null;
}

export function MessageList({ messages, pendingEcho }: MessageListProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.article
            key={message.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "max-w-[88%] rounded-[1.6rem] border px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.25)]",
              message.role === "assistant"
                ? "self-start border-white/10 bg-white/[0.045] text-stone-100"
                : "self-end border-cyan-300/20 bg-cyan-300/[0.14] text-cyan-50",
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
              <span>{message.role === "assistant" ? "Presence" : "You"}</span>
              {message.isSelfInitiated ? <span>Initiated</span> : null}
              {message.assistantTone ? <span>{message.assistantTone}</span> : null}
              <span>{message.timestampLabel}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-white/86">
              {message.content}
            </p>
            {message.historicalEntryIds.length > 0 ? (
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-amber-100/55">
                historical layer active
              </p>
            ) : null}
          </motion.article>
        ))}
        {pendingEcho ? (
          <motion.article
            key="pending-echo"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[88%] self-end rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/[0.08] px-4 py-3 text-cyan-50"
          >
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-cyan-50/45">
              sending
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7">{pendingEcho}</p>
          </motion.article>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
