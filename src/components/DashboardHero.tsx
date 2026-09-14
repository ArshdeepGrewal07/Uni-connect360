"use client";


import { IconLayers as Layers } from "@/components/icons";

interface DashboardHeroProps {
  totalFriends?: number;
}

export function DashboardHero({ totalFriends }: DashboardHeroProps) {
  return (
    <div className="w-full">
      {/* Header telemetry and live status */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          CAMPUS PULSE // <span className="text-slate-700 font-extrabold">COZY HUB</span>
        </h1>
        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full  rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Campus Harmony</span>
          <span className="text-emerald-600 font-bold">• Connected</span>
        </div>
      </div>

      {/* Hero Banner Card with Abstract Tower & Sun illustration */}
      <div
        className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] ring-1 ring-slate-100/80"
      >
        <div className="relative z-10">
          <div className="flex items-start gap-3.5">
            {/* Orange pastel layered icon box with glowing radiant rays */}
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fed7aa]/60 text-[#ea580c] shadow-xs">
              {/* Radiating micro-lines */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-1 text-[8px] font-black text-[#f97316]">
                <span className="-rotate-30">|</span>
                <span>|</span>
                <span className="rotate-30">|</span>
              </div>
              <Layers className="h-7 w-7" strokeWidth={2.4} />
            </div>

            <div className="min-w-0 flex-1 pr-14">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800 leading-none">
                {totalFriends ?? "—"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-bold text-slate-600 leading-snug">
                members in your campus directory
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  Campus community
                </span>
                <span>•</span>
                <span>Your shared space</span>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract Architectural Illustration: Soft Sun, Bell Tower & Rolling Green Hills */}
        <div className="pointer-events-none absolute -bottom-1 right-0 h-full w-36 sm:w-44 flex items-end justify-end overflow-hidden opacity-95">
          {/* Pastel Sun */}
          <div className="absolute top-2 right-14 sm:right-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#fde68a]/70" />

          {/* Rolling Hill Backdrop */}
          <div className="absolute -bottom-8 right-2 h-24 w-36 rounded-full bg-[#ecfdf5]/80" />

          {/* Deep Green Tree / Dome Silhouette */}
          <div className="absolute -bottom-4 right-1 h-20 w-14 rounded-t-full bg-[#2d6a4f]/80" />
          <div className="absolute -bottom-3 right-8 h-16 w-12 rounded-t-full bg-[#40916c]/70" />

          {/* Stylized Campus Tower */}
          <div className="relative z-10 mr-10 sm:mr-14 mb-0 flex flex-col items-center">
            {/* Spire */}
            <div className="h-2 w-0.5 bg-slate-700" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            {/* Dome roof */}
            <div className="h-3 w-5 rounded-t-full bg-slate-700" />
            {/* Tower Shaft */}
            <div className="relative h-16 w-6 bg-white border border-slate-700 rounded-t-xs flex flex-col items-center pt-1.5 shadow-2xs">
              {/* Arch window */}
              <div className="h-3.5 w-2 rounded-t-full bg-slate-700" />
              {/* Lower window */}
              <div className="mt-2 h-3.5 w-2 rounded-t-full bg-slate-700" />
            </div>
          </div>

          {/* Foreground Soft Pastel Grass Wave */}
          <div className="absolute -bottom-6 -right-4 h-14 w-28 rounded-t-full bg-[#52b788]/60 z-20" />
        </div>
      </div>
    </div>
  );
}
