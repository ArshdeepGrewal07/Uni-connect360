"use client";

import { useCollection, useSavedState } from "@/hooks/use-campus-data";
import { useApp } from "@/app/page";
import { useState } from "react";
import { useCampusMode } from "@/context/AppModeContext";
import {
  IconCalendar,
  IconFlame,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

interface CultureEvent {
  id: string;
  title: string;
  genre: "Dance" | "Music" | "Theatre" | "Poetry";
  location: string;
  time: string;
  description: string;
  organizer: string;
}

const CULTURE_EVENTS: CultureEvent[] = [
  {
    id: "ce-1",
    title: "Battle of the Bands: Acoustic & Rock Face-Off",
    genre: "Music",
    location: "Shanti Devi Mittal Auditorium",
    time: "Tonight at 7:00 PM",
    description: "6 college bands competing for the Annual Trophy. Free student entry with ID.",
    organizer: "LPU Music Society",
  },
  {
    id: "ce-2",
    title: "Urban Street Play: 'The 8 AM Attendance Paradox'",
    genre: "Theatre",
    location: "Central Fountain Amphitheatre",
    time: "Tomorrow at 4:30 PM",
    description: "Satirical street play touching on engineering life, proxy dramas, and hostel curfew.",
    organizer: "Dramatics Club",
  },
  {
    id: "ce-3",
    title: "StepUp 2026: Inter-Department Hip-Hop Dance-Off",
    genre: "Dance",
    location: "Block 34 Open Quad",
    time: "Friday at 5:00 PM",
    description: "Popping, locking, and freestyle cypher. Guest judge from MTV Dance.",
    organizer: "Urban Groove Dance Crew",
  },
  {
    id: "ce-4",
    title: "Starlight Open Mic & Chai Poetry",
    genre: "Poetry",
    location: "Chai Tapri Pavilion Grass",
    time: "Saturday at 8:00 PM",
    description: "Bring your original poems, ghazals, or acoustic guitar under the campus lights.",
    organizer: "Literary Guild",
  },
];

interface FlashEvent {
  id: string;
  title: string;
  location: string;
  startsIn: string;
  attendeesCount: number;
  tags: string[];
}

const INITIAL_FLASH_EVENTS: FlashEvent[] = [
  {
    id: "fe-1",
    title: "⚡ Spontaneous Bollywood Flash Mob!",
    location: "Central Quad Water Fountain",
    startsIn: "Starting in 8 mins",
    attendeesCount: 38,
    tags: ["High Energy", "Dancers Welcome"],
  },
  {
    id: "fe-2",
    title: "🎸 Acoustic Guitar Jamming Circle",
    location: "Hostel B Front Lawn",
    startsIn: "Happening Right Now",
    attendeesCount: 16,
    tags: ["Sing-Along", "Chill"],
  },
  {
    id: "fe-3",
    title: "🎤 Freestyle Rap & Beatbox Cypher",
    location: "Behind Block 34 Stairs",
    startsIn: "In 20 mins",
    attendeesCount: 22,
    tags: ["Cypher", "Beatbox"],
  },
];

export function CampusCultureHub({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const { hypes, hypeEvent, practiceZones, claimPracticeZone } = useCampusMode();
  const [subTab, setSubTab] = useState<"hype" | "practice" | "flash">("hype");
  const {items:flashEvents,mutate}=useCollection<FlashEvent>('flash');
  const {items:cultureEvents}=useCollection<CultureEvent>('culture');
  const [claimModalZoneId, setClaimModalZoneId] = useState<string | null>(null);
  const [crewNameInput, setCrewNameInput] = useState("");

  const handleHype = async (eventId: string, title: string) => {
    if(!await hypeEvent(eventId))return;
    onToast?.(`🔥 Hyped up "${title}"! Hype rank increased!`, "ok");
  };

  const handleJoinFlash=async(id:string,title:string)=>{if(await mutate('join',{id}))onToast?.(`Joined ${title}.`,'ok');};

  const handleConfirmClaim = async () => {
    if (!claimModalZoneId || !crewNameInput.trim()) return;
    if(!await claimPracticeZone(claimModalZoneId, crewNameInput.trim()))return;
    onToast?.(`Space reserved for "${crewNameInput.trim()}"! No double booking.`, "ok");
    setClaimModalZoneId(null);
    setCrewNameInput("");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub Navigation Bar */}
      <div className="flex rounded-2xl border border-line bg-cream p-1 shadow-2xs">
        {[
          { key: "hype", label: "🔥 The Hype Meter" },
          { key: "practice", label: "🎭 Practice Zones" },
          { key: "flash", label: "⚡ Flash Events" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key as any)}
            className={`flex-1 cursor-pointer rounded-xl py-2 text-xs font-bold transition-all ${
              subTab === t.key
                ? "bg-pine text-cream shadow-xs"
                : "text-ink-soft hover:text-ink hover:bg-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. THE HYPE METER */}
      {subTab === "hype" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                <IconFlame size={16} className="text-amber-500" />
                Live Campus Cultural Hype Meter
              </h3>
              <p className="text-[11px] text-ink-faint">
                Tap Hype to enlarge most anticipated gigs on the student dashboard!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {cultureEvents.map((ev) => {
              const count = hypes[ev.id] || 0;
              // Compute dynamic scale and aura based on hype count
              const isMegaHyped = count > 150;
              const isHighHyped = count > 80;

              return (
                <div
                  key={ev.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
                    isMegaHyped
                      ? "border-amber-400 bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a]/50 shadow-md ring-2 ring-amber-300/60 scale-[1.01]"
                      : isHighHyped
                      ? "border-amber-200 bg-cream shadow-xs"
                      : "border-line bg-cream"
                  }`}
                >
                  {isMegaHyped && (
                    <div className="absolute top-2.5 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider animate-pulse">
                      🔥 Top Hype #1
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          {ev.genre}
                        </span>
                        <span className="text-[11px] font-semibold text-ink-faint">
                          {ev.organizer}
                        </span>
                      </div>
                      <h4 className="mt-1.5 font-display text-sm font-bold text-ink">
                        {ev.title}
                      </h4>
                      <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                        {ev.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-ink-faint">
                        <span>📍 {ev.location}</span>
                        <span>•</span>
                        <span className="text-pine font-bold">🕒 {ev.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hype Action Bar */}
                  <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-base font-extrabold text-amber-600">
                        {count}
                      </span>
                      <span className="text-[11px] font-bold text-ink-faint">
                        students hyped
                      </span>
                    </div>

                    <button
                      onClick={() => handleHype(ev.id, ev.title)}
                      className="cursor-pointer flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-90"
                    >
                      <IconFlame size={15} />
                      <span>Hype This! 🔥</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. PRACTICE ZONE LOCATOR */}
      {subTab === "practice" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink">
                Available Rehearsal Spaces & Dance Studios
              </h3>
              <p className="text-[11px] text-ink-faint">
                Claim venue without double-booking or broadcast open jam sessions
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {practiceZones.map((pz) => {
              const isAvailable = pz.status === "available";
              const isOpenJam = pz.status === "open_jam";

              return (
                <div
                  key={pz.id}
                  className="rounded-2xl border border-line bg-cream p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-xs font-bold text-ink">
                          {pz.name}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                            isAvailable
                              ? "bg-emerald-100 text-emerald-800"
                              : isOpenJam
                              ? "bg-purple-100 text-purple-800"
                              : "bg-clay-soft text-clay"
                          }`}
                        >
                          {isAvailable ? "Free Now" : isOpenJam ? "Open Jam" : "Booked"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-faint">📍 {pz.location}</p>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => setClaimModalZoneId(pz.id)}
                        className="cursor-pointer rounded-xl bg-pine px-3 py-1.5 text-xs font-bold text-cream shadow-2xs active:scale-95"
                      >
                        Claim for 1h
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-ink-faint">
                        {pz.until}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-ink-soft bg-paper/80 p-2 rounded-xl border border-line/60">
                    <span>👥 Capacity: {pz.capacity}</span>
                    <span>🔊 {pz.acoustics}</span>
                  </div>

                  {!isAvailable && pz.claimedBy && (
                    <p className="text-[10.5px] font-semibold text-pine">
                      Currently used by: <strong>{pz.claimedBy}</strong>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. FLASH EVENT ALERTS */}
      {subTab === "flash" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                <span>⚡</span> Spontaneous Flash Gatherings
              </h3>
              <p className="text-[11px] text-ink-faint">
                Live pop-ups happening right now across campus quads
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {flashEvents.map((fe) => (
              <div
                key={fe.id}
                className="rounded-2xl border border-line bg-gradient-to-r from-cream via-paper to-cream p-3.5 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display text-sm font-bold text-ink">
                      {fe.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-ink-faint">
                      📍 {fe.location} · <strong className="text-amber-700">{fe.startsIn}</strong>
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-pine-soft px-2 py-0.5 text-[10px] font-extrabold text-pine">
                    <IconUsers size={12} />
                    {fe.attendeesCount}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1.5">
                    {fe.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-paper px-2 py-0.5 text-[9px] font-bold text-ink-soft border border-line/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleJoinFlash(fe.id, fe.title)}
                    className="cursor-pointer rounded-xl bg-pine px-3 py-1.5 text-xs font-bold text-cream shadow-2xs active:scale-95"
                  >
                    Heading There 🏃
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimModalZoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in">
            <h3 className="font-display text-sm font-bold text-ink">
              Reserve Practice Space (1 Hour)
            </h3>
            <p className="mt-1 text-xs text-ink-faint">
              Let other students and dance crews know the venue is occupied so they don&apos;t carry their equipment in vain.
            </p>

            <input
              value={crewNameInput}
              onChange={(e) => setCrewNameInput(e.target.value)}
              placeholder="e.g. Western Acoustic Trio / Solo Dance"
              className="mt-3 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-pine"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setClaimModalZoneId(null)}
                className="flex-1 cursor-pointer rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                className="flex-1 cursor-pointer rounded-xl bg-pine py-2 text-xs font-bold text-cream shadow-xs"
              >
                Confirm Spot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
