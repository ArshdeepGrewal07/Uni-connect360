"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/client";
import type { MeData } from "@/lib/types";
import { ToastHost, type ToastItem } from "@/components/ui";
import {
  IconAlert,
  IconBuddies,
  IconChat,
  IconHome,
  IconMap,
} from "@/components/icons";
import { Onboarding } from "@/components/Onboarding";
import { LoginPage } from "@/components/LoginPage";
import { HomeView } from "@/components/Home";
import { BuddiesView } from "@/components/Buddies";
import { CampusView } from "@/components/Campus";
import { ChatsView } from "@/components/Chats";
import { ProfileView } from "@/components/Profile";
import { BagelClipDefs } from "@/components/Splash3D";
import { AppModeProvider } from "@/context/AppModeContext";

export type Tab = "home" | "buddies" | "campus" | "chats" | "profile";

interface AppCtx {
  me: MeData | null;
  refreshMe: () => Promise<MeData | null>;
  toast: (message: string, tone?: ToastItem["tone"]) => void;
  tab: Tab;
  go: (tab: Tab, chatId?: string) => void;
  openChat: (sessionId: string) => void;
  chatId: string | null;
  logout: () => void;
}

const Ctx = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(Ctx);

let toastSeq = 1;

export default function Page() {
  const [me, setMe] = useState<MeData | null | undefined>(undefined);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<Tab>("home");
  const [chatId, setChatId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [restrictionDismissed, setRestrictionDismissed] = useState<string | null>(null);
  const prevRestricted = useRef(false);

  const toast = useCallback((message: string, tone: ToastItem["tone"] = "ok") => {
    const id = toastSeq++;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await api<MeData>("/api/me");
      setMe(data);
      return data;
    } catch {
      setMe(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let dispose: void | (() => void);
    const initialSync = setTimeout(() => {
      dispose = (() => {
    refreshMe();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "register") setAuthMode("register");
      else if (mode === "login") setAuthMode("login");
    }
  
      })();
    }, 0);
    return () => { clearTimeout(initialSync); if (dispose) dispose(); };
  }, [refreshMe]);

  // Detect restriction state transitions for toasts.
  useEffect(() => {
    const restricted = me?.user.isRestricted ?? false;
    if (prevRestricted.current && !restricted && me) {
      toast("Restriction lifted — your request was accepted! New chats unlocked.", "ok");
    }
    if (!prevRestricted.current && restricted) {
      setRestrictionDismissed(null);
    }
    prevRestricted.current = restricted;
  }, [me?.user.isRestricted, me, toast]);

  const go = useCallback((t: Tab, chat?: string) => {
    setTab(t);
    setChatId(chat ?? null);
  }, []);

  const openChat = useCallback((sessionId: string) => {
    setTab("chats");
    setChatId(sessionId);
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    setMe(null);
    setTab("home");
    setChatId(null);
    toast("Logged out securely.", "ok");
  }, [toast]);

  const dismissToast = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  // 3D smooth kinetic animation while starting app
  if (me === undefined) {
    return (
      <div className="shell-bg flex min-h-dvh items-center justify-center">
        <div className="animate-pop flex flex-col items-center gap-3 rounded-2xl bg-pine-deep/40 p-6 backdrop-blur-md text-cream/90 shadow-2xl">
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber" />
          </span>
          <p className="font-display text-sm tracking-wide font-bold">Connecting to Quad Campus…</p>
        </div>
      </div>
    );
  }

  if (me === null) {
    return (
      <Ctx.Provider
        value={{ me: null, refreshMe, toast, tab, go, openChat, chatId, logout }}
      >
        <BagelClipDefs />
        <ToastHost toasts={toasts} dismiss={dismissToast} />
        {authMode === "login" ? (
          <LoginPage
            onLoginSuccess={refreshMe}
            toast={toast}
            onSwitchToRegister={() => setAuthMode("register")}
          />
        ) : (
          <Onboarding
            onDone={refreshMe}
            toast={toast}
            onSwitchToLogin={() => setAuthMode("login")}
          />
        )}
      </Ctx.Provider>
    );
  }

  const showRestriction =
    me.user.isRestricted &&
    restrictionDismissed !== (me.restriction?.sessionId ?? "any");

  const badge = me.pendingIn + me.unread;

  return (
    <Ctx.Provider value={{ me, refreshMe, toast, tab, go, openChat, chatId, logout }}>
      <AppModeProvider key={me.user.id}>
        <div className="shell-bg flex min-h-dvh items-center justify-center md:py-6">
          <div className="phone-frame paper-texture relative flex h-dvh w-full flex-col overflow-hidden bg-paper md:h-[min(94dvh,920px)] md:max-w-105 md:rounded-[2rem]">
            <BagelClipDefs />
            <ToastHost toasts={toasts} dismiss={dismissToast} />

            <div className={`relative min-h-0 flex-1 overflow-hidden ${chatId === null ? "pb-[calc(5rem+env(safe-area-inset-bottom))]" : ""}`}>
              <div key={tab} className="h-full w-full">
                {tab === "home" && <HomeView />}
                {tab === "buddies" && <BuddiesView />}
                {tab === "campus" && <CampusView />}
                {tab === "chats" && <ChatsView />}
                {tab === "profile" && <ProfileView />}
              </div>
            </div>

          {chatId === null && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
              <nav className="pointer-events-auto mac-floating-dock flex w-full max-w-sm items-center justify-around rounded-[1.75rem] px-2 py-1.5 shadow-2xl transition-all">
                {(
                  [
                    { key: "home", label: "Home", icon: IconHome },
                    { key: "buddies", label: "Buddies", icon: IconBuddies },
                    { key: "campus", label: "Campus", icon: IconMap },
                    { key: "chats", label: "Chats", icon: IconChat },
                  ] as const
                ).map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => go(key)}
                      aria-label={label}
                      className={`group relative flex min-h-[48px] min-w-[54px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl py-1 tap-spring transition-all duration-300 ${
                        active ? "text-pine font-bold" : "text-ink-faint hover:text-ink-soft"
                      }`}
                    >
                      <span
                        className={`relative flex min-h-[30px] min-w-[50px] items-center justify-center rounded-2xl px-3 py-1 transition-all duration-300 ${
                          active
                            ? "bg-pine/12 scale-110 shadow-xs ring-1 ring-pine/20"
                            : "group-hover:bg-black/5"
                        }`}
                      >
                        <Icon size={21} className={`transition-transform duration-300 ${active ? "scale-105" : ""}`} />
                        {key === "chats" && badge > 0 && (
                          <span className="animate-pulse-dot absolute -top-0.5 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-cream shadow-xs">
                            {badge}
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] tracking-tight transition-all duration-300 ${active ? "font-bold text-pine scale-105" : "font-medium"}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* 48-hour restriction system alert */}
          {showRestriction && (
            <div className="absolute inset-0 z-[70] flex items-end justify-center bg-pine-ink/65 backdrop-blur-[3px] sm:items-center sm:p-5">
              <div className="animate-pop w-full max-w-sm rounded-t-[1.75rem] border border-line bg-cream p-5.5 shadow-2xl sm:rounded-[1.75rem]">
                <div className="flex items-center gap-2.5 text-clay">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-soft text-clay">
                    <IconAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">
                      Chat Request Expired
                    </h3>
                    <p className="text-[11px] font-semibold text-clay">Safe window elapsed</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                  Your chat request to{" "}
                  <strong className="text-ink font-bold">
                    {me.restriction?.otherName ?? "that student"}
                  </strong>{" "}
                  expired after 48 hours without a reply. To prevent unsolicited spam on campus,
                  your account is <strong className="text-clay">temporarily restricted</strong> from
                  starting new chats.
                </p>
                <div className="mt-3 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-soft">
                  💡 Existing conversations remain fully active. If they accept later, your restriction is
                  instantly lifted.
                </div>
                <button
                  onClick={() =>
                    setRestrictionDismissed(me.restriction?.sessionId ?? "any")
                  }
                  className="mt-4 w-full cursor-pointer rounded-xl bg-pine py-3 font-display text-sm font-bold text-cream shadow-md shadow-pine/20 transition-transform active:scale-[0.98]"
                >
                  Understood
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </AppModeProvider>
    </Ctx.Provider>
  );
}
