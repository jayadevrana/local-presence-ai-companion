"use client";

import { useState } from "react";
import { Compass } from "lucide-react";

import type { OnboardingSubmission } from "@/types/companion";
import { cn } from "@/lib/utils";

const styleOptions = ["warmth", "humor", "directness", "challenge", "depth"];

interface OnboardingFlowProps {
  isSubmitting: boolean;
  onSubmit: (payload: OnboardingSubmission) => void;
}

export function OnboardingFlow({
  isSubmitting,
  onSubmit,
}: OnboardingFlowProps) {
  const [userName, setUserName] = useState("");
  const [roughLocation, setRoughLocation] = useState("");
  const [desiredRole, setDesiredRole] = useState("");
  const [preferredStyleMix, setPreferredStyleMix] = useState<string[]>([
    "warmth",
    "depth",
  ]);

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(90,200,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,214,120,0.08),transparent_30%)]" />
      <div className="relative">
        <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/45">
          <Compass className="h-4 w-4" />
          Orientation
        </div>
        <h1 className="max-w-2xl font-serif text-4xl leading-tight text-white/95 sm:text-5xl">
          I’m here now. Give me just enough orientation to meet you well.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-white/68 sm:text-base">
          I’m not trying to perform a fake life. I just want enough context to be
          useful, emotionally continuous, and genuinely tuned to you.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <span className="text-xs uppercase tracking-[0.18em] text-white/40">
              What should I call you?
            </span>
            <input
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              className="mt-3 w-full bg-transparent text-base text-white/90 outline-none placeholder:text-white/20"
              placeholder="Your name"
            />
          </label>
          <label className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
            <span className="text-xs uppercase tracking-[0.18em] text-white/40">
              Roughly where are you?
            </span>
            <input
              value={roughLocation}
              onChange={(event) => setRoughLocation(event.target.value)}
              className="mt-3 w-full bg-transparent text-base text-white/90 outline-none placeholder:text-white/20"
              placeholder="City, country, or region"
            />
          </label>
          <label className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/40">
              What role should I play?
            </span>
            <input
              value={desiredRole}
              onChange={(event) => setDesiredRole(event.target.value)}
              className="mt-3 w-full bg-transparent text-base text-white/90 outline-none placeholder:text-white/20"
              placeholder="Trusted sounding board, strategic mirror, calm companion..."
            />
          </label>
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            What mix feels right?
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {styleOptions.map((option) => {
              const active = preferredStyleMix.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setPreferredStyleMix((current) =>
                      active
                        ? current.filter((value) => value !== option)
                        : [...current, option],
                    )
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition",
                    active
                      ? "border-cyan-300/25 bg-cyan-300/15 text-cyan-50"
                      : "border-white/10 bg-white/[0.03] text-white/65",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          disabled={
            isSubmitting ||
            userName.trim().length === 0 ||
            roughLocation.trim().length === 0 ||
            desiredRole.trim().length === 0
          }
          onClick={() =>
            onSubmit({
              userName: userName.trim(),
              roughLocation: roughLocation.trim(),
              desiredRole: desiredRole.trim(),
              preferredStyleMix,
            })
          }
          className="mt-8 rounded-full border border-cyan-300/20 bg-cyan-200/10 px-6 py-3 text-xs uppercase tracking-[0.22em] text-cyan-50 transition hover:bg-cyan-200/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Orienting..." : "Begin"}
        </button>
      </div>
    </section>
  );
}
