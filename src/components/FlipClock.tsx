"use client";

import { useEffect, useState } from "react";

const KICKOFF = new Date("2026-06-12T02:00:00Z").getTime();

type TimeUnit = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(): TimeUnit {
  const diff = Math.max(0, KICKOFF - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// ── Single digit card ────────────────────────────────────────────────────
// Uses React key trick: changing key remounts the element → triggers animation
function Digit({ value }: { value: string }) {
  return (
    <div className="relative w-7 h-9 rounded-md overflow-hidden flex items-center justify-center bg-[#1e3a6e] shadow-inner">
      {/* Center divider line (gives the "split card" look) */}
      <div className="absolute inset-x-0 top-[50%] h-px bg-black/40 z-10" />

      {/* Digit — key change triggers slide-in animation */}
      <span
        key={value}
        className="text-white font-bold tabular-nums leading-none z-20"
        style={{
          fontFamily: "Bebas Neue, sans-serif",
          fontSize: "22px",
          animation: "flipIn 0.25s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── A two-digit unit (DD, HH, MM, SS) ───────────────────────────────────
function FlipUnit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        <Digit value={str[0]} />
        <Digit value={str[1]} />
      </div>
      <span className="text-[9px] font-bold tracking-widest text-white/35 uppercase">
        {label}
      </span>
    </div>
  );
}

// ── Colon separator ──────────────────────────────────────────────────────
function Colon() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col gap-1.5 pb-5">
      <div
        className={`w-1 h-1 rounded-full transition-opacity duration-200 ${on ? "bg-white/50" : "bg-white/10"}`}
      />
      <div
        className={`w-1 h-1 rounded-full transition-opacity duration-200 ${on ? "bg-white/50" : "bg-white/10"}`}
      />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function FlipClock() {
  const [time, setTime] = useState<TimeUnit>(getTimeLeft);
  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  if (
    time.days <= 0 &&
    time.hours <= 0 &&
    time.minutes <= 0 &&
    time.seconds <= 0
  ) {
    return (
      <p
        className="text-white font-bold text-lg"
        style={{ fontFamily: "Bebas Neue, sans-serif" }}
      >
        ⚽ ¡EL MUNDIAL COMENZÓ!
      </p>
    );
  }

  return (
    <>
      <style>{`
        @keyframes flipIn {
          0%   { transform: translateY(-40%) scaleY(0.5); opacity: 0; }
          60%  { transform: translateY(4%)   scaleY(1.05); opacity: 1; }
          100% { transform: translateY(0)    scaleY(1);    opacity: 1; }
        }
      `}</style>
      <div className="flex items-end gap-1.5">
        <FlipUnit value={time.days} label="días" />
        <Colon />
        <FlipUnit value={time.hours} label="horas" />
        <Colon />
        <FlipUnit value={time.minutes} label="min" />
        <Colon />
        <FlipUnit value={time.seconds} label="seg" />
      </div>
    </>
  );
}
