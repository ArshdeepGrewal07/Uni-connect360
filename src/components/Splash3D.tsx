"use client";

import { useEffect, useState } from "react";

interface SplashProps {
  onComplete?: () => void;
  statusText?: string;
}

export function Startup3DAnimation({ onComplete, statusText = "Connecting Campus Network..." }: SplashProps) {
  const [phase, setPhase] = useState<"init" | "expanded" | "glitch" | "fadeout">("init");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("expanded"), 200);
    const t2 = setTimeout(() => setPhase("glitch"), 1300);
    const t3 = setTimeout(() => setPhase("fadeout"), 2200);
    const t4 = setTimeout(() => onComplete?.(), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  // Generate 14 concentric 3D gyroscopic rings
  const circles = Array.from({ length: 14 }, (_, i) => {
    const idx = i + 1;
    const baseSize = 24 + idx * 16;
    const zDepth = (idx - 7) * 22;
    const borderColor =
      idx % 3 === 0
        ? "rgba(217, 143, 34, 0.7)"
        : idx % 2 === 0
          ? "rgba(29, 92, 67, 0.85)"
          : "rgba(245, 241, 232, 0.45)";

    return { idx, baseSize, zDepth, borderColor };
  });

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#040e0a] transition-opacity duration-700 select-none ${
        phase === "fadeout" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Cinematic Letterbox Bars */}
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[110] h-9 sm:h-12 bg-black/90 backdrop-blur-md transition-transform duration-700 ease-out border-b border-white/5 ${
          phase === "fadeout" ? "-translate-y-full" : "translate-y-0"
        }`}
      />
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-[110] h-9 sm:h-12 bg-black/90 backdrop-blur-md transition-transform duration-700 ease-out border-t border-white/5 ${
          phase === "fadeout" ? "translate-y-full" : "translate-y-0"
        }`}
      />

      {/* Cyber grid & ambient deep glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#082016]/80 via-[#040e0a] to-[#020705] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none" />

      {/* Cinematic Anamorphic Horizontal Lens Flares */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1px] opacity-70 cinematic-streak" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent blur-xl opacity-60 cinematic-streak" />

      {/* Floating 3D Cyber Particles & Embers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { top: "25%", left: "20%", delay: "0s", color: "bg-amber-400" },
          { top: "35%", left: "75%", delay: "1.2s", color: "bg-emerald-400" },
          { top: "65%", left: "15%", delay: "2.4s", color: "bg-cyan-400" },
          { top: "70%", left: "80%", delay: "0.8s", color: "bg-amber-300" },
          { top: "45%", left: "10%", delay: "1.8s", color: "bg-emerald-300" },
          { top: "55%", left: "90%", delay: "2.8s", color: "bg-pine-soft" },
        ].map((p, i) => (
          <div
            key={i}
            className={`particle-ember absolute h-1.5 w-1.5 rounded-full ${p.color} shadow-[0_0_8px_currentColor]`}
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          />
        ))}
      </div>

      {/* Sci-Fi HUD Corner Reticles */}
      <div className="absolute top-14 left-5 sm:left-8 font-mono text-[9.5px] tracking-widest text-emerald-400/75 uppercase pointer-events-none flex flex-col gap-0.5 z-20">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>GRID // 31.2536° N · 75.7037° E</span>
        </span>
        <span className="text-amber-400/70">SYS // QUAD_MOTION_CORE</span>
      </div>
      <div className="absolute top-14 right-5 sm:right-8 font-mono text-[9.5px] tracking-widest text-emerald-400/75 uppercase pointer-events-none text-right flex flex-col gap-0.5 z-20">
        <span>FREQ // 5.84 GHz SYNC</span>
        <span className="text-amber-400/70">LINK // 99.8% OPTIMAL</span>
      </div>

      {/* SVG ClipPath Defs for Bagel geometry */}
      <BagelClipDefs />

      {/* 3D Kinetic Scene */}
      <div className="intro-3d-scene relative flex h-72 w-72 items-center justify-center">
        <div className="intro-3d-eye-wrapper relative flex h-full w-full items-center justify-center">
          {/* 14 concentric 3D circle rings */}
          {circles.map((c) => (
            <div
              key={c.idx}
              className={`intro-circle-ring circle-${c.idx} transition-all duration-1000 ease-out`}
              style={{
                width: c.baseSize,
                height: c.baseSize,
                border: `1.5px solid ${c.borderColor}`,
                transform:
                  phase === "init"
                    ? "rotateX(0deg) rotateY(0deg) translateZ(0px) scale(0.2)"
                    : `rotateX(${c.idx * 14}deg) rotateY(${c.idx * 26}deg) translateZ(${c.zDepth}px) scale(1)`,
                boxShadow: `0 0 18px ${c.borderColor}`,
                opacity: phase === "init" ? 0 : 0.85 - c.idx * 0.03,
              }}
            />
          ))}

          {/* Central 3D Cyber Eye & Bagel Clip Paths */}
          <div
            className={`eye relative flex h-48 w-48 items-center justify-center eye-glow transition-transform duration-700 ${
              phase === "glitch" ? "glitch-flash" : ""
            }`}
          >
            {/* Bagel 1 */}
            <div
              className="bagel-spin-slow absolute h-44 w-44 bg-gradient-to-tr from-pine via-amber to-emerald-400 opacity-90"
              style={{ clipPath: "url(#bagel1)" }}
            />

            {/* Bagel 2 */}
            <div
              className="bagel-spin-reverse absolute h-34 w-34 bg-gradient-to-bl from-amber via-yellow-300 to-pine-soft opacity-85"
              style={{ clipPath: "url(#bagel2)" }}
            />

            {/* Bagel 3 */}
            <div
              className="bagel-spin-slow absolute h-28 w-28 bg-gradient-to-r from-emerald-500 to-amber-500 opacity-80"
              style={{ clipPath: "url(#bagel3)" }}
            />

            {/* Bagel 4 & Core Iris */}
            <div
              className="absolute h-18 w-18 rounded-full bg-gradient-to-br from-cream via-amber-200 to-white shadow-[0_0_25px_rgba(255,255,255,0.9)] flex items-center justify-center"
              style={{ clipPath: "url(#bagel4)" }}
            >
              <div className="h-5 w-5 rounded-full bg-pine-ink shadow-inner animate-ping opacity-75" />
              <div className="absolute h-3 w-3 rounded-full bg-cream" />
            </div>

            {/* Glitch & Hologram Fragments */}
            <div className="fragment-1 absolute -top-4 -right-4 h-6 w-12 border-t-2 border-r-2 border-amber opacity-70" />
            <div className="fragment-2 absolute -bottom-3 -left-3 h-5 w-10 border-b-2 border-l-2 border-emerald-400 opacity-70" />
            <div className="fragment-3 absolute top-1/2 -left-6 h-8 w-1.5 bg-amber-400/80 blur-[0.5px]" />
          </div>
        </div>
      </div>

      {/* Brand & Loading Status with Cinematic Typography */}
      <div className="mt-8 flex flex-col items-center gap-2 text-center z-20">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber animate-ping" />
          <h2 className="font-display text-lg font-black tracking-[0.25em] text-cream uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            Quad Campus
          </h2>
          <span className="rounded bg-gradient-to-r from-pine to-emerald-600 px-2 py-0.5 text-[9px] font-black text-cream uppercase tracking-wider shadow-sm">
            Cinematic 3D
          </span>
        </div>
        <p className="font-mono text-[11px] font-semibold text-emerald-200/80 tracking-widest uppercase">
          {statusText}
        </p>

        {/* Smooth Progress Bar with Neon Glow */}
        <div className="mt-2 h-1.5 w-52 overflow-hidden rounded-full bg-white/10 p-[1px] shadow-[0_0_15px_rgba(38,118,84,0.3)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pine via-amber to-emerald-300 shadow-[0_0_10px_#10b981] transition-all duration-1000 ease-out"
            style={{ width: phase === "init" ? "20%" : phase === "expanded" ? "75%" : "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Interactive In-App 3D Eye & Gyroscopic Hologram Widget                    */
/*  Used inside the active app (e.g. Home Pulse, Headers, Modal overlays)    */
/* -------------------------------------------------------------------------- */

export function Cyber3DEyeWidget({ size = 110, className = "" }: { size?: number; className?: string }) {
  const scale = size / 190;

  return (
    <div
      className={`intro-3d-scene relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Hologram Radar Arc */}
      <div className="absolute inset-0 rounded-full border border-emerald-500/20 hud-ring-pulse pointer-events-none" />
      <div className="radar-sweep absolute inset-1 rounded-full border-t border-r border-amber-400/40 opacity-70 pointer-events-none" />

      {/* Cardinal Telemetry Degree Ticks */}
      <span className="absolute top-0.5 text-[7px] font-mono font-bold text-emerald-400/60 leading-none">0°</span>
      <span className="absolute right-0.5 text-[7px] font-mono font-bold text-emerald-400/60 leading-none">90°</span>
      <span className="absolute bottom-0.5 text-[7px] font-mono font-bold text-emerald-400/60 leading-none">180°</span>
      <span className="absolute left-0.5 text-[7px] font-mono font-bold text-emerald-400/60 leading-none">270°</span>

      <div
        className="intro-3d-eye-wrapper relative flex items-center justify-center"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Concentric 3D Rings 1..6 for compact widget */}
        {[1, 3, 5, 7, 9, 11].map((idx) => {
          const baseSize = 30 + idx * 14;
          const zDepth = (idx - 6) * 14;
          const borderColor = idx % 2 === 0 ? "rgba(217, 143, 34, 0.7)" : "rgba(29, 92, 67, 0.85)";
          return (
            <div
              key={idx}
              className={`intro-circle-ring circle-${idx}`}
              style={{
                width: baseSize,
                height: baseSize,
                border: `1.5px solid ${borderColor}`,
                transform: `rotateX(${idx * 16}deg) rotateY(${idx * 28}deg) translateZ(${zDepth}px)`,
                boxShadow: `0 0 12px ${borderColor}`,
                opacity: 0.7,
              }}
            />
          );
        })}

        {/* Central 3D Cyber Eye */}
        <div className="eye relative flex h-36 w-36 items-center justify-center eye-glow">
          {/* Bagel 1 */}
          <div
            className="bagel-spin-slow absolute h-32 w-32 bg-gradient-to-tr from-pine via-amber to-emerald-400 opacity-90"
            style={{ clipPath: "url(#bagel1)" }}
          />
          {/* Bagel 2 */}
          <div
            className="bagel-spin-reverse absolute h-24 w-24 bg-gradient-to-bl from-amber via-yellow-300 to-pine-soft opacity-85"
            style={{ clipPath: "url(#bagel2)" }}
          />
          {/* Bagel 3 */}
          <div
            className="bagel-spin-slow absolute h-18 w-18 bg-gradient-to-r from-emerald-500 to-amber-500 opacity-80"
            style={{ clipPath: "url(#bagel3)" }}
          />
          {/* Iris Pupil */}
          <div
            className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-cream via-amber-200 to-white shadow-[0_0_18px_rgba(255,255,255,0.95)] flex items-center justify-center"
            style={{ clipPath: "url(#bagel4)" }}
          >
            <div className="h-3.5 w-3.5 rounded-full bg-pine-ink shadow-inner animate-ping opacity-75" />
            <div className="absolute h-2 w-2 rounded-full bg-cream" />
          </div>

          {/* Hologram fragments */}
          <div className="fragment-1 absolute -top-2 -right-2 h-4 w-8 border-t-2 border-r-2 border-amber opacity-80" />
          <div className="fragment-2 absolute -bottom-2 -left-2 h-3 w-6 border-b-2 border-l-2 border-emerald-400 opacity-80" />
        </div>
      </div>
    </div>
  );
}

export function BagelClipDefs() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none opacity-0" aria-hidden="true">
      <defs>
        <clipPath id="bagel1">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M95 190C147.467 190 190 147.467 190 95C190 42.533 147.467 0 95 0C42.533 0 0 42.533 0 95C0 147.467 42.533 190 95 190ZM95 120C108.807 120 120 108.807 120 95C120 81.1929 108.807 70 95 70C81.1929 70 70 81.1929 70 95C70 108.807 81.1929 120 95 120Z"
          />
        </clipPath>
        <clipPath id="bagel2">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M71 142C110.212 142 142 110.212 142 71C142 31.7878 110.212 0 71 0C31.7878 0 0 31.7878 0 71C0 110.212 31.7878 142 71 142ZM71 139C108.555 139 139 108.555 139 71C139 33.4446 108.555 3 71 3C33.4446 3 3 33.4446 3 71C3 108.555 33.4446 139 71 139Z"
          />
        </clipPath>
        <clipPath id="bagel3">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M60 120C93.1372 120 120 93.1372 120 60C120 26.8628 93.1372 0 60 0C26.8628 0 0 26.8628 0 60C0 93.1372 26.8628 120 60 120ZM60 115C90.3757 115 115 90.3757 115 60C115 29.6243 90.3757 5 60 5C29.6243 5 5 29.6243 5 60C5 90.3757 29.6243 115 60 115Z"
          />
        </clipPath>
        <clipPath id="bagel4">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M38 76C58.9868 76 76 58.9868 76 38C76 17.0132 58.9868 0 38 0C17.0132 0 0 17.0132 0 38C0 58.9868 17.0132 76 38 76ZM38 72C56.7777 72 72 56.7776 72 38C72 19.2224 56.7777 4 38 4C19.2223 4 4 19.2224 4 38C4 56.7776 19.2223 72 38 72Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
