"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface PresenceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  hasDraft: boolean;
  disabled?: boolean;
  onToggleListening: () => void;
}

const spokes = Array.from({ length: 24 }, (_, index) => index);
const particles = Array.from({ length: 40 }, (_, index) => index);

export function PresenceOrb({
  isListening,
  isSpeaking,
  hasDraft,
  disabled,
  onToggleListening,
}: PresenceOrbProps) {
  const active = isListening || isSpeaking;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <button
        type="button"
        onClick={onToggleListening}
        disabled={disabled}
        className={cn(
          "group relative flex h-[22rem] w-[22rem] items-center justify-center rounded-full transition-transform duration-500",
          disabled && "cursor-not-allowed opacity-50",
          active && "scale-[1.02]",
        )}
        aria-label={isListening ? "Stop listening" : "Start voice conversation"}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,199,90,0.28),rgba(255,157,0,0.08)_35%,rgba(15,17,28,0)_70%)] blur-xl"
          animate={{
            scale: isListening ? [1, 1.08, 1] : isSpeaking ? [1, 1.04, 1] : [1, 1.02, 1],
            opacity: isListening ? [0.75, 1, 0.78] : isSpeaking ? [0.6, 0.82, 0.6] : [0.38, 0.52, 0.38],
          }}
          transition={{
            duration: isListening ? 1.5 : isSpeaking ? 2.2 : 4.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <motion.div
          aria-hidden
          className="absolute inset-6 rounded-full border border-amber-300/20"
          animate={{ rotate: 360, opacity: active ? 0.9 : 0.45 }}
          transition={{
            duration: isListening ? 12 : 24,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <motion.div
          aria-hidden
          className="absolute inset-10 rounded-full border border-amber-200/12"
          animate={{ rotate: -360, opacity: active ? 0.75 : 0.35 }}
          transition={{
            duration: isListening ? 10 : 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <div className="absolute inset-0">
          {spokes.map((index) => {
            const angle = (index / spokes.length) * 360;
            return (
              <motion.span
                key={index}
                aria-hidden
                className="absolute left-1/2 top-1/2 h-[42%] w-px origin-bottom"
                style={{
                  transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                }}
                animate={{
                  opacity: active ? [0.15, 0.8, 0.2] : [0.08, 0.26, 0.08],
                  scaleY: isListening ? [0.75, 1.08, 0.82] : [0.82, 0.96, 0.82],
                }}
                transition={{
                  duration: 1.4 + (index % 6) * 0.14,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: index * 0.04,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(to_top,rgba(255,188,80,0),rgba(255,179,59,0.95),rgba(255,228,179,0))] blur-[0.5px]" />
              </motion.span>
            );
          })}
        </div>

        <div className="absolute inset-0">
          {particles.map((index) => {
            const angle = (index / particles.length) * Math.PI * 2;
            const radius = 128 + (index % 5) * 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.span
                key={index}
                aria-hidden
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-amber-200/90 shadow-[0_0_16px_rgba(255,190,80,0.9)]"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                animate={{
                  opacity: active ? [0.3, 1, 0.25] : [0.08, 0.45, 0.08],
                  scale: active ? [0.7, 1.4, 0.75] : [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 1.8 + (index % 4) * 0.3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: index * 0.05,
                }}
              />
            );
          })}
        </div>

        <motion.div
          className="absolute inset-[18%] rounded-full border border-amber-100/15 bg-[radial-gradient(circle,rgba(255,217,159,0.28),rgba(255,170,65,0.14)_35%,rgba(255,136,0,0.02)_70%)] shadow-[0_0_120px_rgba(255,161,53,0.35)]"
          animate={{
            rotate: isListening ? [0, 12, -6, 0] : [0, 6, 0],
            scale: hasDraft ? [1, 1.03, 1] : [1, 1.01, 1],
          }}
          transition={{
            duration: isListening ? 3 : 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute inset-[26%] rounded-full border border-amber-100/18 bg-[radial-gradient(circle,rgba(255,239,212,0.5),rgba(255,184,67,0.18)_38%,rgba(255,138,36,0.02)_75%)] backdrop-blur-sm"
          animate={{
            scale: isListening ? [0.96, 1.05, 0.98] : isSpeaking ? [0.98, 1.03, 0.99] : [0.98, 1.01, 0.98],
            opacity: isListening ? [0.9, 1, 0.92] : [0.7, 0.82, 0.72],
          }}
          transition={{
            duration: isListening ? 1.2 : isSpeaking ? 1.8 : 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-amber-100/15 bg-black/25 shadow-[0_0_40px_rgba(255,170,50,0.35)] backdrop-blur-md">
            {isListening ? (
              <Mic className="h-10 w-10 text-amber-100" />
            ) : isSpeaking ? (
              <Volume2 className="h-10 w-10 text-amber-100" />
            ) : (
              <MicOff className="h-10 w-10 text-amber-100/80" />
            )}
          </div>
          <div className="space-y-1 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-100/60">
              {isListening ? "Listening" : isSpeaking ? "Speaking" : "Voice ready"}
            </p>
            <p className="max-w-[14rem] text-sm leading-6 text-white/72">
              {isListening
                ? "Talk naturally. I’ll send when you finish."
                : "Tap the orb and speak. Keyboard is optional."}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
