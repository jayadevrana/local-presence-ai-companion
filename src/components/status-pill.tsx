"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  tone?: "neutral" | "active" | "warn" | "soft";
}

export function StatusPill({
  label,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.24em]",
        tone === "active" &&
          "border-emerald-400/20 bg-emerald-300/10 text-emerald-100",
        tone === "warn" && "border-amber-300/20 bg-amber-300/10 text-amber-100",
        tone === "soft" && "border-white/10 bg-white/5 text-white/70",
        tone === "neutral" && "border-white/10 bg-white/[0.03] text-white/55",
      )}
    >
      {label}
    </motion.span>
  );
}
