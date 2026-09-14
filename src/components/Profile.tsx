"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/app/page";
import { api, CATEGORY_LABEL, GENDER_LABEL, timeAgo, yearSuffix } from "@/lib/client";
import type { SafetyData } from "@/lib/types";
import { Avatar, Modal, Toggle } from "@/components/ui";
import {
  IconCheck,
  IconEye,
  IconEyeOff,
  IconId,
  IconLock,
  IconLogout,
  IconMail,
  IconPhone,
  IconShield,
  IconAlert,
  IconSparkles,
} from "@/components/icons";
import { Cyber3DEyeWidget } from "@/components/Splash3D";

interface DemoUserItem {
  id: string;
  fullName: string;
  course: string;
  academicYear: number;
  avatarHue: number;
}

import {PasswordSettings} from "@/components/PasswordSettings";

export function ProfileView() {
  const { me, refreshMe, toast, logout } = useApp();
  const [safety, setSafety] = useState<SafetyData | null>(null);
  const [visible, setVisible] = useState(me?.user.visible ?? true);
  const [looking, setLooking] = useState(me?.user.lookingFor ?? "");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [genderNote, setGenderNote] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUserItem[]>([]);
  const [switching, setSwitching] = useState(false);

  const loadSafety = useCallback(() => {
    api<SafetyData>("/api/safety").then(setSafety).catch(() => setSafety(null));
  }, []);

  useEffect(() => {
    loadSafety();
    api<{ demoUsers: DemoUserItem[] }>("/api/auth")
      .then((res) => setDemoUsers(res.demoUsers ?? []))
      .catch(() => {});
  }, [loadSafety]);

  if (!me) return null;
  const user = me.user;

  const saveVisible = async (v: boolean) => {
    setVisible(v);
    try {
      await api("/api/me", { method: "PUT", body: JSON.stringify({ visible: v }) });
      toast(v ? "You're visible in Buddy Finder." : "Hidden from Buddy Finder.", "ok");
    } catch {
      setVisible(!v);
      toast("Could not save setting.", "err");
    }
  };

  const saveLooking = async () => {
    try {
      await api("/api/me", { method: "PUT", body: JSON.stringify({ lookingFor: looking }) });
      await refreshMe();
      toast("Buddy card updated.", "ok");
    } catch {
      toast("Could not save.", "err");
    }
  };

  const switchAccount = async (userId: string, name: string) => {
    setSwitching(true);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "demo-login", userId }),
      });
      toast(`Switched profile to ${name} 🎓`, "ok");
      await refreshMe();
    } catch {
      toast("Failed to switch profile.", "err");
    } finally {
      setSwitching(false);
    }
  };

  const unblock = async (id: string) => {
    try {
      await api(`/api/safety?unblock=${id}`, { method: "DELETE" });
      toast("User unblocked.", "ok");
      loadSafety();
    } catch {
      toast("Could not unblock.", "err");
    }
  };

  const statusChip = (s: string) =>
    s === "open"
      ? "bg-amber-soft text-[#8a5c12]"
      : s === "reviewed"
        ? "bg-line/70 text-ink-soft"
        : "bg-clay-soft text-clay";

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-lg font-bold text-ink">My Profile</h1>
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-cream px-3 py-1.5 text-xs font-bold text-ink-soft shadow-2xs transition-transform active:scale-95 hover:border-ink-faint hover:text-ink"
        >
          <IconLogout size={13} /> Log out
        </button>
      </header>

      <div className="space-y-4 px-4 py-4 pb-10">
        {/* account status with 3D Cyber Eye verified emblem */}
        <section
          className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xs ${
            user.isRestricted ? "border-clay/30 bg-clay-soft" : "border-pine/25 bg-pine-soft"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                {user.isRestricted ? (
                  <>
                    <IconAlert size={16} className="text-clay" />
                    <span className="text-clay">Restricted — new chat requests paused</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pine" />
                    </span>
                    Verified Student Standing
                  </>
                )}
              </p>
              <p
                className={`mt-1 text-xs leading-relaxed ${
                  user.isRestricted ? "text-clay/90" : "text-ink-soft"
                }`}
              >
                {user.isRestricted
                  ? `A request to ${me.restriction?.otherName ?? "a student"} expired after 48 hours without a reply. If they accept later, your restriction lifts automatically.`
                  : "All 48-hour chat timers healthy. Your institutional status is officially verified."}
              </p>
            </div>
            {/* 3D Cyber Gyroscope Eye verification badge */}
            <div className="shrink-0 flex items-center justify-center -my-2 -mr-1">
              <Cyber3DEyeWidget size={62} />
            </div>
          </div>
        </section>

        <PasswordSettings />
        {/* public view card */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-ink-faint uppercase">
            <IconEye size={12} /> Public Card — how classmates see you
          </h3>
          <div className="rounded-2xl border border-line bg-cream p-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <Avatar name={user.fullName} hue={user.avatarHue} size={54} status="online" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-ink">{user.fullName}</p>
                <p className="text-xs font-semibold text-ink-faint">
                  {user.course} · {yearSuffix(user.academicYear)} year · {GENDER_LABEL[user.gender]}
                  <button
                    onClick={() => setGenderNote(true)}
                    className="ml-1.5 cursor-pointer align-middle text-ink-faint hover:text-clay"
                    title="Gender is locked for safety"
                  >
                    <IconLock size={11} />
                  </button>
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-pine-soft px-2 py-0.5 text-[10px] font-bold text-pine">
                  <IconCheck size={11} /> Institutional ID Verified
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.interests.map((i) => (
                <span
                  key={i}
                  className="rounded-lg bg-paper px-2.5 py-1 text-[11px] font-bold text-ink-soft"
                >
                  {i}
                </span>
              ))}
            </div>

            <label className="mt-3 block">
              <span className="text-[10px] font-bold tracking-wide text-ink-faint uppercase">
                Looking for
              </span>
              <div className="mt-1 flex gap-2">
                <input
                  value={looking}
                  onChange={(e) => setLooking(e.target.value.slice(0, 60))}
                  placeholder="e.g. Gym partner for morning sessions"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-pine"
                />
                <button
                  onClick={saveLooking}
                  className="shrink-0 cursor-pointer rounded-xl bg-pine px-3.5 text-cream transition-transform active:scale-90"
                  title="Save bio"
                >
                  <IconCheck size={16} />
                </button>
              </div>
            </label>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                {visible ? (
                  <IconEye size={16} className="text-pine" />
                ) : (
                  <IconEyeOff size={16} className="text-ink-faint" />
                )}
                <div>
                  <p className="text-xs font-bold text-ink">Visible in Buddy Finder</p>
                  <p className="text-[10px] text-ink-faint">Off hides your card from classmates.</p>
                </div>
              </div>
              <Toggle checked={visible} onChange={saveVisible} />
            </div>
          </div>
        </section>

        {/* Quick Demo Switcher */}
        {demoUsers.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-pine uppercase">
              <IconSparkles size={13} /> Switch Account (Demo Preview)
            </h3>
            <div className="rounded-2xl border border-pine/30 bg-pine-soft p-3.5 shadow-2xs">
              <p className="text-[11px] font-medium text-ink-soft">
                Switch identity instantly to test both sender and receiver perspectives:
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {demoUsers
                  .filter((d) => d.id !== user.id)
                  .slice(0, 4)
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => switchAccount(d.id, d.fullName)}
                      disabled={switching}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-cream p-2 text-left shadow-2xs transition-all active:scale-95 hover:border-pine"
                    >
                      <Avatar name={d.fullName} hue={d.avatarHue} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-ink">{d.fullName.split(" ")[0]}</p>
                        <p className="truncate text-[10px] text-ink-faint">{d.course}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* private data */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-ink-faint uppercase">
            <IconLock size={12} /> Confidential Data (Hidden from classmates)
          </h3>
          <div className="divide-y divide-line rounded-2xl border border-line bg-cream shadow-2xs">
            {[
              { icon: <IconMail size={16} />, label: "Institutional Email", value: user.email },
              { icon: <IconPhone size={16} />, label: "Mobile Number", value: user.mobile || "Not provided" },
              { icon: <IconId size={16} />, label: "Registration ID", value: user.regId },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                <span className="text-ink-faint">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-wide text-ink-faint uppercase">{r.label}</p>
                  <p className="truncate text-xs font-semibold text-ink">{r.value}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[9px] font-bold text-ink-faint">
                  <IconLock size={9} /> Private
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* safety center */}
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-ink-faint uppercase">
            <IconShield size={12} /> Safety & Moderation
          </h3>

          <div className="space-y-2.5">
            <div className="rounded-2xl border border-line bg-cream p-4 shadow-2xs">
              <p className="text-sm font-bold text-ink">My reports</p>
              {safety === null ? (
                <p className="mt-2 text-xs text-ink-faint">Loading…</p>
              ) : safety.reports.length === 0 ? (
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  No reports filed. Reports go to human campus admin review — mass reporting
                  cannot trigger automatic bans.
                </p>
              ) : (
                <div className="mt-2.5 space-y-2">
                  {safety.reports.map((r, i) => (
                    <div key={r.id} className="rounded-xl border border-line bg-paper px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-ink">
                          Report #{safety.reports.length - i} · {CATEGORY_LABEL[r.category] ?? r.category} vs {r.reportedFirstName}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusChip(
                            r.status
                          )}`}
                        >
                          {r.status === "open"
                            ? "Open"
                            : r.status === "reviewed"
                              ? "Reviewed"
                              : "Action taken"}
                        </span>
                      </div>
                      {r.details && <p className="mt-1 text-[11px] text-ink-soft">{r.details}</p>}
                      <p className="mt-1 truncate text-[9px] font-semibold text-ink-faint">
                        Evidence attached · {timeAgo(r.createdAt)} ago
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-line bg-cream p-4 shadow-2xs">
              <p className="text-sm font-bold text-ink">Blocked students</p>
              {safety && safety.blocked.length > 0 ? (
                <div className="mt-2.5 space-y-2">
                  {safety.blocked.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2"
                    >
                      <Avatar name={b.firstName} hue={b.avatarHue} size={28} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-ink">{b.firstName}</p>
                        <p className="text-[10px] text-ink-faint">{b.course}</p>
                      </div>
                      <button
                        onClick={() => unblock(b.id)}
                        className="cursor-pointer rounded-lg border border-line px-2.5 py-1 text-[10px] font-bold text-ink-soft transition-transform active:scale-95"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  Nobody blocked. Blocking hides profiles both ways and stops all future outreach.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* gender privacy modal */}
      <Modal open={genderNote} onClose={() => setGenderNote(false)}>
        <button className="mb-3 rounded-xl bg-pine px-4 py-2 text-sm text-cream" onClick={async () => {
          try { await api("/api/me", { method: "PUT", body: JSON.stringify({ gender: "prefer_not_to_say" }) }); await refreshMe(); setGenderNote(false); toast("Gender hidden: Prefer not to say.", "ok"); }
          catch (e) { toast(e instanceof Error ? e.message : "Could not save preference.", "err"); }
        }}>Prefer not to say — hide my gender</button>
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <IconLock size={16} className="text-clay" /> Gender is locked for safety
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          You can hide your gender below. Other changes require identity review. Gender cannot be modified in-app
          after onboarding. Contact the university admin office with ID card proof for changes.
        </p>
        <button
          onClick={() => setGenderNote(false)}
          className="mt-4 w-full cursor-pointer rounded-xl bg-pine py-2.5 font-display text-sm font-bold text-cream shadow-sm"
        >
          Understood
        </button>
      </Modal>

      {/* logout confirm */}
      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <h3 className="font-display text-base font-bold text-ink">Log out of Quad?</h3>
        <p className="mt-1.5 text-xs text-ink-soft">
          Your verified account and chat sessions are preserved for your next visit.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setConfirmLogout(false)}
            className="cursor-pointer rounded-xl border border-line bg-paper py-2.5 font-display text-sm font-bold text-ink-soft"
          >
            Cancel
          </button>
          <button
            onClick={logout}
            className="cursor-pointer rounded-xl bg-clay py-2.5 font-display text-sm font-bold text-cream shadow-sm"
          >
            Log out
          </button>
        </div>
      </Modal>
    </div>
  );
}
