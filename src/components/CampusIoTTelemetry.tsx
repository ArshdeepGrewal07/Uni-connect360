"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSavedState } from "@/hooks/use-campus-data";
import { api } from "@/lib/client";
import type { Telemetry } from "@/lib/telemetry";
import { INITIAL_LAUNDRY, NOISE_ZONES, type LaundryMachine } from "@/lib/telemetry-demo";
import {
  IconCheck,
  IconFlame,
  IconSparkles,
} from "@/components/icons";

export function CampusIoTTelemetry({
  onToast,
}: {
  onToast?: (msg: string, tone?: "ok" | "warn") => void;
}) {
  const [activeDormTab, setActiveDormTab] = useState<"Hostel A" | "Hostel B">("Hostel A");
  const [data, setData] = useState<Telemetry | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const previous = useRef<Telemetry | null>(null);
  const watchedRef = useRef<string[]>([]);
  const toastRef = useRef(onToast);
  const machines: LaundryMachine[] = (data?.machines ?? []).map(m => ({ ...m, type: INITIAL_LAUNDRY.find(original => original.id === m.id)?.type ?? (m.name.toLowerCase().includes("dryer") ? "dryer" : "washer") }));
  const rooms = (data?.rooms ?? []).map(r => ({ name: r.name, total: r.capacity, taken: r.occupied, status: `${r.capacity - r.occupied} desks open` }));
  const noiseZones = (data?.noise ?? []).map(n => ({
    id: n.id, zone: n.name, db: n.db,
    category: n.db < 35 ? "silent" : n.db < 60 ? "chatter" : "energy",
    recommendedFor: NOISE_ZONES.find(original => original.id === n.id)?.recommendedFor ?? "Campus sensor reading",
  }));
  const stale = !!data && now - Date.parse(data.updatedAt) > 120000;
  const statusLabel = error ? "Offline" : !data ? "Connecting…" : data.source === "demo" ? "Demo IoT" : stale ? "Stale readings" : "Realtime IoT";
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const next = await api<Telemetry>("/api/telemetry");
      if (next.source === "live") next.machines.filter(m => watchedRef.current.includes(m.id) && m.status === "available" && previous.current?.machines.find(p => p.id === m.id)?.status === "in_use").forEach(m => toastRef.current?.(`${m.name} is now available.`, "ok"));
      previous.current = next; setData(next); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Sensors unavailable."); }
    finally { setBusy(false); setNow(Date.now()); }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const interval = setInterval(() => void load(), 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [load]);
  const [notifiedMachines, setNotifiedMachines] = useSavedState<string[]>('notificationSettings',[]);

  useEffect(() => { watchedRef.current = notifiedMachines; toastRef.current = onToast; }, [notifiedMachines, onToast]);

  const filteredMachines = machines.filter((m) => m.dorm === activeDormTab);
  const freeWashers = filteredMachines.filter((m) => m.type === "washer" && m.status === "available").length;
  const freeDryers = filteredMachines.filter((m) => m.type === "dryer" && m.status === "available").length;

  const toggleNotify = (id: string, name: string) => {
    if (data?.source !== "live" || error || stale) { onToast?.("Alerts need a current live sensor feed.", "warn"); return; }
    if (notifiedMachines.includes(id)) {
      setNotifiedMachines((prev) => prev.filter((x) => x !== id));
      onToast?.(`Removed alert for ${name}`, "warn");
    } else {
      setNotifiedMachines((prev) => [...prev, id]);
      onToast?.(`🔔 We will alert you here while this screen stays open when ${name} finishes.`, "ok");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. HOSTEL LAUNDRY TELEMETRY */}
      <div className="rounded-2xl border border-line bg-cream p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                🧺
              </span>
              <h3 className="font-display text-sm font-bold text-ink">
                Hostel Laundry Room Telemetry
              </h3>
            </div>
            <p className="text-[11px] text-ink-faint mt-0.5">
              {data?.source === "demo" ? "Demo cycle readings · sensors not connected" : "Live IoT cycle sensors on washers & dryers"}
            </p>
          </div>

          {/* Dorm selector */}
          <div className="flex rounded-xl bg-paper p-1 border border-line/60">
            {(["Hostel A", "Hostel B"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setActiveDormTab(d)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  activeDormTab === d
                    ? "bg-pine text-cream shadow-2xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[10px] text-ink-faint" role="status">
          <span>{error || (data ? `${statusLabel} · ${new Date(data.updatedAt).toLocaleTimeString()}` : statusLabel)}</span>
          <button disabled={busy} onClick={() => void load()} className="shrink-0 font-bold text-pine disabled:opacity-50">{busy ? "Refreshing…" : "Refresh"}</button>
        </div>
        {/* Quick Availability Stat Bar */}
        <div className="grid grid-cols-2 gap-2 bg-paper/80 p-2.5 rounded-xl border border-line/60 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-ink-faint">Available Washers:</span>
            <strong className="text-pine font-bold text-sm">{freeWashers} open</strong>
          </div>
          <div className="flex items-center justify-between border-l border-line/60 pl-2">
            <span className="text-ink-faint">Available Dryers:</span>
            <strong className="text-pine font-bold text-sm">{freeDryers} open</strong>
          </div>
        </div>

        {/* Machine Grid */}
        <div className="grid grid-cols-2 gap-2">
          {filteredMachines.map((m) => {
            const isAvail = m.status === "available";
            const isNotified = notifiedMachines.includes(m.id);

            return (
              <div
                key={m.id}
                className={`rounded-xl border p-2.5 text-left space-y-1.5 transition-all ${
                  isAvail
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-line bg-paper"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">
                    {m.type === "washer" ? "🫧" : "💨"}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase ${
                      isAvail ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isAvail ? "Free" : (m.minutesLeft === undefined ? "In use" : `${m.minutesLeft}m left`)}
                  </span>
                </div>

                <p className="font-display text-[11px] font-bold text-ink truncate">
                  {m.name}
                </p>

                {!isAvail && (
                  <button
                    onClick={() => toggleNotify(m.id, m.name)}
                    className={`w-full cursor-pointer rounded-lg py-1 text-[10px] font-bold border transition-all ${
                      isNotified
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-cream text-ink-soft border-line hover:bg-paper"
                    }`}
                  >
                    {isNotified ? "Alert Set ✓" : "Ping when free"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LIBRARY & READING HALLS VACANCY */}
      <div className="rounded-2xl border border-line bg-cream p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
              📚
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Central Library & 24/7 Hall Sensors
              </h3>
              <p className="text-[11px] text-ink-faint">
                {data?.source === "demo" ? "Example chair occupancy counters" : "Live chair occupancy counters"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            {statusLabel}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {rooms.map((lib, i) => {
            const pct = Math.round((lib.taken / lib.total) * 100);
            return (
              <div key={i} className="rounded-xl bg-paper p-2.5 border border-line/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-ink">{lib.name}</span>
                  <span className="font-mono text-[11px] font-bold text-pine">{pct}% Full</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct > 75 ? "bg-amber-500" : pct > 50 ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] font-medium text-ink-faint">{lib.status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACOUSTIC NOISE LEVEL HEATMAP */}
      <div className="rounded-2xl border border-line bg-cream p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
              🔊
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Acoustic & Noise Level Mapping
              </h3>
              <p className="text-[11px] text-ink-faint">
                Sensor decibel ratings to pick your ideal work atmosphere
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {noiseZones.map((nz) => (
            <div
              key={nz.id}
              className="flex items-center justify-between gap-2.5 rounded-xl bg-paper p-2.5 border border-line/60 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase ${
                      nz.category === "silent"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : nz.category === "chatter"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {nz.category === "silent" ? "Silent Focus" : nz.category === "chatter" ? "Casual Chatter" : "High Energy"}
                  </span>
                  <span className="font-display text-xs font-bold text-ink truncate">{nz.zone}</span>
                </div>
                <p className="text-[10.5px] text-ink-soft mt-0.5">{nz.recommendedFor}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-black text-pine">{nz.db} dB</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
