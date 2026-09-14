"use client";

import { useCollection } from "@/hooks/use-campus-data";
import { useState } from "react";
import { useCampusMode, type PickupGame } from "@/context/AppModeContext";
import {
  IconCheck,
  IconFlame,
  IconNavigation,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

interface HostelRank {
  rank: number;
  name: string;
  badge: string;
  points: number;
  avgSteps: string;
  gymCheckins: number;
  championshipWins: number;
}

const SEED_HOSTEL_LEADERBOARD: HostelRank[] = [
  {
    rank: 1,
    name: "Hostel A (Champions)",
    badge: "🏆 Reigning #1",
    points: 14850,
    avgSteps: "8,920 steps/day",
    gymCheckins: 420,
    championshipWins: 4,
  },
  {
    rank: 2,
    name: "Hostel B (Warriors)",
    badge: "🥈 Runner-Up",
    points: 13420,
    avgSteps: "8,150 steps/day",
    gymCheckins: 380,
    championshipWins: 3,
  },
  {
    rank: 3,
    name: "Hostel C & PG Block",
    badge: "🥉 3rd Place",
    points: 11980,
    avgSteps: "7,840 steps/day",
    gymCheckins: 290,
    championshipWins: 2,
  },
  {
    rank: 4,
    name: "Day Scholars Collective",
    badge: "⭐ Active Contenders",
    points: 10450,
    avgSteps: "9,100 steps/day",
    gymCheckins: 310,
    championshipWins: 1,
  },
];

export function SportsRecHub({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {

  const {items:stored_HOSTEL_LEADERBOARD}=useCollection<(typeof SEED_HOSTEL_LEADERBOARD)[number]>('leaderboard');
  const HOSTEL_LEADERBOARD=stored_HOSTEL_LEADERBOARD.length?stored_HOSTEL_LEADERBOARD:SEED_HOSTEL_LEADERBOARD;
  const {
    pickupGames,
    joinPickupGame,
    createPickupGame,
    vaultItems,
    borrowVaultItem,
  } = useCampusMode();

  const [subTab, setSubTab] = useState<"pickup" | "leaderboard" | "vault">("pickup");
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourt, setNewCourt] = useState("");
  const [newSport, setNewSport] = useState<PickupGame["sport"]>("badminton");
  const [newNeeded, setNewNeeded] = useState(4);

  const handleJoinGame = async (game: PickupGame) => {
    if(!await joinPickupGame(game.id, ""))return;
    onToast?.(`Joined "${game.title}"! Racquets ready.`, "ok");
  };

  const handleCreateGame = async () => {
    if (!newTitle.trim() || !newCourt.trim()) return;
    if(!await createPickupGame({
      sport: newSport,
      title: newTitle.trim(),
      court: newCourt.trim(),
      neededPlayers: newNeeded,
    }))return;
    onToast?.(`Broadcasted pickup game: "${newTitle.trim()}"! Court pinged.`, "ok");
    setCreateGameOpen(false);
    setNewTitle("");
    setNewCourt("");
  };

  const handleBorrow = async (itemId: string, title: string) => {
    if(!await borrowVaultItem(itemId, ""))return;
    onToast?.(`Requested borrow for "${title}"! Owner notified for dorm pickup.`, "ok");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub Navigation Bar */}
      <div className="flex rounded-2xl border border-line bg-cream p-1 shadow-2xs">
        {[
          { key: "pickup", label: "🏸 Pickup Games" },
          { key: "leaderboard", label: "🏆 Hostel Cup" },
          { key: "vault", label: "🎒 Gear Vault" },
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

      {/* 1. PICKUP GAME PINGS */}
      {subTab === "pickup" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink">
                Instant Sports & Pickup Matches
              </h3>
              <p className="text-[11px] text-ink-faint">
                Live court callouts — join or broadcast to fill empty spots
              </p>
            </div>
            <button
              onClick={() => setCreateGameOpen(true)}
              className="cursor-pointer rounded-xl bg-pine px-3 py-1.5 text-xs font-bold text-cream shadow-xs active:scale-95"
            >
              + Ping Court
            </button>
          </div>

          <div className="space-y-2.5">
            {pickupGames.map((g) => {
              const isFull = g.currentPlayers.length >= g.neededPlayers;
              const hasJoined = g.currentPlayers.includes("Anya");

              return (
                <div
                  key={g.id}
                  className="rounded-2xl border border-line bg-cream p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9.5px] font-black text-amber-800 uppercase">
                          {g.sport}
                        </span>
                        <span className="text-[10px] font-bold text-pine">
                          ⚡ {g.startsAt}
                        </span>
                      </div>
                      <h4 className="mt-1 font-display text-sm font-bold text-ink">
                        {g.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-ink-faint">
                        📍 {g.court}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="rounded-full bg-pine-soft px-2.5 py-1 text-[11px] font-extrabold text-pine">
                        {g.currentPlayers.length} / {g.neededPlayers} players
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                      <IconUsers size={13} className="text-ink-faint" />
                      <span>Rostered: {g.currentPlayers.join(", ")}</span>
                    </div>

                    <button
                      onClick={() => handleJoinGame(g)}
                      disabled={isFull || hasJoined}
                      className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        hasJoined
                          ? "bg-emerald-700 text-cream opacity-90"
                          : isFull
                          ? "bg-line text-ink-faint cursor-not-allowed"
                          : "bg-pine text-cream shadow-xs"
                      }`}
                    >
                      {hasJoined ? "Joined ✓" : isFull ? "Lobby Full" : "Join Match 🏸"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. INTER-HOSTEL LEADERBOARDS */}
      {subTab === "leaderboard" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                <span>🏆</span> Annual Inter-Hostel Athletics Cup
              </h3>
              <p className="text-[11px] text-ink-faint">
                Aggregated daily steps, gym check-ins & tournament trophies
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {HOSTEL_LEADERBOARD.map((h) => {
              const isFirst = h.rank === 1;
              return (
                <div
                  key={h.name}
                  className={`rounded-2xl border p-4 shadow-xs space-y-2 transition-all ${
                    isFirst
                      ? "border-amber-400 bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a]/40 shadow-md ring-2 ring-amber-300/60"
                      : "border-line bg-cream"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${
                          isFirst
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-paper text-ink-soft border border-line"
                        }`}
                      >
                        #{h.rank}
                      </span>
                      <div>
                        <h4 className="font-display text-sm font-bold text-ink">
                          {h.name}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-800">
                          {h.badge}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-base font-extrabold text-pine">
                        {h.points.toLocaleString()}
                      </span>
                      <span className="block text-[9px] font-bold text-ink-faint uppercase">
                        Cup Points
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-paper/80 p-2.5 rounded-xl text-[10.5px] border border-line/60">
                    <div>
                      <span className="text-ink-faint block">Avg Daily Steps</span>
                      <strong className="text-ink font-bold">{h.avgSteps}</strong>
                    </div>
                    <div>
                      <span className="text-ink-faint block">Gym Check-ins</span>
                      <strong className="text-pine font-bold">{h.gymCheckins} visits</strong>
                    </div>
                    <div>
                      <span className="text-ink-faint block">Tourney Wins</span>
                      <strong className="text-amber font-bold">{h.championshipWins} Titles</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. EQUIPMENT VAULT */}
      {subTab === "vault" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                <span>🎒</span> Campus Peer-to-Peer Gear Sharing Vault
              </h3>
              <p className="text-[11px] text-ink-faint">
                Borrow racquets, bats, and boardgames directly from neighboring dorms
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {vaultItems.map((item) => {
              const isAvailable = item.status === "available";
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-line bg-cream p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-paper px-2 py-0.5 text-[9px] font-bold text-ink-soft border border-line/60 uppercase">
                        {item.category}
                      </span>
                      <h4 className="mt-1 font-display text-xs font-bold text-ink">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-ink-faint">
                        Lender: <strong>{item.ownerName}</strong>
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-clay-soft text-clay"
                      }`}
                    >
                      {isAvailable ? "Available" : "Borrowed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-line/60">
                    <span className="text-[10.5px] font-semibold text-pine">
                      📍 Pickup at {item.dormLocation}
                    </span>

                    {isAvailable ? (
                      <button
                        onClick={() => handleBorrow(item.id, item.title)}
                        className="cursor-pointer rounded-xl bg-pine px-3 py-1.5 text-xs font-bold text-cream shadow-2xs active:scale-95"
                      >
                        Borrow for 2h
                      </button>
                    ) : (
                      <span className="text-[10.5px] text-ink-faint font-medium">
                        Due back in 1h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Pickup Game Modal */}
      {createGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-4 shadow-2xl animate-sheet-in space-y-3">
            <h3 className="font-display text-sm font-bold text-ink">
              Ping Sports Court & Broadcast Match
            </h3>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Sport
              </label>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {(["badminton", "basketball", "football", "chess"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewSport(s)}
                    className={`cursor-pointer rounded-xl py-1.5 text-xs font-bold capitalize transition-all ${
                      newSport === s
                        ? "bg-pine text-cream"
                        : "bg-cream text-ink-soft border border-line"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Title / Callout
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Need 2 for doubles badminton"
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-pine"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Court Location
              </label>
              <input
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
                placeholder="e.g. Sports Complex Court 1"
                className="mt-1 w-full rounded-xl border border-line bg-cream px-3 py-2 text-xs font-bold text-ink outline-none focus:border-pine"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-faint uppercase">
                Total Players Needed
              </label>
              <div className="mt-1 flex gap-2">
                {[2, 4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewNeeded(num)}
                    className={`flex-1 cursor-pointer rounded-xl py-1.5 text-xs font-bold ${
                      newNeeded === num
                        ? "bg-pine text-cream"
                        : "bg-cream text-ink-soft border border-line"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCreateGameOpen(false)}
                className="flex-1 cursor-pointer rounded-xl bg-cream py-2 text-xs font-bold text-ink-soft border border-line"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGame}
                className="flex-1 cursor-pointer rounded-xl bg-pine py-2 text-xs font-bold text-cream shadow-xs"
              >
                Broadcast 🏸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
