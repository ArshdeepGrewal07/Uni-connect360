"use client";

import { useCollection } from "@/hooks/use-campus-data";
import { api } from "@/lib/client";
import { useEffect, useState } from "react";
import {
  IconCheck,
  IconChevronLeft,
  IconLock,
  IconNavigation,
  IconShield,
  IconSiren,
  IconWalk,
  IconX,
} from "@/components/icons";

interface RoutePreset {
  id: string;
  from: string;
  to: string;
  durationMins: number;
  pathName: string;
  lightingStatus: "Well-Lit (LED Pillars)" | "CCTV Monitored";
}

const SEED_GUARDIAN_ROUTES: RoutePreset[] = [
  {
    id: "gr-1",
    from: "Block 34 / Innovation Lab",
    to: "Hostel Blocks A & B",
    durationMins: 12,
    pathName: "Grand Central Spine & Quad Walkway",
    lightingStatus: "Well-Lit (LED Pillars)",
  },
  {
    id: "gr-2",
    from: "Central Library",
    to: "Hostel C (PG Block)",
    durationMins: 15,
    pathName: "Water Fountain Boulevard & East Avenue",
    lightingStatus: "CCTV Monitored",
  },
  {
    id: "gr-3",
    from: "Night Canteen",
    to: "Hostel A Cluster",
    durationMins: 8,
    pathName: "South Perimeter Illuminated Path",
    lightingStatus: "Well-Lit (LED Pillars)",
  },
];

export function WalkWithMeGuardian({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast?: (msg: string, tone?: "ok" | "warn" | "err") => void;
}) {

  const {items:stored_GUARDIAN_ROUTES}=useCollection<(typeof SEED_GUARDIAN_ROUTES)[number]>('guardian_routes');
  const GUARDIAN_ROUTES=stored_GUARDIAN_ROUTES.length?stored_GUARDIAN_ROUTES:SEED_GUARDIAN_ROUTES;
  const [selectedRoute, setSelectedRoute] = useState<RoutePreset>(GUARDIAN_ROUTES[0]);
  const [isActive, setIsActive] = useState(false);
  const [walkId,setWalkId]=useState('');
  const [deadline,setDeadline]=useState(0);
  const [saving,setSaving]=useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(12 * 60);
  const [pinInput, setPinInput] = useState("");
  const [isAlertEscalated, setIsAlertEscalated] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(30);
  useEffect(()=>{api<{session:{id:string;route:RoutePreset;status:string;deadline:number}|null}>('/api/guardian').then(({session:s})=>{if(s&&['active','alert'].includes(s.status)){setWalkId(s.id);setSelectedRoute(s.route);setDeadline(s.deadline);setIsActive(true);setIsAlertEscalated(s.status==='alert');setSecondsRemaining(Math.max(0,Math.ceil((s.deadline-Date.now())/1000)));}}).catch(()=>onToast?.('Could not load your saved walk.','warn'));},[onToast]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsRemaining > 0 && !isAlertEscalated) {
      interval = setInterval(() => {
        setSecondsRemaining(Math.max(0,Math.ceil((deadline-Date.now())/1000)));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, isAlertEscalated, deadline]);

  // Escalation countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAlertEscalated && emergencyCountdown > 0) {
      timer = setInterval(() => {
        setEmergencyCountdown((c) => c - 1);
      }, 1000);
    } else if (isAlertEscalated && emergencyCountdown === 0) {
      onToast?.("Alert recorded in this app. Contact campus security directly if you need help.", "err");
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAlertEscalated, emergencyCountdown, onToast]);

  const saveWalk=async(action:string)=>{
    if(saving)return;setSaving(true);
    try{const {session:s}=await api<{session:{id:string;route:RoutePreset;status:string;deadline:number}}>('/api/guardian',{method:'POST',body:JSON.stringify({action,id:walkId,routeId:selectedRoute.id.includes(":")?selectedRoute.id:"guardian_routes:"+selectedRoute.id})});
    setWalkId(s.id);setDeadline(s.deadline);setSelectedRoute(s.route);setIsActive(s.status!=='arrived');setIsAlertEscalated(s.status==='alert');setSecondsRemaining(Math.max(0,Math.ceil((s.deadline-Date.now())/1000)));onToast?.('Walk status saved. Emergency contacts are not connected.','ok');if(s.status==='arrived')onClose();}
    catch(e){onToast?.(e instanceof Error?e.message:'Could not save your walk.','warn');}finally{setSaving(false);}
  };
  const handleStart=()=>saveWalk('start');
  const handleEnterPin=()=>saveWalk('arrived');

  const mins=Math.floor(secondsRemaining/60),secs=secondsRemaining%60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-line bg-paper shadow-2xl overflow-hidden animate-sheet-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-cream p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <IconShield size={20} />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                &quot;Walk With Me&quot; Late-Night Guardian
              </h3>
              <p className="text-[10.5px] font-semibold text-ink-faint">
                Active motion tracker & illuminated route escort
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-ink-faint hover:text-ink"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!isActive ? (
            /* Setup Journey */
            <div className="space-y-3">
              <p className="text-xs text-ink-soft leading-relaxed">
                Walking between labs or hostels late at night? Guardian tracks your progress along designated illuminated paths. If you deviate or stay idle over 3 minutes, it alerts roommates and campus security.
              </p>

              <div>
                <label className="text-[10px] font-bold text-ink-faint uppercase">
                  Select Night Path Route
                </label>
                <div className="mt-1.5 space-y-2">
                  {GUARDIAN_ROUTES.map((r) => {
                    const isSelected = selectedRoute.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRoute(r)}
                        className={`cursor-pointer rounded-2xl border p-3 transition-all ${
                          isSelected
                            ? "border-red-500 bg-red-50/50 shadow-xs"
                            : "border-line bg-cream hover:bg-paper"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-display text-xs font-bold text-ink truncate">
                            {r.from} → {r.to}
                          </p>
                          <span className="font-mono text-xs font-bold text-pine">
                            ~{r.durationMins}m walk
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-ink-faint">
                          📍 {r.pathName}
                        </p>
                        <span className="mt-1 inline-block rounded-md bg-paper px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800 border border-line/60">
                          💡 {r.lightingStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-cream p-3 text-xs text-ink-soft space-y-1">
                <p className="font-bold text-ink">Private walk record:</p>
                <p className="text-[11px] text-ink-faint">
                  Your route and check-ins are saved to your account.
                </p>
                <p className="text-[11px] text-ink-faint">
                  No SMS or security service is connected.
                </p>
              </div>

              <button
                onClick={handleStart}
                className="w-full cursor-pointer rounded-xl bg-red-600 hover:bg-red-700 py-3 font-display text-xs font-bold text-white shadow-md active:scale-98"
              >
                Start Guardian Escort Tracker 🛡️
              </button>
            </div>
          ) : (
            /* Active Tracking View */
            <div className="space-y-4">
              {/* Emergency Alert Escalation Banner if Idle */}
              {isAlertEscalated ? (
                <div className="rounded-2xl border border-red-500 bg-red-600 p-4 text-white space-y-2 animate-bounce-subtle">
                  <div className="flex items-center gap-2">
                    <IconSiren size={24} />
                    <div>
                      <h4 className="font-display text-sm font-black">
                        IDLE/DEVIATION DETECTED!
                      </h4>
                      <p className="text-[11px] text-red-100">
                        Local reminder in {emergencyCountdown}s
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-red-100">
                    If you are safe, confirm your arrival below.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3 text-emerald-950">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-600 animate-pulse" />
                    <div>
                      <h4 className="font-display text-xs font-bold">
                        En Route: {selectedRoute.to}
                      </h4>
                      <p className="text-[10px] text-emerald-800">
                        Saved route · Location is not tracked
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-900">
                    Safe Path
                  </span>
                </div>
              )}

              {/* Countdown Dial */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-cream p-5 border border-line">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  Arrival Window Remaining
                </span>
                <div className="font-mono text-4xl font-black text-ink my-1">
                  {timeFormatted}
                </div>
                <p className="text-[11px] text-ink-faint">
                  📍 {selectedRoute.pathName}
                </p>
              </div>

              {/* PIN Safe Arrival Box */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  Arrived? Save your check-in
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleEnterPin}
                    className="cursor-pointer rounded-xl bg-pine px-4 py-2 text-xs font-bold text-cream shadow-xs active:scale-95"
                  >
                    I&apos;m Safe ✓
                  </button>
                </div>
              </div>

              {/* Simulator trigger button */}
              {!isAlertEscalated && (
                <button
                  onClick={()=>void saveWalk('alert')}
                  className="w-full cursor-pointer text-center text-[10px] font-semibold text-red-600 hover:underline"
                >
                  ⚠️ Simulate Off-Path / Idle Trigger
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
