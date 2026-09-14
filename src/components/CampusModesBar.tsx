"use client";

import { useCampusMode, type CampusMode } from "@/context/AppModeContext";

export function CampusModesBar({
  onAction,
}: {
  onAction?: (mode: CampusMode) => void;
}) {
  const { mode, setMode } = useCampusMode();

  const modes: {
    key: CampusMode;
    label: string;
    icon: string;
    badge: string;
    hint: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
  }[] = [
    {
      key: "solo",
      label: "Solo Zen",
      icon: "🧘",
      badge: "Focus",
      hint: "Mutes alerts · Highlights quiet low-traffic havens",
      activeBg: "bg-[#2d4038]",
      activeText: "text-[#e9f2eb]",
      activeBorder: "border-[#52796f]",
    },
    {
      key: "duo",
      label: "Duo Beacon",
      icon: "🤝",
      badge: "Match",
      hint: "1-on-1 study buddy & project matchmaking",
      activeBg: "bg-[#78350f]",
      activeText: "text-[#fef3c7]",
      activeBorder: "border-[#b45309]",
    },
    {
      key: "group",
      label: "Squad Rally",
      icon: "👥",
      badge: "Group",
      hint: "Drop temporary map geo-pins to gather friends",
      activeBg: "bg-[#1e3a8a]",
      activeText: "text-[#dbeafe]",
      activeBorder: "border-[#3b82f6]",
    },
  ];

  const currentMode = modes.find((m) => m.key === mode) || modes[0];

  return (
    <div className="apple-glass rounded-2xl p-2.5 shadow-sm transition-all duration-300">
      {/* iOS Segmented Control Switcher */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink/5 p-1 backdrop-blur-md">
        {modes.map((m) => {
          const isActive = mode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); onAction?.(m.key); }}
              className={`tap-spring flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-300 ${
                isActive
                  ? `${m.activeBg} ${m.activeText} shadow-md border ${m.activeBorder} scale-[1.02]`
                  : "text-ink-soft hover:text-ink hover:bg-white/40"
              }`}
            >
              <span className="transition-transform duration-300">{m.icon}</span>
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Context Description & Action */}
      <div className="mt-2.5 flex items-center justify-between px-1 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <p className="truncate font-medium text-ink-faint">
            {currentMode.hint}
          </p>
        </div>

        {onAction && (
          <button
            onClick={() => onAction(mode)}
            className="tap-spring cursor-pointer shrink-0 rounded-xl bg-cream/90 px-3 py-1.5 text-[10.5px] font-bold text-ink border border-line shadow-2xs hover:bg-cream"
          >
            {mode === "solo" && "Focus Timer ⏱️"}
            {mode === "duo" && "Broadcast 📡"}
            {mode === "group" && "Drop Pin 📍"}
          </button>
        )}
      </div>
    </div>
  );
}
