"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/app/page";
import { api, ApiError, fmtCountdown, timeAgo } from "@/lib/client";
import type { ChatDetail, ChatListData, MessageItem } from "@/lib/types";
import { Avatar, EmptyState, Lightbox, Modal, Skeleton, Spinner } from "@/components/ui";
import {
  IconCamera,
  IconCalendarCheck,
  IconCheck,
  IconChat,
  IconChevronLeft,
  IconClock,
  IconFastForward,
  IconFlag,
  IconLock,
  IconMic,
  IconPause,
  IconPin,
  IconPlay,
  IconSearch,
  IconSend,
  IconSparkles,
  IconX,
} from "@/components/icons";

function Countdown({ endsAt, className = "" }: { endsAt: string; className?: string }) {
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return (
    <span className={`font-display font-bold tabular-nums ${className}`}>
      {left > 0 ? `⏱️ ${fmtCountdown(left)}` : "Expired"}
    </span>
  );
}

export function ChatsView() {
  const { chatId } = useApp();
  return chatId ? <ChatDetailView key={chatId} id={chatId} /> : <ChatListView />;
}

/* -------------------------------- chat list -------------------------------- */

function ChatListView() {
  const { me, refreshMe, openChat } = useApp();
  const [data, setData] = useState<ChatListData | null>(null);
  const [tab, setTab] = useState<"active" | "requests">("active");
  const [search, setSearch] = useState("");
  const lastSync = useRef({ restricted: me?.user.isRestricted ?? false, badge: -1 });

  const load = useCallback(async () => {
    try {
      const res = await api<ChatListData>("/api/chats");
      setData(res);
      const badge =
        res.chats.filter((c) => c.status === "pending" && !c.iInitiated).length +
        res.chats.reduce((n, c) => n + c.unread, 0);
      if (
        res.restricted !== lastSync.current.restricted ||
        badge !== lastSync.current.badge
      ) {
        lastSync.current = { restricted: res.restricted, badge };
        refreshMe();
      }
    } catch {
      /* transient */
    }
  }, [refreshMe]);

  useEffect(() => {
    let dispose: void | (() => void);
    const initialSync = setTimeout(() => {
      dispose = (() => {
    load();
    const t = setInterval(load, 3500);
    return () => clearInterval(t);
  
      })();
    }, 0);
    return () => { clearTimeout(initialSync); if (dispose) dispose(); };
  }, [load]);

  const sQuery = search.trim().toLowerCase();

  const filterChat = (c: { other: { fullName: string; course: string }; lastMessage?: string | null }) => {
    if (!sQuery) return true;
    return (
      c.other.fullName.toLowerCase().includes(sQuery) ||
      c.other.course.toLowerCase().includes(sQuery) ||
      (c.lastMessage?.toLowerCase() ?? "").includes(sQuery)
    );
  };

  const incoming = (data?.chats.filter((c) => c.status === "pending" && !c.iInitiated) ?? []).filter(filterChat);
  const active = (data?.chats.filter((c) => c.status === "accepted") ?? []).filter(filterChat);
  const outgoing = (
    data?.chats.filter(
      (c) =>
        (c.status === "pending" && c.iInitiated) ||
        c.status === "expired" ||
        c.status === "declined"
    ) ?? []
  ).filter(filterChat);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-paper px-4 pt-4 pb-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-ink">Messages</h1>
          <span className="text-[11px] font-bold text-pine">
            {active.length} active chats
          </span>
        </div>

        {/* Search in chats */}
        <div className="mt-2.5">
          <label className="flex items-center gap-2 rounded-xl border border-line bg-cream px-3 py-2 shadow-2xs focus-within:border-pine">
            <IconSearch size={15} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter chats by name or message..."
              className="w-full bg-transparent text-xs font-semibold text-ink outline-none placeholder:text-ink-faint"
            />
            {search && (
              <button onClick={() => setSearch("")} className="cursor-pointer text-ink-faint">
                <IconX size={14} />
              </button>
            )}
          </label>
        </div>

        <div className="mt-3 flex gap-1">
          {(["active", "requests"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative cursor-pointer rounded-t-xl px-4 py-2.5 font-display text-sm font-bold transition-all ${
                tab === t
                  ? "bg-cream text-pine shadow-2xs"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {t === "active" ? "Active Chats" : `Requests (${incoming.length})`}
              {t === "requests" && incoming.length > 0 && (
                <span className="absolute top-2 right-1.5 h-2 w-2 rounded-full bg-clay" />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto bg-paper px-4 py-4">
        {!data && (
          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-18 w-full" />
            <Skeleton className="h-18 w-full" />
            <Skeleton className="h-18 w-full" />
          </div>
        )}

        {tab === "requests" &&
          (incoming.length === 0 && data ? (
            <EmptyState
              icon={<IconChat size={20} />}
              title="No pending requests"
              body="When classmates reach out to connect, their requests appear here with a 48-hour safe window."
            />
          ) : (
            incoming.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c.id)}
                className="animate-fade-up w-full cursor-pointer rounded-2xl border border-line border-l-4 border-l-amber bg-cream p-3.5 text-left shadow-2xs transition-all active:scale-[0.98] hover:border-ink-faint/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.other.fullName} hue={c.other.avatarHue} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-ink">
                      {c.other.firstName}
                      <span className="ml-1.5 text-[11px] font-semibold text-ink-faint">
                        {c.other.course}
                      </span>
                    </p>
                    <p className="truncate text-xs text-ink-soft">“{c.lastMessage}”</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-[#8a5c12]">
                      New request
                    </span>
                    <p className="mt-1 text-[10px] font-bold text-ink-faint">
                      {timeAgo(c.lastMessageAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ))}

        {tab === "active" && (
          <>
            {outgoing.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c.id)}
                className="animate-fade-up w-full cursor-pointer rounded-2xl border border-line bg-cream p-3.5 text-left shadow-2xs transition-all active:scale-[0.98] hover:border-ink-faint/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.other.fullName} hue={c.other.avatarHue} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-ink">{c.other.firstName}</p>
                    <p className="truncate text-xs text-ink-soft">
                      {c.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {c.status === "pending" ? (
                      <Countdown endsAt={c.timerEndsAt} className="text-[11px] text-amber" />
                    ) : c.status === "expired" ? (
                      <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-bold text-clay">
                        Expired
                      </span>
                    ) : (
                      <span className="rounded-full bg-line/60 px-2 py-0.5 text-[10px] font-bold text-ink-faint">
                        Declined
                      </span>
                    )}
                    <p className="mt-1 text-[10px] font-bold text-ink-faint">
                      {timeAgo(c.lastMessageAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {active.length === 0 && outgoing.length === 0 && data && (
              <EmptyState
                icon={<IconChat size={20} />}
                title="No active conversations"
                body="Connect with classmates from the Buddy Finder to start chatting."
              />
            )}

            {active.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c.id)}
                className="animate-fade-up flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-cream p-3.5 text-left shadow-2xs transition-all active:scale-[0.98] hover:border-ink-faint/50"
              >
                <Avatar name={c.other.fullName} hue={c.other.avatarHue} size={44} status="online" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-ink">{c.other.fullName}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {c.lastMessageKind === "image"
                      ? "📷 Photo"
                      : c.lastMessageKind === "voice"
                        ? "🎙️ Voice note"
                        : c.lastMessage}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {c.unread > 0 && (
                    <span className="mb-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[10px] font-bold text-cream">
                      {c.unread}
                    </span>
                  )}
                  <p className="text-[10px] font-bold text-ink-faint">
                    {timeAgo(c.lastMessageAt)}
                  </p>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- chat detail ------------------------------- */

function ChatDetailView({ id }: { id: string }) {
  const { go, toast, refreshMe } = useApp();
  const [data, setData] = useState<ChatDetail | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendLock = useRef(false);
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [meetupTime, setMeetupTime] = useState("");
  useEffect(() => () => {
    if (recordTimer.current) clearTimeout(recordTimer.current);
    if (recorder.current) {
      recorder.current.onstop = null;
      if (recorder.current.state !== "inactive") recorder.current.stop();
      recorder.current.stream.getTracks().forEach(t => t.stop());
    }
  }, []);
  const [reportOpen, setReportOpen] = useState(false);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const prevStatus = useRef<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<ChatDetail>(`/api/chats?id=${id}`);
      setData((prev) => {
        // preserve optimistic messages not yet fetched
        return res;
      });
      if (prevStatus.current && prevStatus.current !== res.session.status) {
        if (res.session.status === "accepted") {
          toast(
            res.session.waivedAt
              ? "Accepted after window — restriction lifted & media unlocked."
              : "Request accepted — media & voice notes unlocked.",
            "ok"
          );
        }
        if (res.session.status === "expired") {
          toast("The 48-hour safe window expired.", "warn");
        }
        refreshMe();
      }
      prevStatus.current = res.session.status;
    } catch {
      /* transient */
    }
  }, [id, toast, refreshMe]);

  useEffect(() => {
    let dispose: void | (() => void);
    const initialSync = setTimeout(() => {
      dispose = (() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  
      })();
    }, 0);
    return () => { clearTimeout(initialSync); if (dispose) dispose(); };
  }, [load]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages.length]);

  const s = data?.session;
  const meId = useMeId();
  const isInitiator = s?.iInitiated ?? false;

  const send = async (kind: "text" | "image" | "voice", body: string) => {
    if (!s || sendLock.current) return false;
    sendLock.current = true;
    setSending(true);

    // Optimistic UI append
    const tempId = "temp-" + Date.now();
    const optMsg: MessageItem = {
      id: tempId,
      senderId: meId,
      kind,
      body,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => (prev ? { ...prev, messages: [...prev.messages, optMsg] } : prev));
    if (kind === "text" && body === text.trim()) setText("");

    try {
      await api("/api/chats", {
        method: "POST",
        body: JSON.stringify({ action: "message", sessionId: s.id, kind, body }),
      });
      await load();
      return true;
    } catch (e) {
      if (kind === "text") setText(current => current || body);
      // Revert on error
      setData((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev
      );
      if (e instanceof ApiError && e.code === "media_locked") {
        toast(e.message, "warn");
      } else {
        toast(e instanceof Error ? e.message : "Could not send message.", "err");
      }
      return false;
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  };

  const sendFile = async (file: Blob, kind: "image" | "voice") => {
    if (file.size > 2 * 1024 * 1024) { toast("Choose a file smaller than 2 MB.", "warn"); return; }
    setPreparing(true);
    try {
      const body = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read this file."));
        reader.readAsDataURL(file);
      });
      await send(kind, body);
    } catch (error) { toast(error instanceof Error ? error.message : "File could not be sent.", "err"); }
    finally { setPreparing(false); }
  };

  const toggleRecording = async () => {
    if (recording && recorder.current) {
      if (recordTimer.current) clearTimeout(recordTimer.current);
      recorder.current.stop();
      return;
    }
    if (preparing || sending) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast("Voice recording needs a supported browser on HTTPS or localhost.", "warn"); return;
    }
    setPreparing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let instance: MediaRecorder;
      try { instance = new MediaRecorder(stream); }
      catch (error) { stream.getTracks().forEach(t => t.stop()); throw error; }
      recorder.current = instance;
      const chunks: BlobPart[] = [];
      instance.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      instance.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: instance.mimeType || "audio/webm" });
        if (blob.size) void sendFile(blob, "voice");
      };
      instance.start();
      setRecording(true);
      recordTimer.current = setTimeout(() => { if (instance.state !== "inactive") instance.stop(); }, 60_000);
    } catch { toast("Microphone unavailable. Allow microphone access and try again.", "err"); }
    finally { setPreparing(false); }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) { toast("Location is not supported by this browser.", "warn"); return; }
    setPreparing(true);
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude, accuracy } = position.coords;
      await send("text", `📍 Shared location (accuracy ±${Math.round(accuracy)} m): https://www.google.com/maps?q=${latitude},${longitude}`);
      setPreparing(false);
    }, error => {
      setPreparing(false);
      toast(error.code === 1 ? "Location permission denied. Allow location in browser settings." : "Could not get your location. Check GPS and try again.", "err");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  };

  const respond = async (response: "accept" | "decline") => {
    if (!s) return;
    try {
      await api("/api/chats", {
        method: "POST",
        body: JSON.stringify({ action: "respond", sessionId: s.id, response }),
      });
      if (response === "accept") toast("Accepted — media & voice notes unlocked.", "ok");
      else {
        toast("Request declined.", "warn");
        go("chats");
      }
      await load();
      await refreshMe();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action failed.", "err");
    }
  };

  const fastForward = async () => {
    if (!s) return;
    try {
      const res = await api<{ restricted: boolean }>("/api/chats", {
        method: "POST",
        body: JSON.stringify({ action: "fast-forward", sessionId: s.id }),
      });
      toast(
        res.restricted
          ? "Simulated 48h elapsed — request expired and account restricted."
          : "Timer fast-forwarded.",
        res.restricted ? "warn" : "ok"
      );
      await load();
      await refreshMe();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Simulation action failed.", "err");
    }
  };

  const mediaLocked = !(s?.status === "accepted" && s?.mediaUnlocked);

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* header */}
      <header className="flex items-center gap-2.5 border-b border-line bg-cream px-3 py-2.5 shadow-2xs">
        <button
          aria-label="Back to chats"
          onClick={() => go("chats")}
          className="cursor-pointer rounded-full p-1.5 text-ink-soft hover:bg-line/60"
        >
          <IconChevronLeft size={20} />
        </button>
        {s && <Avatar name={s.other.fullName} hue={s.other.avatarHue} size={36} status="online" />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-ink">
            {s?.other.fullName ?? "…"}
          </p>
          <p className="truncate text-[10px] font-semibold text-ink-faint">
            {s?.status === "accepted"
              ? s.mediaUnlocked
                ? "Connected · media unlocked"
                : "Connected"
              : s?.status === "pending"
                ? "Safe 48h request window active"
                : s?.status === "expired"
                  ? "Request window expired"
                  : "Request declined"}
          </p>
        </div>
        {s && s.status !== "declined" && (
          <button
            onClick={() => setReportOpen(true)}
            className="cursor-pointer rounded-full p-1.5 text-ink-faint hover:bg-clay-soft hover:text-clay"
            title="Report user"
          >
            <IconFlag size={17} />
          </button>
        )}
      </header>

      {/* state banners */}
      {s?.status === "pending" && !isInitiator && (
        <div className="border-b border-amber/30 bg-amber-soft px-4 py-2 text-xs font-bold text-[#7a5210]">
          New buddy request from {s.other.firstName}. Media remains locked until accepted.
        </div>
      )}

      {s?.status === "pending" && isInitiator && (
        <div className="border-b border-amber/30 bg-amber-soft px-4 py-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#7a5210]">
              Waiting on {s.other.firstName} ·{" "}
              <Countdown endsAt={s.timerEndsAt} className="text-[#5c3c08]" />
            </p>
            <button
              onClick={fastForward}
              className="flex cursor-pointer items-center gap-1 rounded-md bg-pine-ink/10 px-2 py-0.5 text-[10px] font-bold text-[#4a330a] hover:bg-pine-ink/20"
            >
              <IconFastForward size={11} /> Simulate 48h
            </button>
          </div>
        </div>
      )}

      {s?.status === "expired" && (
        <div className="border-b border-clay/25 bg-clay-soft px-4 py-2.5 shadow-2xs">
          <p className="text-xs font-bold text-clay">
            This request expired after 48 hours without a reply.{" "}
            {isInitiator
              ? "New outreaches are temporarily restricted. If they accept later, you are unrestricted instantly."
              : "You can still accept to lift their restriction."}
          </p>
          {!isInitiator && (
            <button
              onClick={() => respond("accept")}
              className="mt-2 cursor-pointer rounded-xl bg-clay px-3 py-1.5 text-xs font-bold text-cream shadow-xs"
            >
              Unrestrict & accept
            </button>
          )}
        </div>
      )}

      {s?.status === "accepted" && s.waivedAt && (
        <div className="border-b border-pine/25 bg-pine-soft px-4 py-2 text-[11px] font-bold text-pine">
          Accepted after 48h safe window — restriction lifted automatically.
        </div>
      )}

      {/* messages scroller */}
      <div ref={scroller} className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {!data && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="ml-auto h-12 w-48" />
          </div>
        )}
        {data?.messages.map((m) => (
          <Bubble
            key={m.id}
            m={m}
            mine={m.senderId === meId}
            onPhotoClick={setLightboxSrc}
          />
        ))}
        {s?.status === "accepted" && (
          <p className="pt-2 text-center text-[10px] font-semibold text-ink-faint">
            🔒 Media & voice notes are unlocked in this verified chat.
          </p>
        )}
      </div>

      {/* composer */}
      {s && s.status !== "declined" && s.status !== "expired" && (
        <div className="border-t border-line bg-cream px-3 py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-xs">
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void sendFile(file, "image");
          }} />
          {recording && <p role="status" className="pb-2 text-xs text-clay">Recording… tap the pause button to stop and send (60 seconds maximum).</p>}
          {preparing && <p role="status" className="pb-2 text-xs text-pine">Preparing attachment or location…</p>}
          <div className="flex items-center gap-2">
            <MediaButton
              locked={mediaLocked}
              icon={<IconCamera size={18} />}
              label="Attach image from device"
              onLockedClick={() =>
                toast(
                  s.status === "pending"
                    ? `🔒 Locked until ${s.other.firstName} accepts your request.`
                    : "🔒 Media is locked in this chat.",
                  "warn"
                )
              }
              onClick={() => { if (!sending && !preparing && !recording) fileInput.current?.click(); }}
            />
            <MediaButton
              locked={mediaLocked}
              icon={recording ? <IconPause size={18} /> : <IconMic size={18} />}
              label={recording ? "Stop and send recording" : "Record voice message"}
              onLockedClick={() =>
                toast(
                  s.status === "pending"
                    ? `🔒 Voice notes unlock when ${s.other.firstName} accepts.`
                    : "🔒 Media is locked in this chat.",
                  "warn"
                )
              }
              onClick={toggleRecording}
            />
            {/* Propose Meetup button */}
            <button
              type="button"
              onClick={() => setMeetupOpen(true)}
              className="cursor-pointer rounded-full border border-pine/30 bg-pine-soft p-2.5 text-pine shadow-2xs transition-transform active:scale-90 hover:bg-pine hover:text-cream"
              title="Propose Meetup Location & Timing"
            >
              <IconPin size={18} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && !sending && text.trim()) send("text", text.trim());
              }}
              placeholder={
                s.status === "pending" && isInitiator
                  ? "Text only while pending acceptance…"
                  : "Send a message…"
              }
              className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink shadow-2xs outline-none focus:border-pine focus:ring-2 focus:ring-pine/10"
            />
            <button
              aria-label="Send message"
              disabled={sending || !text.trim()}
              onClick={() => send("text", text.trim())}
              className="cursor-pointer rounded-full bg-pine p-2.5 text-cream shadow-sm transition-transform active:scale-90 disabled:opacity-40"
            >
              <IconSend size={18} />
            </button>
          </div>
        </div>
      )}

      {/* receiver action row */}
      {s && s.status === "pending" && !isInitiator && (
        <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-line bg-cream px-3 pt-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-md">
          <button
            onClick={() => respond("accept")}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-pine py-3 font-display text-sm font-bold text-cream shadow-lg shadow-pine/20 active:scale-[0.98]"
          >
            <IconLock size={15} /> Accept & Unlock Media
          </button>
          <button
            onClick={() => respond("decline")}
            className="cursor-pointer rounded-xl border border-line bg-paper px-4 font-display text-sm font-bold text-ink-soft active:scale-[0.98]"
          >
            Decline
          </button>
        </div>
      )}

      {/* Report modal */}
      {s && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          userId={s.other.id}
          firstName={s.other.firstName}
        />
      )}

      {/* Propose Meetup Location & Timing Modal */}
      {s && (
        <Modal open={meetupOpen} onClose={() => setMeetupOpen(false)}>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pine-soft text-pine">
                <IconPin size={17} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink">Propose Campus Meetup</h3>
                <p className="text-[11px] font-semibold text-ink-faint">Meet with {s.other.firstName}</p>
              </div>
            </div>
            <button
              onClick={() => setMeetupOpen(false)}
              className="cursor-pointer rounded-full p-1.5 text-ink-faint hover:bg-line/60"
            >
              <IconX size={17} />
            </button>
          </div>

          <div className="mt-3.5 space-y-3">
            <button disabled={preparing || sending} onClick={shareLocation} className="w-full rounded-xl bg-pine p-3 text-sm text-cream disabled:opacity-50">Share current GPS location</button>
            <label className="block text-xs font-bold">Meetup date and time (your local time)
              <input type="datetime-local" value={meetupTime} onChange={event => setMeetupTime(event.target.value)} className="mt-1 w-full rounded-xl border border-line bg-paper p-3" />
            </label>
            <p className="text-xs leading-relaxed text-ink-soft">
              Choose a trusted public campus meetup spot and preferred timing:
            </p>

            <div className="space-y-1.5">
              {[
                { spot: "Central Lawn Chai Stall", time: "5:00 PM (Evening Tea)", icon: "☕" },
                { spot: "Central Library 3rd Floor Quiet Area", time: "3:30 PM (Study Session)", icon: "📚" },
                { spot: "Uni-Mall Food Court", time: "1:15 PM (Lunch Break)", icon: "🥪" },
                { spot: "Innovation Lab / Block 34 Hub", time: "4:00 PM (Project Work)", icon: "💻" },
                { spot: "Baldev Raj Mittal Sports Complex", time: "6:00 PM (Workout/Sports)", icon: "🏸" },
                { spot: "Shanti Devi Mittal Auditorium Steps", time: "6:30 PM (Fest Meetup)", icon: "🎭" },
              ].map((m) => (
                <button
                  key={m.spot}
                  type="button"
                  disabled={sending}
                  onClick={async () => {
                    if (!meetupTime || new Date(meetupTime).getTime() <= Date.now()) { toast("Choose a future meetup date and time.", "warn"); return; }
                    const proposal = `📍 Campus Meetup Proposal: Let's meet at ${m.spot} at ${new Date(meetupTime).toLocaleString()}! Does that work for you?`;
                    if (await send("text", proposal)) {
                      setMeetupOpen(false);
                      toast("Meetup proposal sent!", "ok");
                    }
                  }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-paper/60 p-2.5 text-left transition-all active:scale-[0.98] hover:border-pine hover:bg-pine-soft/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{m.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-ink">{m.spot}</p>
                      <p className="text-[10px] font-semibold text-pine">{meetupTime ? new Date(meetupTime).toLocaleString() : "Choose your preferred time above"}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-pine px-2 py-1 text-[10px] font-bold text-cream">
                    Propose
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Fullscreen Photo Lightbox */}
      <Lightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

function useMeId() {
  const { me } = useApp();
  return me?.user.id ?? "";
}

function MediaButton({
  locked,
  icon,
  label,
  onClick,
  onLockedClick,
}: {
  locked: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  onLockedClick: () => void;
}) {
  return (
    <button
      onClick={locked ? onLockedClick : onClick}
      title={label}
      className={`relative shrink-0 cursor-pointer rounded-full p-2.5 transition-all ${
        locked
          ? "bg-line/50 text-ink-faint"
          : "bg-pine-soft text-pine shadow-2xs hover:bg-pine-soft/80 active:scale-90"
      }`}
    >
      {icon}
      {locked && (
        <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink-faint text-cream shadow-xs">
          <IconLock size={9} strokeWidth={2.6} />
        </span>
      )}
    </button>
  );
}

/* ---------------------------------- bubble --------------------------------- */

function Bubble({
  m,
  mine,
  onPhotoClick,
}: {
  m: MessageItem;
  mine: boolean;
  onPhotoClick?: (src: string) => void;
}) {
  if (m.kind === "system") {
    return (
      <div className="animate-fade-up flex justify-center py-1">
        <p className="max-w-[85%] rounded-full border border-line bg-cream px-3.5 py-1.5 text-center text-[10px] font-bold text-ink-soft shadow-2xs">
          {m.body}
        </p>
      </div>
    );
  }

  if (m.kind === "image") {
    return (
      <div className={`animate-fade-up flex ${mine ? "justify-end" : "justify-start"}`}>
        <div
          onClick={() => onPhotoClick?.(m.body)}
          className={`cursor-pointer max-w-[72%] overflow-hidden rounded-2xl border shadow-xs transition-transform active:scale-95 ${
            mine ? "rounded-br-sm border-pine/30" : "rounded-bl-sm border-line"
          } bg-cream`}
        >
          <img
            src={m.body}
            alt="Shared photo"
            className="h-38 w-52 object-cover"
            loading="lazy"
          />
          <p className="px-2.5 py-1.5 text-[10px] font-semibold text-ink-faint">
            📷 Photo (tap to view) · {timeAgo(m.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  if (m.kind === "voice") {
    return (
      <div className={`animate-fade-up flex ${mine ? "justify-end" : "justify-start"}`}>
        {(m.body.startsWith("data:audio/") || m.body.startsWith("/api/media/"))
          ? <VoiceNote src={m.body} mine={mine} at={m.createdAt} />
          : <p className="rounded-2xl border border-line bg-cream p-3 text-xs">Legacy demo voice note — no audio was recorded.</p>}

      </div>
    );
  }

  const isMeetupProposal = m.body.includes("Campus Meetup Proposal") || m.body.includes("(Meetup:");

  return (
    <div className={`animate-fade-up flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-2xs ${
          isMeetupProposal
            ? mine
              ? "rounded-br-sm border-2 border-amber bg-pine text-cream ring-2 ring-amber/30"
              : "rounded-bl-sm border-2 border-amber bg-amber-soft/80 text-ink ring-2 ring-amber/20"
            : mine
              ? "rounded-br-sm bg-pine text-cream"
              : "rounded-bl-sm border border-line bg-cream text-ink"
        }`}
      >
        {isMeetupProposal && (
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber">
            <IconCalendarCheck size={13} />
            <span>Campus Meetup Invite</span>
          </div>
        )}
        {m.body.split(/(https:\/\/www\.google\.com\/maps\?q=[-\d.,]+)/g).map((part, index) =>
          part.startsWith("https://www.google.com/maps?q=")
            ? <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline">Open shared location in Maps</a>
            : <span key={index}>{part}</span>
        )}
        <span
          className={`mt-1 block text-right text-[9px] font-semibold ${
            mine ? "text-cream/65" : "text-ink-faint"
          }`}
        >
          {timeAgo(m.createdAt)}
        </span>
      </div>
    </div>
  );
}

function VoiceNote({
  src,
  mine,
  at,
}: {
  src: string;
  mine: boolean;
  at: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [seconds, setSeconds] = useState(0);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 24; i++) {
      arr.push(0.35 + ((((Math.sin(i * 12.9898 + seconds) * 43758.5453) % 1) + 1) % 1) * 0.65);
    }
    return arr;
  }, [seconds]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    try { await audio.play(); setFailed(false); } catch { setFailed(true); }
  };
  const handleBarClick = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = index / bars.length * audio.duration;
    void audio.play().catch(() => setFailed(true));
  };

  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-2xs ${
        mine
          ? "rounded-br-sm bg-pine text-cream"
          : "rounded-bl-sm border border-line bg-cream text-ink"
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" aria-label="Voice message"
        onLoadedMetadata={event => { if (Number.isFinite(event.currentTarget.duration)) setSeconds(Math.round(event.currentTarget.duration)); }}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={event => {
          const audio = event.currentTarget;
          if (Number.isFinite(audio.duration) && audio.duration > 0) { setSeconds(Math.round(audio.duration)); setProgress(audio.currentTime / audio.duration); }
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onError={() => setFailed(true)}
      />
      <button
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        onClick={togglePlay}
        className="cursor-pointer transition-transform active:scale-90"
      >
        {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
      </button>

      <div className="flex h-6 cursor-pointer items-center gap-[2.5px]">
        {bars.map((b, i) => (
          <span
            key={i}
            onClick={() => handleBarClick(i)}
            className={`w-[3px] rounded-full transition-all duration-100 hover:scale-y-125 ${
              i / bars.length <= progress
                ? mine
                  ? "bg-amber"
                  : "bg-pine"
                : mine
                  ? "bg-cream/40"
                  : "bg-line"
            }`}
            style={{ height: `${b * 100}%` }}
          />
        ))}
      </div>

      <span
        className={`font-display text-[10px] font-bold ${
          mine ? "text-cream/75" : "text-ink-faint"
        }`}
      >
        {failed ? "Unable to play" : seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "Voice"} · {timeAgo(at)}
      </span>
    </div>
  );
}

/* -------------------------------- report modal ----------------------------- */

function ReportModal({
  open,
  onClose,
  userId,
  firstName,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  firstName: string;
}) {
  const { toast } = useApp();
  const [category, setCategory] = useState("harassment");
  const [details, setDetails] = useState("");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const evidenceInput = useRef<HTMLInputElement>(null);
  const attach = () => evidenceInput.current?.click();

  const submit = async () => {
    if (!evidence) {
      toast("Attach screenshot evidence — it's mandatory for every report.", "warn");
      return;
    }
    setBusy(true);
    try {
      await api("/api/safety", {
        method: "POST",
        body: JSON.stringify({
          action: "report",
          reportedId: userId,
          category,
          details,
          evidenceUrl: evidence,
        }),
      });
      toast("Report filed. A human moderator will review the attached evidence.", "ok");
      setDetails("");
      setEvidence(null);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not file report.", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <input ref={evidenceInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast("Screenshot must be under 2 MB.", "warn"); return; }
        const reader = new FileReader(); reader.onload = () => setEvidence(String(reader.result));
        reader.onerror = () => toast("Could not read screenshot.", "err"); reader.readAsDataURL(file);
      }} />
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <IconFlag size={16} className="text-clay" /> Report {firstName}
        </h3>
        <button onClick={onClose} className="cursor-pointer text-ink-faint hover:text-ink">
          <IconX size={16} />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["harassment", "Harassment"],
              ["fake_profile", "Fake profile"],
              ["spam", "Spam"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setCategory(v)}
              className={`cursor-pointer rounded-xl border px-2 py-2 text-xs font-bold transition-all ${
                category === v
                  ? "border-clay bg-clay text-cream shadow-xs"
                  : "border-line bg-paper text-ink-soft hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 600))}
          rows={3}
          placeholder="What happened? (context for human moderator review)"
          className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium text-ink outline-none focus:border-clay"
        />

        <button
          onClick={attach}
          className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs font-bold transition-all ${
            evidence ? "border-pine bg-pine-soft text-pine" : "border-line bg-paper text-ink-soft hover:border-ink-faint"
          }`}
        >
          {evidence ? <IconCheck size={14} /> : "📎"}{" "}
          {evidence ? "Screenshot attached" : "Attach screenshot (mandatory)"}
        </button>

        {evidence && (
          <p className="truncate rounded-lg bg-paper px-2 py-1 text-[10px] font-semibold text-ink-faint">
            Screenshot ready to submit
          </p>
        )}

        <p className="text-[10px] leading-relaxed text-ink-faint">
          🛡️ Reports never trigger automatic bans. Coordinated mass reporting cannot weaponize the system.
        </p>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full cursor-pointer rounded-xl bg-clay py-3 font-display text-sm font-bold text-cream shadow-md shadow-clay/25 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Filing…" : "Submit report"}
        </button>
      </div>
    </Modal>
  );
}
