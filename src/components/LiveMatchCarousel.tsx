"use client";

import { useState, useEffect, useRef } from "react";
import type { Match } from "@/lib/supabase";

function getMinute(matchDate: string): number {
  const start = new Date(matchDate).getTime();
  return Math.min(90, Math.floor((Date.now() - start) / 60000));
}

export default function LiveMatchCarousel({ matches }: { matches: Match[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = (index: number) => {
    setCurrent((index + matches.length) % matches.length);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (matches.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % matches.length);
    }, 4000);
  };

  useEffect(() => {
    setCurrent(0);
  }, [matches.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [matches.length]);

  if (matches.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      go(current + (diff > 0 ? 1 : -1));
      resetTimer();
    }
    touchStartX.current = null;
  };

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
          boxShadow: "0 4px 14px rgba(225,29,72,0.35)",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Decorative blob */}
        <div
          className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {/* Slides */}
        <div
          style={{
            display: "flex",
            transform: `translateX(-${current * 100}%)`,
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {matches.map((match) => {
            const min = getMinute(match.match_date);
            return (
              <div key={match.id} style={{ minWidth: "100%", boxSizing: "border-box" }}>
                <div className="px-4 pt-3 pb-3.5">
                  {/* Badge row */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.9)" }}>
                      En vivo
                    </span>
                    <span className="text-[10px] ml-auto tabular-nums" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Grupo {match.group_name} · {min}&apos;
                    </span>
                    {matches.length > 1 && (
                      <span className="text-[10px] font-semibold ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {current + 1}/{matches.length}
                      </span>
                    )}
                  </div>

                  {/* Teams + score */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{match.home_flag}</span>
                      <span className="text-sm font-bold text-white truncate">{match.home_team}</span>
                    </div>
                    <div
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                    >
                      <span className="text-xl font-extrabold text-white tabular-nums" style={{ fontFamily: "Inter, sans-serif" }}>
                        {match.home_score ?? "·"}
                      </span>
                      <span className="font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>-</span>
                      <span className="text-xl font-extrabold text-white tabular-nums" style={{ fontFamily: "Inter, sans-serif" }}>
                        {match.away_score ?? "·"}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
                      <span className="text-sm font-bold text-white truncate text-right">{match.away_team}</span>
                      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{match.away_flag}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        {matches.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3 relative z-10">
            {matches.map((_, i) => (
              <button
                key={i}
                onClick={() => { go(i); resetTimer(); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 18 : 6,
                  height: 6,
                  background: i === current ? "white" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
