"use client";

import { useCollection } from "@/hooks/use-campus-data";
import { useEffect, useState } from "react";
import {
  IconCamera,
  IconChevronLeft,
  IconNavigation,
  IconSparkles,
  IconWalk,
  IconX,
} from "@/components/icons";

interface ARDestination {
  id: string;
  name: string;
  building: string;
  floor: string;
  distanceMeters: number;
  instruction: string;
  directionDeg: number; // 0 is straight ahead, -30 is slight left, +40 is right
}

const SEED_AR_DESTINATIONS: ARDestination[] = [
  {
    id: "ar-1",
    name: "Room 204 · Architecture & Design Studio",
    building: "Block 34",
    floor: "Level 2",
    distanceMeters: 45,
    instruction: "Turn Left at the Central Atrium Skybridge",
    directionDeg: -25,
  },
  {
    id: "ar-2",
    name: "Room 201 · Generative AI & HCI Lab",
    building: "Block 34",
    floor: "Level 2",
    distanceMeters: 70,
    instruction: "Walk straight past North Stairwell to Door 201",
    directionDeg: 10,
  },
  {
    id: "ar-3",
    name: "Prof. R. Mehta's Research Cabin (Room 312)",
    building: "Block 34",
    floor: "Level 3",
    distanceMeters: 110,
    instruction: "Take Lift B to Floor 3, turn right down faculty wing",
    directionDeg: 35,
  },
  {
    id: "ar-4",
    name: "Central Library · Quiet Reading Room 3",
    building: "Central Library",
    floor: "Level 2",
    distanceMeters: 160,
    instruction: "Exit East Ramp, cross quad pathway toward Library Rotunda",
    directionDeg: -5,
  },
];

export function ARCampusLens({
  onClose,
}: {
  onClose: () => void;
}) {

  const {items:stored_AR_DESTINATIONS}=useCollection<(typeof SEED_AR_DESTINATIONS)[number]>('destinations');
  const AR_DESTINATIONS=stored_AR_DESTINATIONS.length?stored_AR_DESTINATIONS:SEED_AR_DESTINATIONS;
  const [selectedDest, setSelectedDest] = useState<ARDestination>(AR_DESTINATIONS[0]);
  const [gyroOffset, setGyroOffset] = useState(0);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Simulated gyroscope drift / smooth perspective sway
  useEffect(() => {
    const interval = setInterval(() => {
      setGyroOffset((prev) => Math.sin(Date.now() / 800) * 8);
      setScanStep((s) => (s + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const totalAngle = selectedDest.directionDeg + gyroOffset;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none animate-fade-in">
      {/* 1. Simulated Camera Feed Background with Architectural Hallway & Grid */}
      <div className="relative flex-1 overflow-hidden">
        {/* Synthetic photorealistic campus corridor environment */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16, 36, 28, 0.4) 0%, rgba(4, 12, 8, 0.95) 100%), linear-gradient(135deg, #182820 0%, #0d1612 100%)`,
            filter: flashlightOn ? "brightness(1.4) contrast(1.1)" : "brightness(1.0)",
          }}
        >
          {/* Perspective grid lines simulating floor & ceiling depth */}
          <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
            {/* Vanishing point at (50%, 45%) */}
            <line x1="50%" y1="45%" x2="0%" y2="100%" stroke="#34d399" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="50%" y1="45%" x2="100%" y2="100%" stroke="#34d399" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="50%" y1="45%" x2="30%" y2="100%" stroke="#34d399" strokeWidth="0.75" />
            <line x1="50%" y1="45%" x2="70%" y2="100%" stroke="#34d399" strokeWidth="0.75" />
            {/* Horizontal floor depth rungs */}
            <line x1="42%" y1="52%" x2="58%" y2="52%" stroke="#34d399" strokeWidth="0.5" />
            <line x1="36%" y1="62%" x2="64%" y2="62%" stroke="#34d399" strokeWidth="0.7" />
            <line x1="26%" y1="76%" x2="74%" y2="76%" stroke="#34d399" strokeWidth="1" />
            <line x1="12%" y1="92%" x2="88%" y2="92%" stroke="#34d399" strokeWidth="1.2" />
          </svg>

          {/* Hallway pillars and door markers silhouette */}
          <div className="absolute inset-x-0 bottom-0 top-[40%] flex justify-between px-6 pointer-events-none opacity-40">
            <div className="w-12 h-full border-r-2 border-emerald-500/40 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="w-12 h-full border-l-2 border-emerald-500/40 bg-gradient-to-l from-black/80 to-transparent" />
          </div>
        </div>

        {/* 2. Floating 3D Holographic Directional AR Arrows */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-200"
          style={{
            transform: `translate(${totalAngle * 2.5}px, 0px)`,
          }}
        >
          {/* 3D Arrow Chevron floating in space */}
          <div className="relative flex flex-col items-center">
            {/* Hologram Pulse Ring */}
            <div className="absolute -top-12 h-24 w-24 rounded-full border border-emerald-400/40 animate-ping opacity-60" />
            
            {/* Floating Destination Pin Halo */}
            <div className="animate-bounce-subtle rounded-2xl border border-emerald-400/80 bg-black/75 px-4 py-2 text-center shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-1.5 justify-center">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {selectedDest.building} · {selectedDest.floor}
                </span>
              </div>
              <p className="font-display text-xs font-extrabold text-white mt-0.5">
                {selectedDest.name}
              </p>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                📍 {selectedDest.distanceMeters}m ahead
              </span>
            </div>

            {/* Glowing Projected Floor Vector Path */}
            <svg width="180" height="150" viewBox="0 0 180 150" className="mt-2">
              <defs>
                <linearGradient id="ar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {/* Converging 3D path */}
              <polygon points="90,20 140,150 40,150" fill="url(#ar-grad)" />
              {/* Dynamic Chevron arrows pointing forward */}
              <path d="M 65 120 L 90 95 L 115 120" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
              </path>
              <path d="M 75 75 L 90 60 L 105 75" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
        </div>

        {/* 3. Top HUD Status Bar */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <button
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-95"
          >
            <IconChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 border border-white/20 backdrop-blur-md text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold tracking-wide text-white">
              CAMPUS LENS // AR ACTIVE
            </span>
          </div>

          <button
            onClick={() => setFlashlightOn(!flashlightOn)}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md active:scale-95 ${
              flashlightOn
                ? "bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/40"
                : "bg-black/60 text-white border-white/20"
            }`}
            title="Toggle LiDAR Flashlight"
          >
            🔦
          </button>
        </div>

        {/* 4. Real-time Compass & Distance Heading Card */}
        <div className="absolute bottom-24 inset-x-4 z-20 space-y-2">
          {/* Turn Guidance Pill */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-black/80 p-3 shadow-2xl backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <IconNavigation size={22} className="rotate-[-45deg]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-bold text-white leading-snug">
                {selectedDest.instruction}
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-[10px] font-mono text-emerald-300">
                <span>Distance: {selectedDest.distanceMeters}m</span>
                <span>•</span>
                <span>Est: {Math.max(1, Math.round(selectedDest.distanceMeters / 70))} min walk</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Target Destination Selector Tray */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-black/90 border-t border-white/15 backdrop-blur-md z-20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 px-1">
            Switch Indoor Target
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {AR_DESTINATIONS.map((d) => {
              const isSelected = selectedDest.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDest(d)}
                  className={`cursor-pointer shrink-0 rounded-xl px-3 py-2 text-left border transition-all ${
                    isSelected
                      ? "bg-emerald-600/30 border-emerald-400 text-white shadow-xs"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <p className="font-display text-xs font-bold truncate max-w-[170px]">{d.name}</p>
                  <p className="text-[10px] font-mono text-emerald-300">{d.building} · {d.distanceMeters}m</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
