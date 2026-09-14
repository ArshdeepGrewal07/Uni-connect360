"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/app/page";
import { api, fmtEventDate } from "@/lib/client";
import type { HomeData } from "@/lib/types";
import { Avatar, CampusSosModal, Modal, Skeleton } from "@/components/ui";
import {
  IconBell,
  IconBookmark,
  IconBuddies,
  IconCalendar,
  IconChevronLeft,
  IconFlame,
  IconFood,
  IconLeaf,
  IconMap,
  IconShield,
  IconSiren,
  IconSparkles,
} from "@/components/icons";
import { CampusModesBar } from "@/components/CampusModesBar";
import { useCampusMode } from "@/context/AppModeContext";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { PersonalizedOpportunities } from "@/components/PersonalizedOpportunities";
import { MemberDirectory } from "@/components/MemberDirectory";
import { WalkWithMeGuardian } from "@/components/WalkWithMeGuardian";

export function HomeView() {
  const { me, go, refreshMe, toast } = useApp();
  const { mode: campusMode } = useCampusMode();
  const [data, setData] = useState<HomeData | null>(null);
  const [directoryOpen,setDirectoryOpen]=useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [walkWithMeOpen, setWalkWithMeOpen] = useState(false);

  useEffect(() => {
    let live = true;
    api<HomeData>("/api/home")
      .then((d) => live && setData(d))
      .catch(() => {});
    const t = setInterval(() => {refreshMe();api<HomeData>("/api/home").then(d=>live&&setData(d)).catch(()=>{});}, 30_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [refreshMe]);

  if (!me) return null;
  const user = me.user;
  const displayName = user.firstName && !/^\d+$/.test(user.firstName) ? user.firstName : "Anya";

  // Campus context tag line based on current hour
  const hour = new Date().getHours();
  const campusContext =
    hour >= 21 || hour < 5
      ? "🌙 Night Canteen & late-night cozy reading rooms open"
      : hour < 11
        ? "☕ Morning chai rush at Central Lawn"
        : hour < 15
          ? "🍱 Peak lunchtime at Main Canteen & Food Courts"
          : "🏸 Evening meetups & sports active on the quad";

  return (
    <div className="no-scrollbar h-full overflow-y-auto paper-texture">
      {/* Apple-style Frosted Glass Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3">
        <button
          onClick={() => go("profile")}
          className="cursor-pointer tap-spring"
          title="Open profile"
        >
          <Avatar name={user.fullName} hue={user.avatarHue} size={42} status="online" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-display text-[16px] font-bold text-ink tracking-tight">
              {data?.greeting ?? "Good morning"}, {displayName}
            </p>
            <IconLeaf size={15} className="text-[#84a98c] shrink-0" />
          </div>
          <p className="truncate text-[11.5px] font-semibold text-ink-faint">
            {user.course} · {user.academicYear === 1 ? "1st" : user.academicYear === 2 ? "2nd" : user.academicYear === 3 ? "3rd" : "4th"} year
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Safe Walk Guardian Escort button */}
          <button
            onClick={() => setWalkWithMeOpen(true)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-teal-500/25 bg-teal-500/10 text-teal-800 dark:text-teal-200 tap-spring hover:bg-teal-500/20 shadow-xs"
            title="Walk With Me Guardian Escort"
            aria-label="Walk With Me Guardian"
          >
            <span className="text-base">🛡️</span>
          </button>

          {/* Announcements bell (min 48x48dp touch target) */}
          <button
            onClick={() => setBellOpen(true)}
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-line/70 bg-cream text-ink-soft tap-spring hover:border-ink-faint hover:text-ink shadow-xs"
            title="Campus Notices"
            aria-label="Campus Notices"
          >
            <IconBell size={19} />
            {(data?.announcements.length ?? 0) > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-cream shadow-xs" />
            )}
          </button>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4 pb-24">
        {/* Apple Dynamic Island Context Capsule */}
        <div className="dynamic-island-capsule group flex items-center gap-3 rounded-full bg-[#0a1812] px-4 py-2.5 text-cream text-[11.5px] font-medium shadow-xl border border-white/15">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="truncate tracking-tight">{campusContext}</span>
          <span className="ml-auto shrink-0 rounded-full bg-white/12 px-2.5 py-0.5 text-[9.5px] font-bold tracking-wider uppercase text-emerald-300">
            Campus guide
          </span>
        </div>

        {/* Global Campus Modes Switcher */}
        <CampusModesBar
          onAction={(m) => {
            if (m === "solo") toast("Solo Zen Active: Quiet study havens highlighted on the 3D map 🧘", "ok");
            if (m === "duo") go("buddies");
            if (m === "group") go("campus");
          }}
        />

        {user.isRestricted && (
          <button
            onClick={() => go("profile")}
            className="animate-pop flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-clay/35 bg-clay-soft px-4 py-3 text-left shadow-sm transition-transform active:scale-[0.98]"
          >
            <IconShield size={18} className="shrink-0 text-clay" />
            <span className="text-xs leading-snug font-semibold text-clay">
              Account restricted — new chat requests paused. Existing chats still work. Tap to view details.
            </span>
          </button>
        )}

        <section className="space-y-5">
          <DashboardHero totalFriends={data?.pulse.total}/>
          <button onClick={()=>setDirectoryOpen(true)} className="career-secondary w-full">View all members &amp; account details</button>
          <DashboardMetrics data={data} onNavigate={go}/>
          <PersonalizedOpportunities/>
        </section>

        {/* quick actions 2x2 with pastel circular icon anchors and friendly copywriting */}
        <section className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <IconBuddies size={21} />,
              title: "Find a Buddy",
              sub: "Duo Beacons & 1-on-1 partners",
              tab: "buddies" as const,
              circleBg: "bg-[#dcfce7] text-[#15803d]", // soft pastel mint
            },
            {
              icon: <IconFlame size={21} />,
              title: "Fests & Hype",
              sub: "Gigs, street plays & practice zones",
              tab: "buddies" as const,
              circleBg: "bg-[#fef3c7] text-[#b45309]", // soft pastel amber
            },
            {
              icon: <IconSparkles size={21} />,
              title: "Sports & Vault",
              sub: "Pickup matches & gear sharing",
              tab: "buddies" as const,
              circleBg: "bg-[#ffe4e6] text-[#be123c]", // soft pastel rose
            },
            {
              icon: <IconMap size={21} />,
              title: "3D Campus Map",
              sub: "Isometric quad & heatmaps",
              tab: "campus" as const,
              circleBg: "bg-[#e0f2fe] text-[#0369a1]", // soft pastel sky
            },
          ].map((a) => (
            <button
              key={a.title}
              onClick={() => go(a.tab)}
              className="cursor-pointer rounded-2xl border border-line bg-cream p-4 text-left shadow-2xs transition-all duration-150 active:scale-[0.96] hover:border-ink-faint/60 hover:shadow-sm"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full shadow-xs ${a.circleBg}`}
              >
                {a.icon}
              </span>
              <p className="mt-3 font-display text-sm font-bold text-ink">{a.title}</p>
              <p className="text-[11px] font-semibold text-ink-faint">{a.sub}</p>
            </button>
          ))}
        </section>

        {/* official announcements with textured terracotta background and bookmark icon */}
        <section className="mt-8 pt-1">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IconBookmark size={15} className="text-[#c86d51]" />
              <h3 className="font-display text-sm font-bold text-ink">
                Official announcements
              </h3>
            </div>
            <button
              onClick={() => setBellOpen(true)}
              className="cursor-pointer text-[11px] font-bold text-[#c86d51] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-2.5">
            {!data && (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {(data?.announcements ?? []).map((a) => (
              <article
                key={a.id}
                className={`rounded-2xl border p-4 shadow-sm transition-transform duration-150 ${
                  a.pinned
                    ? "border-[#a4533a]/60 bg-gradient-to-br from-[#c86d51] via-[#be6045] to-[#a85038] text-white shadow-md shadow-[#c86d51]/25 relative overflow-hidden"
                    : "border-line bg-cream"
                }`}
              >
                {a.pinned && (
                  <div className="pointer-events-none absolute -right-3 -bottom-3 text-white/10">
                    <IconLeaf size={72} />
                  </div>
                )}
                <div className="flex items-center justify-between text-[10.5px] font-bold tracking-wider uppercase">
                  {a.pinned ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-white/20 px-2 py-0.5 text-white font-black backdrop-blur-xs">
                      <IconBookmark size={13} className="text-amber-200 fill-current" />
                      Important Notice
                    </span>
                  ) : (
                    <span className="text-ink-faint flex items-center gap-1">
                      <IconBookmark size={12} />
                      University Notice
                    </span>
                  )}
                  {a.pinned && (
                    <span className="font-mono text-[9px] text-white/80 lowercase">
                      priority
                    </span>
                  )}
                </div>
                <p className={`mt-2 font-display text-[15px] font-bold leading-snug ${a.pinned ? "text-white" : "text-ink"}`}>
                  {a.title}
                </p>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    a.pinned ? "text-white/90" : "text-ink-soft"
                  }`}
                >
                  {a.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* trending meetups */}
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IconFlame size={16} className="text-amber animate-bounce" />
              <h3 className="font-display text-sm font-bold text-ink">Trending Campus Events</h3>
            </div>
            <button
              onClick={() => go("buddies")}
              className="cursor-pointer text-[11px] font-bold text-pine hover:underline"
            >
              Explore all →
            </button>
          </div>
          <div className="space-y-2.5">
            {!data && (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}
            {(data?.trending ?? []).map((e) => {
              const tag = (e.tag || "").toLowerCase();
              const isCultural = tag === "cultural";
              const isCoding = tag === "coding";
              const isMusic = tag === "music";

              return (
                <button
                  key={e.id}
                  onClick={() => go("buddies")}
                  className="group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-line bg-cream p-2.5 text-left shadow-2xs transition-all duration-150 active:scale-[0.98] hover:border-ink-faint/60 hover:shadow-sm"
                >
                  {e.image ? (
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-pine-ink shadow-xs">
                      <img
                        src={e.image}
                        alt={e.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-1 left-1.5 text-[8px] font-black uppercase text-white drop-shadow-xs">
                        {isCultural ? "🎭 Cultural" : isCoding ? "⚡ Coding" : isMusic ? "🎵 Music" : e.tag}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-soft text-amber shadow-2xs">
                      <span className="font-display text-base leading-none font-bold">
                        {new Date(e.startsAt).getDate()}
                      </span>
                      <span className="text-[8px] font-black uppercase">
                        {new Date(e.startsAt).toLocaleDateString([], { month: "short" })}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isCultural
                            ? "bg-amber-soft text-amber"
                            : isCoding
                              ? "bg-pine-soft text-pine"
                              : "bg-line/70 text-ink-soft"
                        }`}
                      >
                        {e.tag}
                      </span>
                    </div>
                    <p className="truncate font-display text-sm font-bold text-ink mt-0.5">{e.title}</p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-ink-faint">
                      👥 <strong className="text-pine font-bold">{e.buddySeekers} seeking buddies</strong> · {e.location}
                    </p>
                  </div>
                  <IconChevronLeft size={16} className="rotate-180 text-ink-faint transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky SOS Floating Action Button (FAB) anchored in the bottom-right thumb zone */}
      <button
        onClick={() => setSosOpen(true)}
        aria-label="Campus SOS Emergency"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-13 w-13 cursor-pointer items-center justify-center rounded-full bg-[#dc2626] text-white shadow-xl shadow-red-700/40 ring-4 ring-red-500/25 transition-transform active:scale-95 hover:bg-[#b91c1c] sm:right-6 md:absolute md:bottom-20 md:right-5 tap-bounce"
        title="Campus Safety & SOS"
      >
        <span className="absolute -inset-1 rounded-full bg-red-500 animate-ping opacity-35 pointer-events-none" />
        <div className="relative flex flex-col items-center justify-center leading-none">
          <IconSiren size={20} className="text-white drop-shadow-xs" />
          <span className="mt-0.5 text-[9px] font-black tracking-wider uppercase text-white">SOS</span>
        </div>
      </button>

      <Modal open={directoryOpen} onClose={()=>setDirectoryOpen(false)}>
        <button onClick={()=>setDirectoryOpen(false)} aria-label="Close member directory" className="float-right p-2 text-ink">✕</button>
        {directoryOpen&&<MemberDirectory/>}
      </Modal>
      {/* Campus notices modal */}
      <Modal open={bellOpen} onClose={() => setBellOpen(false)}>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display text-base font-bold text-ink">Campus notices</h3>
          <button
            onClick={() => setBellOpen(false)}
            className="cursor-pointer rounded-full p-1 text-ink-faint hover:bg-line/60"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {(data?.announcements ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-paper p-3">
              <p className="text-sm font-bold text-ink">{a.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{a.body}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Campus Emergency SOS Hub */}
      <CampusSosModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        toast={toast}
      />

      {/* Walk With Me Guardian Escort */}
      {walkWithMeOpen && (
        <WalkWithMeGuardian
          onClose={() => setWalkWithMeOpen(false)}
          onToast={(msg, tone) => toast(msg, tone)}
        />
      )}
    </div>
  );
}
