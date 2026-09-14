"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useApp } from "@/app/page";
import { api } from "@/lib/client";
import type { PlaceItem, VendorDetail, VendorListItem } from "@/lib/types";
import { Avatar, Chip, Lightbox, OpenBadge, Skeleton, Spinner, Stars } from "@/components/ui";
import {
  IconBuilding,
  IconChevronLeft,
  IconFlame,
  IconLeaf,
  IconNavigation,
  IconSearch,
  IconSparkles,
  IconStar,
  IconWalk,
  IconX,
} from "@/components/icons";
import { IsometricCampusMap } from "@/components/IsometricCampusMap";
import { IndoorRoutingModal } from "@/components/IndoorRoutingModal";
import { FoodCardImage } from "@/components/FoodCardImage";
import { useCampusMode } from "@/context/AppModeContext";
import { CampusModesBar } from "@/components/CampusModesBar";
import { ARCampusLens } from "@/components/ARCampusLens";
import { CampusIoTTelemetry } from "@/components/CampusIoTTelemetry";
import {SkillBeaconTools,useSkillBeacons} from "@/components/SkillOpportunityMapLayer";
import { FlashFoodRescue } from "@/components/FlashFoodRescue";

const CENTER = { x: 50, y: 40 };

// Helper to provide friendly forward-looking opening hours
function getSmartSchedule(name: string | null | undefined, isOpen: boolean) {
  const n = (name || "").toLowerCase();
  if (isOpen) {
    if (n.includes("night")) {
      return {
        badge: "Open Late",
        statusText: "Open late till 1:00 AM · Butter pav bhaji ready",
        tone: "pine" as const,
      };
    }
    if (n.includes("chai")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Hot cutting chai & bun maska",
        tone: "pine" as const,
      };
    }
    if (n.includes("momo")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Steamed & fried batches fresh",
        tone: "pine" as const,
      };
    }
    if (n.includes("roll") || n.includes("kathi")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Sizzling kathi rolls & frankies",
        tone: "pine" as const,
      };
    }
    if (n.includes("waffle") || n.includes("cafe")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Hot Belgian waffles & iced brew",
        tone: "pine" as const,
      };
    }
    if (n.includes("kulcha") || n.includes("dhaba")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Tandoori chur chur kulchas ready",
        tone: "pine" as const,
      };
    }
    if (n.includes("dosa")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Crispy ghee roast dosa & filter kaapi",
        tone: "pine" as const,
      };
    }
    if (n.includes("juice") || n.includes("shake")) {
      return {
        badge: "Open Now",
        statusText: "Open now · Fresh mango mastani & cold shakes",
        tone: "pine" as const,
      };
    }
    return {
      badge: "Open Now",
      statusText: "Open now · Fresh kitchen counter active",
      tone: "pine" as const,
    };
  }

  // If closed, provide forward-looking actionable copy instead of harsh "CLOSED"
  return {
    badge: "Opens 8 AM",
    statusText: "Opens at 8:00 AM · View Breakfast Menu",
    tone: "clay" as const,
  };
}

// Helper to compute live queue times and inventory micro-updates
function getLiveMicroUpdates(name: string | null | undefined, isOpen: boolean) {
  const n = (name || "").toLowerCase();
  if (!isOpen) {
    return {
      queue: "Kitchen Prep",
      inventory: "Fresh morning restock scheduled",
    };
  }
  if (n.includes("main")) {
    return {
      queue: "⚡ 5 min queue",
      inventory: "🔥 Samosas just restocked",
    };
  }
  if (n.includes("night")) {
    return {
      queue: "⚡ Walk-in (No wait)",
      inventory: "🧈 Fresh butter pav from oven",
    };
  }
  if (n.includes("chai")) {
    return {
      queue: "⚡ 2 min wait",
      inventory: "☕ Fresh ginger chai brewing",
    };
  }
  if (n.includes("momo")) {
    return {
      queue: "⚡ 6 min rush",
      inventory: "🥟 Steaming chicken momos ready",
    };
  }
  if (n.includes("dahi")) {
    return {
      queue: "⚡ Walk-in",
      inventory: "🍨 Chilled sweet lassi stocked",
    };
  }
  if (n.includes("roll") || n.includes("kathi")) {
    return {
      queue: "⚡ 4 min wait",
      inventory: "🌯 Fresh paneer tikka rolls rolling",
    };
  }
  if (n.includes("waffle") || n.includes("cafe")) {
    return {
      queue: "⚡ 3 min wait",
      inventory: "🧇 Warm chocolate waffles baking",
    };
  }
  if (n.includes("kulcha") || n.includes("dhaba")) {
    return {
      queue: "⚡ 5 min wait",
      inventory: "🥘 Earthen clay tandoor glowing",
    };
  }
  if (n.includes("dosa")) {
    return {
      queue: "⚡ 5 min wait",
      inventory: "🥞 Crispy podi dosas on tawa",
    };
  }
  if (n.includes("juice") || n.includes("shake")) {
    return {
      queue: "⚡ 1 min wait",
      inventory: "🥤 Fresh cold-pressed fruit juices",
    };
  }
  return {
    queue: "⚡ 3 min queue",
    inventory: "✨ Daily student specials active",
  };
}


export function CampusView() {
  const { toast, me } = useApp();
  const { mode, squadPins, joinSquadPin } = useCampusMode();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | "food" | "places">("all");
  const [you, setYou] = useState(CENTER);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    meters: number;
    x: number;
    y: number;
    kind: "vendor" | "place";
    placeKind?: string;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [indoorBuilding, setIndoorBuilding] = useState<string | null>(null);

  const skillState=useSkillBeacons();
  const mapRef=useRef<HTMLDivElement>(null);
  const [skillDestination,setSkillDestination]=useState<{x:number;y:number;name:string}|null>(null);

  // Spatial & IoT Next-Gen features
  const [showARLens, setShowARLens] = useState(false);
  const [showIoTModal, setShowIoTModal] = useState(false);
  const [showFoodRescueModal, setShowFoodRescueModal] = useState(false);

  // Map layer toggles
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBuddyRadar, setShowBuddyRadar] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api<{ vendors: VendorListItem[]; places: PlaceItem[] }>(
        `/api/vendors?ux=${you.x}&uy=${you.y}`
      );
      setVendors(res.vendors);
      setPlaces(res.places);
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, [you]);

  useEffect(() => {
    let dispose: void | (() => void);
    const initialSync = setTimeout(() => {
      dispose = (() => {
    setLoading(true);
    load();
  
      })();
    }, 0);
    return () => { clearTimeout(initialSync); if (dispose) dispose(); };
  }, [load]);

  const q = query.trim().toLowerCase();
  const visVendors = vendors.filter((v) => {
    if (cat === "places") return false;
    const vName = (v.name || "").toLowerCase();
    const vTopDish = (v.topDish || "").toLowerCase();
    if (q && !vName.includes(q) && !vTopDish.includes(q)) return false;
    return true;
  });

  const visPlaces = places.filter(
    (p) => cat !== "food" && (!q || (p.name || "").toLowerCase().includes(q))
  );

  const walkMinutes = (meters: number) => {
    const mins = Math.max(1, Math.round(meters / 75));
    return `${mins} min walk`;
  };

  return (
    <div className="h-full overflow-y-auto overscroll-contain bg-paper">
      {/* Floating Glassmorphic Header & Search Bar */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-paper/85 px-4 pt-3.5 pb-2.5 backdrop-blur-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-ink tracking-tight">Campus Map & Food</h1>
            <p className="text-[11px] font-medium text-ink-faint">
              Illustrative map, campus places & demo crowd estimates
            </p>
          </div>
          <span className="rounded-full bg-pine/10 px-3 py-1 text-[10px] font-bold text-pine">
            Campus Guide
          </span>
        </div>

        {/* Apple-style Search Input */}
        <label className="mt-2.5 flex items-center gap-2 rounded-2xl border border-line/70 bg-cream/90 px-3.5 py-2 shadow-2xs backdrop-blur-md focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/15 transition-all">
          <IconSearch size={16} className="text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Block 34, canteens, dishes, library…"
            className="w-full bg-transparent text-xs font-semibold text-ink outline-none placeholder:text-ink-faint"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="cursor-pointer text-ink-faint hover:text-ink p-1 tap-spring"
            >
              <IconX size={14} />
            </button>
          )}
        </label>

        {/* Sleek Categories & Smart Tools Bar */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            All Campus
          </Chip>
          <Chip active={cat === "food"} onClick={() => setCat("food")}>
            Food & Dining
          </Chip>
          <Chip active={cat === "places"} onClick={() => setCat("places")}>
            Academic & Hostels
          </Chip>

          <span className="h-4 w-px bg-line shrink-0 mx-0.5" />

          {/* Quick Smart Tools Chips */}
          <button
            onClick={() => setShowARLens(true)}
            className="tap-spring flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-xs whitespace-nowrap"
          >
            <span>📷</span> Campus Lens AR
          </button>
          <button
            onClick={() => setShowIoTModal(true)}
            className="tap-spring flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream text-ink text-[11px] font-bold border border-line shadow-xs whitespace-nowrap"
          >
            <span>🏢</span> Live IoT
          </button>
          <button
            onClick={() => setShowFoodRescueModal(true)}
            className="tap-spring flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-300 shadow-xs whitespace-nowrap"
          >
            <span>⚡</span> Food Rescue
          </button>

          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-pine shrink-0 pl-1">
            <IconWalk size={12} /> {walkMinutes(selected ? selected.meters : 120)}
          </span>
        </div>
      </header>

      <SkillBeaconTools state={skillState} you={you} onNavigate={pos=>{setSkillDestination(pos);requestAnimationFrame(()=>mapRef.current?.scrollIntoView({block:"center",behavior:"auto"}));}}/>
      {/* Edge-to-Edge Isometric 3D Canvas Map */}
      <div ref={mapRef} className="relative shrink-0 border-b border-line shadow-xs scroll-mt-28">
        <IsometricCampusMap
          skillBeacons={skillState.beacons.filter(b=>skillState.filter==='all'||b.kind===skillState.filter)}
          onSelectSkillBeacon={b=>skillState.setSelected(b.id)}
          skillDestination={skillDestination}
          you={you}
          onMoveYou={(newPos) => {
            setYou(newPos);
            toast("Updated your campus pin location 📍", "ok");
          }}
          selectedId={selected?.id || null}
          onSelect={(item) => {
            setSelected({
              id: item.id,
              name: item.name,
              meters: item.meters,
              x: item.x,
              y: item.y,
              kind: item.kind,
              placeKind: item.placeKind,
            });
            if (item.kind === "vendor") {
              setDetailId(item.id);
            }
          }}
          onOpenIndoor={(name) => setIndoorBuilding(name)}
          vendors={vendors}
          places={places}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((h) => !h)}
          showBuddyRadar={showBuddyRadar}
          onToggleBuddyRadar={() => setShowBuddyRadar((b) => !b)}
          walkMinutes={walkMinutes}
          mode={mode}
          squadPins={squadPins}
          onSelectSquadPin={(sp) => {
            toast(`Squad Rally Pin: "${sp.title}" at ${sp.locationName} (${sp.attendees.length} joined)`, "ok");
            joinSquadPin(sp.id, me?.user.firstName ?? "You");
          }}
        />
      </div>

      {/* Smart Cards Drawer List */}
      <div className="space-y-3 px-4 py-3 pb-8">
        {loading && (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        )}

        {/* Vendors Section */}
        {cat !== "places" &&
          visVendors.map((v) => {
            const schedule = getSmartSchedule(v.name, v.isOpen);
            const liveInfo = getLiveMicroUpdates(v.name, v.isOpen);

            return (
              <button
                key={v.id}
                onClick={() => {
                  setSelected({
                    id: v.id,
                    name: v.name,
                    meters: v.distanceMeters,
                    x: v.x,
                    y: v.y,
                    kind: "vendor",
                  });
                  setDetailId(v.id);
                }}
                className="tap-spring animate-fade-up flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border border-line/80 bg-cream/95 p-3.5 text-left shadow-2xs hover:border-pine/30 hover:shadow-md transition-all duration-300"
              >
                {/* Guaranteed Warm Illustration / Photo (No Grey Squares) */}
                <FoodCardImage
                  src={v.image}
                  name={v.name}
                  topDish={v.topDish}
                  className="h-20 w-22 shrink-0 rounded-xl object-cover shadow-xs transition-transform duration-300 group-hover:scale-105"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate font-display text-[15px] font-bold text-ink">
                      {v.name}
                    </p>
                    {/* Actionable Soft Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        schedule.tone === "pine"
                          ? "bg-pine-soft text-pine"
                          : "bg-clay-soft text-clay"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          schedule.tone === "pine" ? "animate-pulse bg-pine" : "bg-clay"
                        }`}
                      />
                      {schedule.badge}
                    </span>
                  </div>

                  {/* Forward-Looking Actionable Schedule Text */}
                  <p
                    className={`mt-0.5 text-xs font-semibold ${
                      v.isOpen ? "text-ink-soft" : "text-clay font-bold"
                    }`}
                  >
                    {schedule.statusText}
                  </p>

                  {/* Live Inventory & Queue Micro-Updates */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-soft border border-line/60">
                      {liveInfo.queue}
                    </span>
                    <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber/40">
                      {liveInfo.inventory}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-ink-soft">
                    <div className="flex items-center gap-1">
                      <Stars value={v.rating} />
                      <span className="text-xs font-bold">{v.rating || "—"}</span>
                      <span className="font-semibold text-ink-faint">
                        ({v.reviewCount} reviews)
                      </span>
                    </div>

                    <span className="text-xs font-bold text-pine">
                      📍 {v.distanceMeters}m ({walkMinutes(v.distanceMeters)})
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

        {/* Places & Academic Blocks Section */}
        {cat !== "food" && visPlaces.length > 0 && (
          <>
            {cat === "all" && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] font-bold tracking-widest text-ink-faint uppercase">
                  Campus Blocks & Hostels
                </p>
                <span className="text-[10px] font-semibold text-pine">
                  Indoor GPS Enabled
                </span>
              </div>
            )}
            {visPlaces.map((p) => {
              const isAcademic = p.kind === "academic";
              const isBlock34 = (p.name || "").includes("Block 34");

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelected({
                      id: p.id,
                      name: p.name,
                      meters: p.distanceMeters,
                      x: p.x,
                      y: p.y,
                      kind: "place",
                      placeKind: p.kind,
                    });
                  }}
                  className={`animate-fade-up flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs transition-all active:scale-[0.98] ${
                    isBlock34
                      ? "border-pine/40 bg-pine-soft/40 hover:border-pine"
                      : "border-line bg-cream hover:border-ink-faint/60"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-2xs ${
                      p.kind === "housing"
                        ? "bg-amber-soft text-amber"
                        : "bg-pine text-cream"
                    }`}
                  >
                    {p.kind === "housing" ? "🏡" : "🏛️"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                      {isBlock34 && (
                        <span className="rounded-full bg-pine px-1.5 py-0.2 text-[9px] font-bold text-cream">
                          Studio Hub
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-ink-faint capitalize">
                      {p.kind} · {p.distanceMeters}m away ({walkMinutes(p.distanceMeters)})
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {isAcademic && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIndoorBuilding(p.name);
                        }}
                        className="cursor-pointer flex items-center gap-1 rounded-xl bg-paper px-2.5 py-1.5 text-[11px] font-bold text-pine border border-pine/30 shadow-2xs hover:bg-pine/5 active:scale-95"
                      >
                        <IconBuilding size={12} />
                        <span>Indoor</span>
                      </button>
                    )}
                    <span className="rounded-full bg-paper p-2 text-ink-faint">
                      <IconNavigation size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {!loading && visVendors.length === 0 && visPlaces.length === 0 && (
          <div className="py-12 text-center text-xs font-semibold text-ink-faint">
            Nothing found for “{query}”. Try another search term.
          </div>
        )}
      </div>

      {/* Vendor Detail Sheet */}
      {detailId && (
        <VendorDetailSheet
          id={detailId}
          you={you}
          onClose={() => setDetailId(null)}
          toast={toast}
          walkTime={walkMinutes}
        />
      )}

      {/* Indoor Turn-by-Turn Routing Modal */}
      {indoorBuilding && (
        <IndoorRoutingModal
          buildingName={indoorBuilding}
          onClose={() => setIndoorBuilding(null)}
          onShare={(msg) => toast(msg, "ok")}
        />
      )}

      {/* AR Campus Lens Modal */}
      {showARLens && (
        <ARCampusLens
          onClose={() => setShowARLens(false)}
        />
      )}

      {/* Campus IoT Telemetry Modal */}
      {showIoTModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-stone-50 dark:bg-stone-900 w-full max-w-lg rounded-3xl p-4 shadow-2xl border border-stone-200 dark:border-stone-800 my-auto max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-display">
                    Smart Campus IoT Telemetry
                  </h3>
                  <p className="text-[11px] text-stone-500">Live hardware telemetry and occupancy sensors</p>
                </div>
              </div>
              <button
                onClick={() => setShowIoTModal(false)}
                className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-300"
              >
                ✕
              </button>
            </div>
            <CampusIoTTelemetry onToast={(msg, tone) => toast(msg, tone)} />
          </div>
        </div>
      )}

      {/* Flash Food Rescue Modal */}
      {showFoodRescueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-stone-50 dark:bg-stone-900 w-full max-w-lg rounded-3xl p-4 shadow-2xl border border-stone-200 dark:border-stone-800 my-auto max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-display">
                    End-of-Day Surplus Food Rescue
                  </h3>
                  <p className="text-[11px] text-stone-500">Save food, cut waste, eat fresh on student budget</p>
                </div>
              </div>
              <button
                onClick={() => setShowFoodRescueModal(false)}
                className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-300"
              >
                ✕
              </button>
            </div>
            <FlashFoodRescue onToast={(msg, tone) => toast(msg, tone)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ vendor detail sheet ------------------------------ */

function VendorDetailSheet({
  id,
  you,
  onClose,
  toast,
  walkTime,
}: {
  id: string;
  you: { x: number; y: number };
  onClose: () => void;
  toast: (m: string, tone?: "ok" | "warn" | "err") => void;
  walkTime: (meters: number) => string;
}) {
  const [data, setData] = useState<VendorDetail | null>(null);
  const [tab, setTab] = useState<"menu" | "reviews">("menu");
  const [vegOnly, setVegOnly] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const load = useCallback(() => {
    api<VendorDetail>(`/api/vendors?detail=${id}&ux=${you.x}&uy=${you.y}`).then(setData);
  }, [id, you]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReview = async () => {
    if (!myRating) {
      toast("Select a star rating first.", "warn");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/vendors", {
        method: "POST",
        body: JSON.stringify({ action: "review", vendorId: id, rating: myRating, text }),
      });
      toast("Review submitted! Thank you for helping the campus.", "ok");
      setMyRating(0);
      setText("");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post review.", "err");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-paper">
        <Spinner size={26} className="text-pine" />
      </div>
    );
  }
  const v = data.vendor;
  const filteredMenu = vegOnly ? v.menu.filter((m) => m.veg) : v.menu;
  const schedule = getSmartSchedule(v.name, v.isOpen);

  return (
    <div className="animate-sheet-in absolute inset-0 z-40 flex flex-col bg-paper">
      <div className="relative h-48 shrink-0">
        <FoodCardImage
          src={v.image}
          name={v.name}
          topDish={v.topDish}
          className="h-full w-full object-cover cursor-pointer"
          onClick={() => {
            if (v.image) setLightboxSrc(v.image);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine-ink/85 via-transparent" />
        <button
          onClick={onClose}
          className="absolute top-3 left-3 cursor-pointer rounded-full bg-cream/95 p-2 text-ink shadow-md transition-transform active:scale-90"
        >
          <IconChevronLeft size={20} />
        </button>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-cream drop-shadow">{v.name}</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                schedule.tone === "pine" ? "bg-emerald-600 text-white" : "bg-clay text-white"
              }`}
            >
              {schedule.badge}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-bold text-cream/90">
            📍 {v.distanceMeters}m away ({walkTime(v.distanceMeters)}) ·{" "}
            <Stars value={v.rating} className="align-middle" /> {v.rating} ({v.reviewCount} reviews)
          </p>
        </div>
      </div>

      {v.topDish && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-amber/40 bg-amber-soft px-3.5 py-2.5 shadow-2xs">
          <IconFlame size={18} className="shrink-0 text-amber" />
          <p className="text-xs font-bold text-[#7a5210]">
            Student Top Pick: <span className="text-[#5c3c08]">{v.topDish}</span>
          </p>
        </div>
      )}

      <div className="mx-4 mt-3 flex rounded-xl border border-line bg-cream p-1">
        {(
          [
            ["menu", "Menu & Prices"],
            ["reviews", `Student Reviews (${data.reviews.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 cursor-pointer rounded-lg py-2 font-display text-xs font-bold transition-all duration-150 ${
              tab === key ? "bg-pine text-cream shadow-2xs" : "text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3 pb-8">
        {tab === "menu" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold tracking-wide text-ink-faint uppercase">
                {filteredMenu.length} items on menu
              </span>
              <button
                onClick={() => setVegOnly((v) => !v)}
                className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  vegOnly ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-line bg-cream text-ink-faint"
                }`}
              >
                <IconLeaf size={12} /> Veg only
              </button>
            </div>

            {filteredMenu.map((m) => (
              <div
                key={m.item}
                className="flex items-center gap-3 rounded-2xl border border-line bg-cream px-3.5 py-2.5 shadow-2xs transition-transform active:scale-[0.99]"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    m.veg ? "border-emerald-600" : "border-clay"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${m.veg ? "bg-emerald-600" : "bg-clay"}`} />
                </span>
                <p className="flex-1 text-sm font-semibold text-ink">{m.item}</p>
                <p className="font-display text-sm font-bold text-pine">{m.price}</p>
              </div>
            ))}

            <p className="pt-2 text-center text-[10px] font-semibold text-ink-faint">
              ✨ Prices updated by student crowd-sourcing this term
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-line bg-cream p-4 shadow-2xs">
              <p className="text-xs font-bold text-ink">Rate this campus spot</p>
              <div className="mt-2 flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setMyRating(i)}
                    className={`cursor-pointer transition-transform active:scale-90 ${
                      i <= (hover || myRating) ? "text-amber" : "text-line"
                    }`}
                  >
                    <IconStar size={24} filled />
                  </button>
                ))}
                {myRating > 0 && (
                  <span className="ml-1.5 font-display text-xs font-bold text-ink-soft">
                    {myRating}/5 stars
                  </span>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 400))}
                placeholder="What dish or tip should everyone know about?"
                rows={2}
                className="mt-2.5 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium text-ink outline-none focus:border-pine"
              />
              <button
                onClick={submitReview}
                disabled={submitting}
                className="mt-2.5 w-full cursor-pointer rounded-xl bg-pine py-2.5 font-display text-xs font-bold text-cream shadow-2xs transition-transform active:scale-95 disabled:opacity-60"
              >
                {submitting ? "Posting…" : "Post Review"}
              </button>
            </div>

            {data.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-line bg-cream p-3.5 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={r.firstName} hue={r.hue} size={30} />
                  <p className="text-sm font-bold text-ink">{r.firstName}</p>
                  <Stars value={r.rating} className="ml-auto" />
                </div>
                {r.body && <p className="mt-2 text-xs leading-relaxed text-ink-soft">{r.body}</p>}
              </div>
            ))}
            {data.reviews.length === 0 && (
              <p className="py-8 text-center text-xs font-semibold text-ink-faint">
                No reviews yet — be the first to recommend a dish!
              </p>
            )}
          </div>
        )}
      </div>

      <Lightbox
        src={lightboxSrc}
        alt={v.name}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
