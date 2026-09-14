"use client";

import { useCollection } from "@/hooks/use-campus-data";
import { useState } from "react";
import {
  IconChevronLeft,
  IconNavigation,
  IconSparkles,
  IconWalk,
  IconX,
} from "@/components/icons";

interface IndoorRoutingModalProps {
  buildingName: string;
  onClose: () => void;
  onShare?: (msg: string) => void;
}

interface RoomInfo {
  id: string;
  name: string;
  floor: number;
  type: "studio" | "lab" | "lecture" | "utility";
  x: number;
  y: number;
  w: number;
  h: number;
  description: string;
}

const SEED_BLOCK34_ROOMS: RoomInfo[] = [
  {
    id: "r204",
    name: "Room 204 · Architecture & Design Studio",
    floor: 2,
    type: "studio",
    x: 62,
    y: 26,
    w: 28,
    h: 34,
    description: "Equipped with light tables, cutting mats, and group critique walls.",
  },
  {
    id: "r201",
    name: "Room 201 · Human-Computer Interaction Lab",
    floor: 2,
    type: "lab",
    x: 10,
    y: 26,
    w: 24,
    h: 34,
    description: "Mac workstations, eye-tracking rigs, and UI testing pods.",
  },
  {
    id: "r208",
    name: "Room 208 · Smart Lecture Theatre",
    floor: 2,
    type: "lecture",
    x: 36,
    y: 12,
    w: 24,
    h: 22,
    description: "Acoustic amphitheatre seating for 120 students.",
  },
  {
    id: "r102",
    name: "Room 102 · Digital Fabrication & 3D Lab",
    floor: 1,
    type: "lab",
    x: 14,
    y: 28,
    w: 32,
    h: 36,
    description: "Laser cutters, Ultimaker 3D printers, and foam shapers.",
  },
  {
    id: "rg01",
    name: "Ground Floor · Student Exhibition Gallery",
    floor: 0,
    type: "studio",
    x: 20,
    y: 25,
    w: 60,
    h: 40,
    description: "Open atrium hosting term-end design displays and coffee cart.",
  },
];

export function IndoorRoutingModal({
  buildingName,
  onClose,
  onShare,
}: IndoorRoutingModalProps) {

  const {items:stored_BLOCK34_ROOMS}=useCollection<(typeof SEED_BLOCK34_ROOMS)[number]>('rooms');
  const BLOCK34_ROOMS=stored_BLOCK34_ROOMS.length?stored_BLOCK34_ROOMS:SEED_BLOCK34_ROOMS;
  const [selectedFloor, setSelectedFloor] = useState<number>(2);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo>(BLOCK34_ROOMS[0]);
  const [copied, setCopied] = useState(false);

  const floorRooms = BLOCK34_ROOMS.filter((r) => r.floor === selectedFloor);

  const handleCopy = () => {
    const text = `${buildingName} · Floor ${selectedFloor === 0 ? "G" : selectedFloor} · ${selectedRoom.name}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShare?.(`Copied room coordinates: ${text}`);
  };

  const steps = [
    {
      step: 1,
      instruction: "Enter via East Entrance Ramp",
      detail: "Accessible ramp next to the bicycle racks",
      time: "0.5 min",
    },
    {
      step: 2,
      instruction: selectedFloor === 0 ? "Walk straight into Atrium" : `Take Lift B or North Stairs to Floor ${selectedFloor}`,
      detail: selectedFloor === 0 ? "Past the campus security desk" : "Elevators operate on high-speed priority during class changeovers",
      time: "0.5 min",
    },
    {
      step: 3,
      instruction: "Turn left along the Central Skybridge",
      detail: "Pass the filtered water station & student lockers",
      time: "0.3 min",
    },
    {
      step: 4,
      instruction: `Arrive at ${selectedRoom.name.split("·")[0].trim()}`,
      detail: selectedRoom.description,
      time: "0.2 min",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-pine-ink/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-line bg-paper shadow-2xl overflow-hidden animate-sheet-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-cream/90 px-5 py-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine/10 text-pine">
              <IconNavigation size={18} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-sm font-bold text-ink truncate max-w-[240px]">
                  {buildingName}
                </h2>
                <span className="rounded-full bg-pine/10 px-2 py-0.5 text-[10px] font-bold text-pine">
                  Indoor GPS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-ink-faint">
                Turn-by-turn floor & studio pathfinding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-paper text-ink-faint transition-colors hover:text-ink hover:bg-line/40"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="no-scrollbar overflow-y-auto p-4 space-y-4">
          {/* Floor Level Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Select Floor Level
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5 rounded-2xl border border-line bg-cream p-1">
              {[
                { level: 0, label: "Ground (G)" },
                { level: 1, label: "Floor 1" },
                { level: 2, label: "Floor 2" },
                { level: 3, label: "Floor 3" },
              ].map((f) => {
                const isSelected = selectedFloor === f.level;
                return (
                  <button
                    key={f.level}
                    onClick={() => {
                      setSelectedFloor(f.level);
                      const matching = BLOCK34_ROOMS.find((r) => r.floor === f.level);
                      if (matching) setSelectedRoom(matching);
                    }}
                    className={`cursor-pointer rounded-xl py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-pine text-cream shadow-xs"
                        : "text-ink-soft hover:text-ink hover:bg-paper"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Floor Blueprint Canvas */}
          <div className="relative overflow-hidden rounded-2xl border border-line bg-cream shadow-xs">
            <div className="absolute top-2.5 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-paper/90 px-2 py-1 text-[10px] font-bold text-ink shadow-2xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-pine animate-pulse" />
              Level {selectedFloor === 0 ? "Ground" : selectedFloor} Architectural Plan
            </div>

            <svg
              viewBox="0 0 100 70"
              className="h-48 w-full select-none"
              style={{ background: "#f8f5ee" }}
            >
              <defs>
                {/* Blueprint grid pattern */}
                <pattern
                  id="grid"
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 5 0 L 0 0 0 5"
                    fill="none"
                    stroke="#e8e2d2"
                    strokeWidth="0.4"
                  />
                </pattern>
              </defs>
              <rect width="100" height="70" fill="url(#grid)" />

              {/* Building boundary */}
              <rect
                x="6"
                y="8"
                width="88"
                height="54"
                rx="4"
                fill="#ffffff"
                stroke="#d6cdb7"
                strokeWidth="1.2"
              />

              {/* Central Corridor */}
              <rect
                x="6"
                y="36"
                width="88"
                height="10"
                fill="#f1ece0"
                stroke="#dfd8c5"
                strokeWidth="0.6"
              />
              <text
                x="50"
                y="42.5"
                textAnchor="middle"
                fontSize="2.4"
                fill="#9a917f"
                fontWeight="700"
                letterSpacing="0.4"
              >
                CENTRAL SKYBRIDGE CORRIDOR
              </text>

              {/* Elevators & Stairs */}
              <g transform="translate(10, 48)">
                <rect width="14" height="10" rx="1.5" fill="#e7dfcb" stroke="#cfc3a7" strokeWidth="0.6" />
                <text x="7" y="6.2" textAnchor="middle" fontSize="2.2" fill="#5c5444" fontWeight="bold">
                  🛗 Lift B
                </text>
              </g>
              <g transform="translate(76, 48)">
                <rect width="14" height="10" rx="1.5" fill="#e7dfcb" stroke="#cfc3a7" strokeWidth="0.6" />
                <text x="7" y="6.2" textAnchor="middle" fontSize="2.2" fill="#5c5444" fontWeight="bold">
                  🪜 Stairs N
                </text>
              </g>

              {/* Rooms for this floor */}
              {floorRooms.map((room) => {
                const isTarget = selectedRoom.id === room.id;
                return (
                  <g
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className="cursor-pointer transition-transform hover:opacity-90"
                  >
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.w}
                      height={room.h}
                      rx="2"
                      fill={isTarget ? "#e9f2eb" : "#fdfcf9"}
                      stroke={isTarget ? "#1d5c43" : "#d8cfb9"}
                      strokeWidth={isTarget ? "1.4" : "0.8"}
                    />
                    <text
                      x={room.x + room.w / 2}
                      y={room.y + room.h / 2 - 1}
                      textAnchor="middle"
                      fontSize="2.8"
                      fill={isTarget ? "#1d5c43" : "#443e33"}
                      fontWeight="700"
                    >
                      {room.name.split("·")[0].trim()}
                    </text>
                    <text
                      x={room.x + room.w / 2}
                      y={room.y + room.h / 2 + 3}
                      textAnchor="middle"
                      fontSize="2.1"
                      fill={isTarget ? "#2b6b50" : "#8d8473"}
                      fontWeight="600"
                    >
                      {room.type.toUpperCase()}
                    </text>

                    {/* Glowing beacon for active target */}
                    {isTarget && (
                      <g>
                        <circle
                          cx={room.x + room.w / 2}
                          cy={room.y + 4}
                          r="4"
                          fill="#1d5c43"
                          opacity="0.25"
                        >
                          <animate
                            attributeName="r"
                            values="2;5;2"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle
                          cx={room.x + room.w / 2}
                          cy={room.y + 4}
                          r="1.8"
                          fill="#1d5c43"
                        />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Animated walking trajectory line from Lift to active room */}
              {selectedRoom.floor === selectedFloor && (
                <g>
                  <path
                    d={`M 17 48 L 17 41 L ${selectedRoom.x + selectedRoom.w / 2} 41 L ${selectedRoom.x + selectedRoom.w / 2} ${selectedRoom.y + selectedRoom.h - 1}`}
                    fill="none"
                    stroke="#1d5c43"
                    strokeWidth="1.2"
                    strokeDasharray="2.5 1.5"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="8;0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                  {/* Start pin at lift */}
                  <circle cx="17" cy="48" r="1.5" fill="#1d5c43" />
                </g>
              )}
            </svg>

            <div className="border-t border-line bg-paper/95 p-2.5 px-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pine-soft text-pine">
                  <IconSparkles size={14} />
                </span>
                <span className="truncate">{selectedRoom.name}</span>
              </div>
              <button
                onClick={handleCopy}
                className="cursor-pointer rounded-lg bg-cream px-2.5 py-1 text-[11px] font-bold text-ink-soft border border-line shadow-2xs hover:text-ink active:scale-95"
              >
                {copied ? "Copied!" : "Share Pin"}
              </button>
            </div>
          </div>

          {/* Turn-by-Turn Guidance */}
          <div className="rounded-2xl border border-line bg-cream p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <IconWalk size={16} className="text-pine" />
                <span>Turn-by-Turn Indoor Route</span>
              </div>
              <span className="text-[11px] font-bold text-pine">
                ~1.5 min · 45 steps
              </span>
            </div>

            <div className="space-y-2.5">
              {steps.map((st) => (
                <div key={st.step} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper text-[10px] font-bold text-pine shadow-2xs border border-line">
                    {st.step}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-ink">{st.instruction}</p>
                    <p className="text-[11px] font-medium text-ink-faint">{st.detail}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-ink-faint">
                    {st.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-line bg-cream/80 p-3 px-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl bg-pine py-2.5 font-display text-xs font-bold text-cream shadow-xs transition-transform active:scale-98"
          >
            Got it, Start Walking
          </button>
        </div>
      </div>
    </div>
  );
}
