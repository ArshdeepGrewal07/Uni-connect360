"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/app/page";
import { api, ApiError, fmtEventDate, yearSuffix } from "@/lib/client";
import type { BuddyCard, EventItem } from "@/lib/types";
import {
  Avatar,
  Chip,
  EmptyState,
  Segmented,
  SendRequestModal,
  Skeleton,
  Spinner,
} from "@/components/ui";
import {
  IconBuddies,
  IconCheck,
  IconClock,
  IconLock,
  IconMap,
  IconPin,
  IconSearch,
  IconSliders,
  IconUserPlus,
  IconUsers,
  IconX,
} from "@/components/icons";
import { useCampusMode } from "@/context/AppModeContext";
import { CampusModesBar } from "@/components/CampusModesBar";
import { SoloZenView } from "@/components/SoloZenView";
import { CampusCultureHub } from "@/components/CampusCultureHub";
import { AcademicCollabHub } from "@/components/AcademicCollabHub";
import { SportsRecHub } from "@/components/SportsRecHub";
import { DuoBeaconHub } from "@/components/DuoBeaconHub";
import { SquadPinsHub } from "@/components/SquadPinsHub";
import { SemanticMatchmaker } from "@/components/SemanticMatchmaker";
import { SkillBarterLedger } from "@/components/SkillBarterLedger";
import { ErrandBounties } from "@/components/ErrandBounties";
import { VerifiedMarketplace } from "@/components/VerifiedMarketplace";
import { EphemeralLocalBoard } from "@/components/EphemeralLocalBoard";

import {CareerSkillBoostHub} from "@/components/CareerSkillBoostHub";

const INTERESTS = ["Study", "Gym", "Hangout", "Gaming", "Music", "Movies", "Coffee"];

type MainHub = "people" | "exchange" | "pulse" | "study";
type PeopleSub = "classmates" | "matchmaker" | "duo";
type ExchangeSub = "bounties" | "marketplace" | "barter" | "ephemeral";
type PulseSub = "hype" | "sports" | "squad";
type StudySub = "academics" | "career" | "zen";

export function BuddiesView() {
  const { toast, go, openChat } = useApp();
  const connectPartner = async (name: string, subject: string) => {
    try {
      const result = await api<{ buddies: { id: string; fullName: string }[] }>(`/api/buddies?q=${encodeURIComponent(name)}`);
      const buddy = result.buddies.find(b => b.fullName === name);
      if (!buddy) { toast("This sample profile is not an available student. Use Classmates to message a registered buddy.", "warn"); return; }
      const resultChat = await api<{ sessionId: string }>("/api/chats", { method: "POST", body: JSON.stringify({ action: "initiate", receiverId: buddy.id, message: `Hi! Would you like to study ${subject} together?` }) });
      openChat(resultChat.sessionId);
    } catch (e) {
      if (e instanceof ApiError && typeof e.extra.sessionId === "string") openChat(e.extra.sessionId);
      else toast(e instanceof Error ? e.message : "Could not open chat.", "err");
    }
  };

  const [mainHub, setMainHub] = useState<MainHub>("people");
  const [peopleSub, setPeopleSub] = useState<PeopleSub>("classmates");
  const [exchangeSub, setExchangeSub] = useState<ExchangeSub>("bounties");
  const [pulseSub, setPulseSub] = useState<PulseSub>("hype");
  const [studySub, setStudySub] = useState<StudySub>("academics");


  return (
    <div className="flex min-h-0 h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-paper/85 px-4 pt-3.5 pb-2.5 shadow-2xs backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-ink tracking-tight">Campus Community</h1>
            <p className="text-[11px] font-medium text-ink-faint">
              Connect, collaborate, trade & explore campus life
            </p>
          </div>
          <span className="rounded-full bg-pine/10 px-3 py-1 text-[10px] font-bold text-pine uppercase tracking-wider">
            {mainHub === "people" && peopleSub === "classmates" ? "Students" : "Saved · Samples included"}
          </span>
        </div>

        {/* Global Modes Switcher */}
        <div className="mt-2.5">
          <CampusModesBar
            onAction={(m) => {
              if (m === "solo") {
                setMainHub("study");
                setStudySub("zen");
              }
              if (m === "duo") {
                setMainHub("people");
                setPeopleSub("duo");
              }
              if (m === "group") {
                setMainHub("pulse");
                setPulseSub("squad");
              }
            }}
          />
        </div>

        {/* 4 Main Segmented Control Hub Tabs */}
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-ink/5 p-1 backdrop-blur-md">
          {(
            [
              { key: "people", label: "People", icon: "👥" },
              { key: "exchange", label: "Exchange", icon: "🤝" },
              { key: "pulse", label: "Pulse", icon: "🔥" },
              { key: "study", label: "Academics", icon: "📚" },
            ] as const
          ).map((t) => {
            const active = mainHub === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setMainHub(t.key)}
                className={`tap-spring flex cursor-pointer items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all duration-300 ${
                  active
                    ? "bg-cream text-ink shadow-sm border border-line scale-[1.02]"
                    : "text-ink-soft hover:text-ink hover:bg-white/40"
                }`}
              >
                <span>{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Level 2: Clean Sub-Segment Pills */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {mainHub === "people" && (
            <>
              <Chip active={peopleSub === "classmates"} onClick={() => setPeopleSub("classmates")}>
                👥 Classmates
              </Chip>
              <Chip active={peopleSub === "matchmaker"} onClick={() => setPeopleSub("matchmaker")}>
                🤖 AI Matchmaker
              </Chip>
              <Chip active={peopleSub === "duo"} onClick={() => setPeopleSub("duo")}>
                📡 Duo Radar
              </Chip>
            </>
          )}

          {mainHub === "exchange" && (
            <>
              <Chip active={exchangeSub === "bounties"} onClick={() => setExchangeSub("bounties")}>
                ⚡ Hostel Favors
              </Chip>
              <Chip active={exchangeSub === "marketplace"} onClick={() => setExchangeSub("marketplace")}>
                🛍️ Gear Market
              </Chip>
              <Chip active={exchangeSub === "barter"} onClick={() => setExchangeSub("barter")}>
                🔄 Skill Barter
              </Chip>
              <Chip active={exchangeSub === "ephemeral"} onClick={() => setExchangeSub("ephemeral")}>
                📡 Wi-Fi Drop
              </Chip>
            </>
          )}

          {mainHub === "pulse" && (
            <>
              <Chip active={pulseSub === "hype"} onClick={() => setPulseSub("hype")}>
                🔥 Fests & Hype
              </Chip>
              <Chip active={pulseSub === "sports"} onClick={() => setPulseSub("sports")}>
                🏸 Sports & Rec
              </Chip>
              <Chip active={pulseSub === "squad"} onClick={() => setPulseSub("squad")}>
                📍 Squad Rally
              </Chip>
            </>
          )}

          {mainHub === "study" && (
            <>
              <Chip active={studySub === "academics"} onClick={() => setStudySub("academics")}>
                📖 Academics & Notes
              </Chip>
              <Chip active={studySub === "career"} onClick={() => setStudySub("career")}>🚀 Career &amp; Skills</Chip>
              <Chip active={studySub === "zen"} onClick={() => setStudySub("zen")}>
                🧘 Solo Zen Focus
              </Chip>
            </>
          )}
        </div>
      </header>

      {/* Hub Content Area */}
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-4">
        {/* PEOPLE HUB */}
        {mainHub === "people" && (
          <>
            {peopleSub === "classmates" && <BuddyList />}
            {peopleSub === "matchmaker" && <SemanticMatchmaker onToast={(m, t) => toast(m, t)} />}
            {peopleSub === "duo" && (
              <DuoBeaconHub
                onConnect={connectPartner}
                onToast={(m, t) => toast(m, t)}
              />
            )}
          </>
        )}

        {/* EXCHANGE HUB */}
        {mainHub === "exchange" && (
          <>
            {exchangeSub === "bounties" && <ErrandBounties onToast={(m, t) => toast(m, t)} />}
            {exchangeSub === "marketplace" && <VerifiedMarketplace onToast={(m, t) => toast(m, t)} />}
            {exchangeSub === "barter" && <SkillBarterLedger onToast={(m, t) => toast(m, t)} />}
            {exchangeSub === "ephemeral" && <EphemeralLocalBoard />}
          </>
        )}

        {/* PULSE HUB */}
        {mainHub === "pulse" && (
          <>
            {pulseSub === "hype" && <CampusCultureHub onToast={(m, t) => toast(m, t)} />}
            {pulseSub === "sports" && <SportsRecHub onToast={(m, t) => toast(m, t)} />}
            {pulseSub === "squad" && (
              <SquadPinsHub onNavigateToPin={() => go("campus")} onToast={(m, t) => toast(m, t)} />
            )}
          </>
        )}

        {/* STUDY HUB */}
        {mainHub === "study" && (
          <>
            {studySub === "academics" && <AcademicCollabHub onToast={(m, t) => toast(m, t)} />}
            {studySub === "career" && <CareerSkillBoostHub/>}
            {studySub === "zen" && <SoloZenView onNavigateToSpot={() => go("campus")} />}
          </>
        )}
      </div>
    </div>
  );

}

function BuddyList() {
    const { me, toast, openChat, refreshMe } = useApp();
    const [search, setSearch] = useState("");
    const [sameGender, setSameGender] = useState(false);
    const [year, setYear] = useState(0);
    const [interest, setInterest] = useState("");
    const [list, setList] = useState<BuddyCard[] | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [selectedRecipient, setSelectedRecipient] = useState<BuddyCard | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const load = useCallback(async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (sameGender) params.set("sameGender", "1");
      if (year) params.set("year", String(year));
      if (interest) params.set("interest", interest);
      try {
        const res = await api<{ buddies: BuddyCard[] }>(`/api/buddies?${params}`);
        setList(res.buddies);
      } catch {
        setList([]);
      }
    }, [search, sameGender, year, interest]);

    useEffect(() => {
      const timer = setTimeout(() => {
        load();
      }, 180);
      return () => clearTimeout(timer);
    }, [load]);

    const handleOpenRequest = (b: BuddyCard) => {
      if (me?.user.isRestricted) {
        toast(
          "Your account is restricted — new chat requests are paused until a pending one is accepted.",
          "err"
        );
        return;
      }
      setSelectedRecipient(b);
      setModalOpen(true);
    };

    const handleSendRequest = async (msg: string) => {
      if (!selectedRecipient) return;
      setBusyId(selectedRecipient.id);
      try {
        const res = await api<{ sessionId: string }>("/api/chats", {
          method: "POST",
          body: JSON.stringify({
            action: "initiate",
            receiverId: selectedRecipient.id,
            message: msg,
          }),
        });
        toast(
          `Request sent to ${selectedRecipient.firstName} — 48-hour safe window started.`,
          "ok"
        );
        setModalOpen(false);
        await refreshMe();
        openChat(res.sessionId);
      } catch (e) {
        if (e instanceof ApiError && e.code === "restricted") {
          toast(e.message, "err");
          setModalOpen(false);
          await refreshMe();
        } else if (e instanceof ApiError && (e.code === "exists" || e.code === "pending")) {
          const sid = e.extra.sessionId as string | undefined;
          setModalOpen(false);
          if (sid) openChat(sid);
          else toast(e.message, "warn");
        } else {
          toast(e instanceof Error ? e.message : "Could not send request.", "err");
        }
      } finally {
        setBusyId(null);
      }
    };

    return (
      <div className="flex flex-col">
        {/* filter bar */}
        <div className="space-y-2.5 border-b border-line bg-paper px-4 py-3">
          {/* Search bar */}
          <label className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2 shadow-2xs focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/10">
            <IconSearch size={16} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, branch, or course..."
              className="w-full bg-transparent text-xs font-semibold text-ink outline-none placeholder:text-ink-faint"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="cursor-pointer text-ink-faint hover:text-ink"
              >
                <IconX size={14} />
              </button>
            )}
          </label>

          <button
            onClick={() => setSameGender((v) => !v)}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
              sameGender ? "border-pine bg-pine-soft" : "border-line bg-cream"
            }`}
          >
            <IconLock size={15} className={sameGender ? "text-pine" : "text-ink-faint"} />
            <span className={`flex-1 text-xs font-bold ${sameGender ? "text-pine" : "text-ink"}`}>
              Same-gender matches only
            </span>
            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${
                sameGender ? "bg-pine" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream shadow transition-all ${
                  sameGender ? "left-4.5" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            <Chip active={year === 0} onClick={() => setYear(0)}>
              <IconSliders size={12} /> All years
            </Chip>
            {[1, 2, 3, 4].map((y) => (
              <Chip key={y} active={year === y} onClick={() => setYear(year === y ? 0 : y)}>
                {yearSuffix(y)} year
              </Chip>
            ))}
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {INTERESTS.map((i) => (
              <Chip
                key={i}
                active={interest === i}
                onClick={() => setInterest(interest === i ? "" : i)}
              >
                {i}
              </Chip>
            ))}
          </div>
        </div>

        {/* buddy list */}
        <div className="space-y-2.5 px-4 py-3 pb-8">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-faint">
            <span className="flex items-center gap-1">
              <IconLock size={11} /> Registration IDs & phones are protected
            </span>
            {list && <span>{list.length} students found</span>}
          </div>

          {list === null && (
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {list?.length === 0 && (
            <EmptyState
              icon={<IconBuddies size={22} />}
              title="No classmates found"
              body="Try changing the interest filter, branch search, or academic year."
              action={
                search || interest || year || sameGender ? (
                  <button
                    onClick={() => {
                      setSearch("");
                      setYear(0);
                      setInterest("");
                      setSameGender(false);
                    }}
                    className="cursor-pointer rounded-xl bg-pine px-4 py-2 font-display text-xs font-bold text-cream"
                  >
                    Reset Filters
                  </button>
                ) : undefined
              }
            />
          )}

          {list?.map((b) => {
            const rel = b.relation;
            return (
              <article
                key={b.id}
                className="animate-fade-up flex items-start gap-3 rounded-2xl border border-line bg-cream p-3.5 shadow-2xs transition-all hover:border-ink-faint/50 hover:shadow-xs"
              >
                <Avatar name={b.firstName} hue={b.avatarHue} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15px] font-bold text-ink">
                    {b.firstName}
                    <span className="ml-1.5 text-xs font-semibold text-ink-faint">
                      {b.course} · {yearSuffix(b.academicYear)} yr
                    </span>
                  </p>
                  {b.lookingFor && (
                    <p className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-amber-soft px-2 py-0.5 text-[11px] font-bold text-[#7a5210]">
                      🎯 {b.lookingFor}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {b.interests.map((i) => (
                      <span
                        key={i}
                        className="rounded-md bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-soft"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {rel?.status === "accepted" ? (
                    <button
                      onClick={() => openChat(rel.sessionId)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-xs font-bold text-cream shadow-2xs transition-transform active:scale-95"
                    >
                      <IconCheck size={13} /> Chat
                    </button>
                  ) : rel?.status === "pending" ? (
                    <button
                      onClick={() => openChat(rel.sessionId)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber/50 bg-amber-soft px-3 py-2 text-xs font-bold text-[#8a5c12] shadow-2xs transition-transform active:scale-95"
                    >
                      <IconClock size={13} /> {rel.iInitiated ? "Pending" : "Review"}
                    </button>
                  ) : me?.user.isRestricted ? (
                    <span className="flex items-center gap-1 rounded-xl bg-line/60 px-3 py-2 text-xs font-bold text-ink-faint">
                      <IconLock size={12} /> Restricted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenRequest(b)}
                      disabled={busyId === b.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-pine px-3.5 py-2 text-xs font-bold text-cream shadow-sm shadow-pine/20 transition-transform active:scale-95 disabled:opacity-60"
                    >
                      {busyId === b.id ? (
                        <Spinner size={13} />
                      ) : (
                        <IconUserPlus size={14} />
                      )}
                      Connect
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Custom animated in-app send request modal replacing window.prompt */}
        <SendRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          recipient={selectedRecipient}
          onSend={handleSendRequest}
          busy={busyId !== null}
        />
      </div>
    );
  }

  function EventList() {
    const { toast } = useApp();
    const [events, setEvents] = useState<EventItem[] | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
      try {
        const res = await api<{ events: EventItem[] }>("/api/events");
        setEvents(res.events);
      } catch {
        setEvents([]);
      }
    }, []);

    useEffect(() => {
    let dispose: void | (() => void);
    const initialSync = setTimeout(() => {
      dispose = (() => {
      load();
    
      })();
    }, 0);
    return () => { clearTimeout(initialSync); if (dispose) dispose(); };
  }, [load]);

    const toggleRsvp = async (e: EventItem) => {
      setBusyId(e.id);
      try {
        const res = await api<{ going: boolean }>("/api/events", {
          method: "POST",
          body: JSON.stringify({ eventId: e.id, wantsBuddy: true }),
        });
        toast(
          res.going
            ? `You're going to "${e.title}"! We'll match you with buddy seekers.`
            : "RSVP removed.",
          res.going ? "ok" : "warn"
        );
        load();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not update RSVP.", "err");
      } finally {
        setBusyId(null);
      }
    };

    return (
      <div className="no-scrollbar h-full space-y-3 overflow-y-auto px-4 py-4 pb-8">
        {events === null && (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        )}

        {events?.map((e) => {
          const tag = (e.tag || "").toLowerCase();
          const isCultural = tag === "cultural";
          const isCoding = tag === "coding";
          const isMusic = tag === "music";

          return (
            <article
              key={e.id}
              className="animate-fade-up group relative overflow-hidden rounded-3xl border border-line bg-cream shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-faint/50 hover:shadow-md"
            >
              {/* Event Cover Image Banner */}
              {e.image ? (
                <div className="relative h-44 w-full overflow-hidden bg-pine-ink">
                  <img
                    src={e.image}
                    alt={e.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top Badge: Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black tracking-wider uppercase shadow-md backdrop-blur-md ${
                        isCultural
                          ? "bg-amber-500/90 text-white ring-1 ring-white/30"
                          : isCoding
                            ? "bg-emerald-600/90 text-white ring-1 ring-white/30"
                            : isMusic
                              ? "bg-purple-600/90 text-white ring-1 ring-white/30"
                              : "bg-pine/90 text-cream ring-1 ring-white/30"
                      }`}
                    >
                      {isCultural && "🎭"}
                      {isCoding && "⚡"}
                      {isMusic && "🎵"}
                      {!isCultural && !isCoding && !isMusic && "✨"}
                      {e.tag}
                    </span>
                  </div>

                  {/* Top Right Date Stamp */}
                  <div className="absolute top-3 right-3 flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-white/95 text-ink shadow-lg backdrop-blur-md">
                    <span className="font-display text-lg leading-none font-black text-pine">
                      {new Date(e.startsAt).getDate()}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase text-ink-faint">
                      {new Date(e.startsAt).toLocaleDateString([], { month: "short" })}
                    </span>
                  </div>

                  {/* Overlay Title on Image */}
                  <div className="absolute right-3 bottom-3 left-3">
                    <h3 className="font-display text-base font-bold text-white drop-shadow-sm line-clamp-1">
                      {e.title}
                    </h3>
                  </div>
                </div>
              ) : null}

              <div className="p-4">
                {!e.image && (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-pine-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-pine uppercase">
                        {e.tag}
                      </span>
                      <h3 className="mt-1.5 font-display text-[15px] font-bold text-ink">{e.title}</h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-soft text-amber shadow-2xs">
                      <span className="font-display text-base leading-none font-bold">
                        {new Date(e.startsAt).getDate()}
                      </span>
                      <span className="text-[8px] font-black uppercase">
                        {new Date(e.startsAt).toLocaleDateString([], { month: "short" })}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs leading-relaxed text-ink-soft line-clamp-2">{e.description}</p>

                {/* Event Location & Timing Meta */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-semibold text-ink-faint">
                  <span className="inline-flex items-center gap-1">
                    <IconClock size={12} className="text-amber" /> {fmtEventDate(e.startsAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-ink">
                    <IconPin size={12} className="text-clay" /> {e.location}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-pine">
                    <IconUsers size={12} className="text-pine" /> {e.going} going ({e.buddySeekers} seeking buddies)
                  </span>
                </div>

                {/* Group Meeting Buddy Roster (Who's Going) */}
                {e.attendees && e.attendees.length > 0 && (
                  <div className="mt-3 rounded-xl border border-line/70 bg-paper/60 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-wider uppercase text-ink-faint">
                        👥 Group Meeting Buddies Going
                      </span>
                      <span className="text-[10px] font-bold text-pine">
                        {e.attendees.length} joined
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Avatar stack */}
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {e.attendees.slice(0, 5).map((att) => (
                          <div key={att.id} title={`${att.firstName} (${att.course})`}>
                            <Avatar
                              name={att.firstName}
                              hue={att.avatarHue}
                              size={28}
                              className="ring-2 ring-cream shadow-2xs"
                            />
                          </div>
                        ))}
                        {e.attendees.length > 5 && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-[10px] font-black text-cream ring-2 ring-cream">
                            +{e.attendees.length - 5}
                          </span>
                        )}
                      </div>

                      {/* Quick Meetup Buddy Seekers Pill */}
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-ink-soft">
                          {e.attendees.filter((a) => a.wantsBuddy).map((a) => a.firstName).slice(0, 2).join(", ")}
                          {e.attendees.filter((a) => a.wantsBuddy).length > 2 ? " + more" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleRsvp(e)}
                  disabled={busyId === e.id}
                  className={`mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-2.5 font-display text-sm font-bold shadow-2xs transition-all active:scale-[0.98] disabled:opacity-60 ${
                    e.iAmGoing
                      ? "border border-pine bg-pine-soft text-pine"
                      : "bg-pine text-cream shadow-pine/20 hover:bg-pine-deep"
                  }`}
                >
                  {busyId === e.id ? (
                    <Spinner size={15} />
                  ) : e.iAmGoing ? (
                    <>
                      <IconCheck size={15} /> Going · Finding your group meetup buddies
                    </>
                  ) : (
                    "I'm going · Match me with a group"
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }
