"use client";

import { useState } from "react";
import { useApp } from "@/app/page";
import { useCampusMode, type SquadPin } from "@/context/AppModeContext";
import {
  IconCheck,
  IconClock,
  IconMap,
  IconNavigation,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

export function SquadPinsHub({
  onNavigateToPin,
  onToast,
}: {
  onNavigateToPin?: (pin: SquadPin) => void;
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const { me } = useApp();
  const [duration, setDuration] = useState(45);
  const { squadPins, dropSquadPin, joinSquadPin } = useCampusMode();
  const [modalOpen, setModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [locationNameInput, setLocationNameInput] = useState("Chai Tapri Pavilion");
  const [categoryInput, setCategoryInput] = useState<SquadPin["category"]>("chai");

  const handleDrop = async () => {
    if (!titleInput.trim()) return;
    const locations: Record<string, [number, number]> = {
      "Chai Tapri Pavilion": [68, 58.5], "Main Canteen Tables": [44, 49.2],
      "Night Canteen Lounge": [24, 80], "Block 34 · Room 204": [18, 30.8],
      "Central Quad Fountain Lawn": [52, 55.4], "Innovation Lab Quad": [75, 41.5],
      "Sports Complex Court": [84, 30.8],
    };
    const [x, y] = locations[locationNameInput] ?? [50, 40];
    const pin = await dropSquadPin({
      title: titleInput.trim(),
      locationName: locationNameInput,
      x, y, duration,
      category: categoryInput,
    });
    if(!pin)return;
    onToast?.(`Dropped rally geo-pin "${titleInput.trim()}" at ${locationNameInput}. Visible on your Campus map.`, "ok");
    setModalOpen(false);
    setTitleInput("");
    onNavigateToPin?.(pin);
  };

  const handleJoin = async (pinId: string, title: string) => {
    if(!await joinSquadPin(pinId, me?.user.firstName ?? "You"))return;
    onToast?.(`You joined the squad for "${title}"! See you there. 🚀`, "ok");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Rally Status Banner */}
      <div className="rounded-2xl border border-blue-300/60 bg-gradient-to-r from-[#dbeafe] via-[#eff6ff] to-[#f8fafc] p-4 text-ink shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <IconUsers size={18} />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Group &quot;Squad&quot; Mode (Rally Beacons)
              </h3>
              <p className="text-[11px] text-ink-soft">
                Drop temporary geo-pins on the 3D map to rally your friend circle
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs active:scale-95"
          >
            + Drop Pin 📍
          </button>
        </div>
      </div>

      {/* Active Squad Pins */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-display text-xs font-bold text-ink">
            Active Squad Meetups on Campus
          </h4>
          <span className="text-[10px] font-bold text-ink-faint">
            {squadPins.length} pins live
          </span>
        </div>

        <div className="space-y-2.5">
          {squadPins.map((pin) => {
            const hasJoined = pin.attendees.includes(me?.user.firstName ?? "");

            return (
              <div
                key={pin.id}
                className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-2.5 transition-all hover:border-blue-300 hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[9.5px] font-black text-blue-800 border border-blue-200 uppercase">
                        {pin.category === "chai"
                          ? "☕ Chai & Food"
                          : pin.category === "gaming"
                          ? "🎮 Gaming LAN"
                          : pin.category === "study"
                          ? "📚 Study Squad"
                          : "🏸 Sports Rally"}
                      </span>
                      <span className="text-[10px] font-bold text-blue-700">
                        ⏳ {Number.isNaN(Date.parse(pin.expiresAt)) ? pin.expiresAt : `Until ${new Date(pin.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </div>
                    <h5 className="mt-1 font-display text-sm font-bold text-ink">
                      {pin.title}
                    </h5>
                    <p className="text-[11px] font-semibold text-ink-faint">
                      📍 {pin.locationName} · Started by <strong>{pin.creatorName}</strong>
                    </p>
                  </div>
                </div>

                {/* Attendees list */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <span className="text-[10px] font-bold text-ink-faint mr-1">
                    Squad ({pin.attendees.length}):
                  </span>
                  {pin.attendees.map((att, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-ink border border-line/60"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {att}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line/60">
                  <button
                    onClick={() => onNavigateToPin?.(pin)}
                    className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    <IconNavigation size={12} />
                    <span>Locate on 3D Map</span>
                  </button>

                  <button
                    onClick={() => handleJoin(pin.id, pin.title)}
                    disabled={hasJoined}
                    className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      hasJoined
                        ? "bg-emerald-600 text-white opacity-90"
                        : "bg-blue-600 text-white shadow-xs"
                    }`}
                  >
                    {hasJoined ? "You're In! 🚀" : "I'm In! 🚀"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop Pin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              Drop Temporary Squad Geo-Pin
            </h3>
            <p className="text-xs text-ink-faint">
              Rallies your friend group to a physical campus spot for 45 minutes.
            </p>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Activity Category
              </label>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {(
                  [
                    ["chai", "☕ Chai"],
                    ["gaming", "🎮 Gaming"],
                    ["study", "📚 Study"],
                    ["sports", "🏸 Sports"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryInput(key)}
                    className={`cursor-pointer rounded-xl py-1.5 text-xs font-bold transition-all ${
                      categoryInput === key
                        ? "bg-blue-600 text-white"
                        : "bg-cream text-ink-soft border border-line"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Callout Title
              </label>
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Grabbing hot chai & samosas / Testing LAN game"
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Campus Location
              </label>
              <select
                value={locationNameInput}
                onChange={(e) => setLocationNameInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-blue-500"
              >
                <option value="Chai Tapri Pavilion">Chai Tapri Pavilion</option>
                <option value="Main Canteen Tables">Main Canteen Tables</option>
                <option value="Night Canteen Lounge">Night Canteen Lounge</option>
                <option value="Block 34 · Room 204">Block 34 · Room 204 Studio</option>
                <option value="Central Quad Fountain Lawn">Central Quad Fountain Lawn</option>
                <option value="Innovation Lab Quad">Innovation Lab Quad</option>
                <option value="Sports Complex Court">Sports Complex Court</option>
              </select>
            </div>

            <label className="block text-xs font-bold">Keep pin visible for
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line p-2">
                {[15, 30, 45, 60, 120].map(n => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 cursor-pointer rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handleDrop}
                className="flex-1 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white shadow-xs"
              >
                Drop Geo-Pin 📍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
