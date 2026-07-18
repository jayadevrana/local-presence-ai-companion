"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import type {
  FollowUpTrigger,
  FutureEventMemory,
  LongTermMemoryItem,
  SessionSummary,
} from "@/types/companion";

interface MemoryInspectorProps {
  open: boolean;
  summary: SessionSummary | null;
  memory: LongTermMemoryItem[];
  futureEvents: FutureEventMemory[];
  followUps: FollowUpTrigger[];
  onClose: () => void;
}

export function MemoryInspector({
  open,
  summary,
  memory,
  futureEvents,
  followUps,
  onClose,
}: MemoryInspectorProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#090b12] p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Memory summary
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white/95">
                  What the companion is holding
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto pr-2">
              <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Rolling summary
                </p>
                <p className="mt-3 text-sm leading-7 text-white/82">
                  {summary?.rollingSummary ?? "No summary yet."}
                </p>
              </section>
              <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Future events
                </p>
                <div className="mt-3 space-y-3">
                  {futureEvents.length === 0 ? (
                    <p className="text-sm text-white/50">No future-event memory yet.</p>
                  ) : (
                    futureEvents.map((event) => (
                      <div key={event.id} className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-sm text-white/90">{event.title}</p>
                        <p className="mt-1 text-xs leading-6 text-white/55">
                          {event.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Follow-up queue
                </p>
                <div className="mt-3 space-y-3">
                  {followUps.length === 0 ? (
                    <p className="text-sm text-white/50">No follow-up triggers yet.</p>
                  ) : (
                    followUps.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {item.priorityScore.toFixed(2)} priority
                        </p>
                        <p className="mt-2 text-sm leading-7 text-white/82">{item.rationale}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Long-term memory
                </p>
                <div className="mt-3 space-y-3">
                  {memory.length === 0 ? (
                    <p className="text-sm text-white/50">No long-term memories extracted yet.</p>
                  ) : (
                    memory.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                          {item.kind.replaceAll("_", " ")}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-white/82">{item.summary}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
