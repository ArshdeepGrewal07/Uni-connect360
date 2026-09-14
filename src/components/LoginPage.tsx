"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";
import type { MeData } from "@/lib/types";
import { Avatar, Spinner } from "@/components/ui";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconLock,
  IconLogout,
  IconMail,
  IconPhone,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { Cyber3DEyeWidget, BagelClipDefs } from "@/components/Splash3D";

interface DemoUserItem {
  id: string;
  fullName: string;
  course: string;
  academicYear: number;
  avatarHue: number;
  gender?: string;
  lookingFor?: string;
}

export function LoginPage({
  onLoginSuccess,
  toast,
  embedded = false,
  onSwitchToRegister,
}: {
  onLoginSuccess?: () => void;
  toast?: (m: string, tone?: "ok" | "warn" | "err") => void;
  embedded?: boolean;
  onSwitchToRegister?: () => void;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<MeData | null | undefined>(undefined);
  const [loginMethod, setLoginMethod] = useState<"email" | "mobile" | "demo">("email");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [mobilePrefix, setMobilePrefix] = useState("+91");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUserItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if currently authenticated
  useEffect(() => {
    api<MeData>("/api/me")
      .then((data) => setCurrentUser(data))
      .catch(() => setCurrentUser(null));

    api<{ demoUsers: DemoUserItem[] }>("/api/auth")
      .then((res) => setDemoUsers(res.demoUsers ?? []))
      .catch(() => {});
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const showToast = (m: string, tone: "ok" | "warn" | "err" = "ok") => {
    if (toast) toast(m, tone);
  };

  // 1-Tap Quick Demo Login
  const handleDemoLogin = async (userId: string, name: string) => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "demo-login", userId }),
      });
      showToast(`Welcome back, ${name.split(" ")[0]}! 🎓`, "ok");
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        router.push("/");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in with demo account.");
    } finally {
      setBusy(false);
    }
  };

  // Request OTP
  const handleRequestOtp = async (customId?: string) => {
    const rawTarget = (customId ?? identifier).trim();
    if (!rawTarget) {
      setError(
        loginMethod === "email"
          ? "Please enter your university email address."
          : "Please enter your mobile phone number."
      );
      return;
    }

    const fullTarget =
      loginMethod === "mobile" && !rawTarget.startsWith("+")
        ? `${mobilePrefix} ${rawTarget}`
        : rawTarget;

    setBusy(true);
    setError(null);
    try {
      const res = await api<{ sent?: boolean; demoCode?: string; throttled?: boolean }>(
        "/api/auth",
        {
          method: "POST",
          body: JSON.stringify({
            action: "request-otp",
            identifier: fullTarget.toLowerCase(),
            kind: loginMethod,
          }),
        }
      );
      setDemoCode(res.demoCode ?? null);
      setStep("otp");
      setResendCooldown(30);
      showToast(res.demoCode ? "Demo code shown below; no email or SMS was sent." : "Verification code sent.", "ok");
      // Focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not request login code.");
    } finally {
      setBusy(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (overrideOtp?: string) => {
    const codeString = overrideOtp || otp.join("");
    if (codeString.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    const fullTarget =
      loginMethod === "mobile" && !identifier.startsWith("+")
        ? `${mobilePrefix} ${identifier.trim()}`
        : identifier.trim();

    setBusy(true);
    setError(null);
    try {
      const res = await api<{ returning?: boolean; verified?: boolean }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "verify-otp",
          identifier: fullTarget.toLowerCase(),
          otp: codeString,
        }),
      });

      if (res.returning) {
        showToast("Signed in securely! Welcome back to campus 🎓", "ok");
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.push("/");
        }
      } else {
        // Not yet a registered student: prompt to complete registration
        showToast("Code verified! Redirecting to complete your student profile...", "ok");
        if (onSwitchToRegister) {
          onSwitchToRegister();
        } else {
          router.push("/?mode=register");
        }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Incorrect verification code. Please check.");
    } finally {
      setBusy(false);
    }
  };

  // Auto-fill test demo code
  const handleAutoFillOtp = () => {
    if (!demoCode || demoCode.length !== 6) return;
    const digits = demoCode.split("");
    setOtp(digits);
    handleVerifyOtp(demoCode);
  };

  // Handle individual OTP inputs
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    if (digit && index === 5 && nextOtp.every((d) => d !== "")) {
      handleVerifyOtp(nextOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const nextOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) nextOtp[i] = char;
    });
    setOtp(nextOtp);
    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handlePasswordLogin=async()=>{
    setBusy(true);setError(null);
    try{await api('/api/auth',{method:'POST',body:JSON.stringify({action:'password-login',email:identifier,password})});
      setPassword('');if(onLoginSuccess)onLoginSuccess();else router.push('/');
    }catch(e){setError(e instanceof Error?e.message:'Could not sign in.');}finally{setBusy(false);}
  };
  const handleLogout = async () => {
    await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    setCurrentUser(null);
    showToast("Logged out of active student session.", "ok");
  };

  const emailPresets = ["@lpu.in", "@stanford.edu", "@mit.edu", "@iitb.ac.in"];

  return (
    <div className={embedded ? "w-full" : "shell-bg flex min-h-dvh items-center justify-center md:py-8"}>
      <BagelClipDefs />
      <div
        className={`phone-frame paper-texture relative flex w-full flex-col overflow-hidden bg-paper ${
          embedded
            ? "h-full"
            : "h-dvh md:h-[min(94dvh,920px)] md:max-w-105 md:rounded-[2.25rem] shadow-2xl"
        }`}
      >
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between border-b border-line bg-cream/80 px-5 pt-4 pb-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {!embedded ? (
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft transition-transform active:scale-90 hover:bg-cream hover:text-ink"
                title="Back to Quad Campus"
              >
                <IconChevronLeft size={20} />
              </Link>
            ) : (
              step === "otp" && (
                <button
                  onClick={() => {
                    setStep("input");
                    setError(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft transition-transform active:scale-90 hover:bg-cream hover:text-ink"
                  title="Back"
                >
                  <IconChevronLeft size={20} />
                </button>
              )
            )}

            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pine-ink text-cream shadow-md overflow-hidden border border-pine/40">
                <Cyber3DEyeWidget size={48} className="absolute inset-0" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold text-ink leading-tight">Quad ID</span>
                  <span className="rounded-md bg-pine/15 px-1.5 py-0.5 text-[9px] font-black text-pine uppercase">
                    Auth
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-ink-faint tracking-wide uppercase">
                  Verified Student Gateway
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[10px] font-bold text-ink-soft">Campus Online</span>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pt-5 pb-8">
          {/* Case: Already Authenticated */}
          {currentUser && (
            <div className="animate-fade-up mb-5 rounded-2xl border border-pine/30 bg-pine-soft/40 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar
                  name={currentUser.user.fullName}
                  hue={currentUser.user.avatarHue}
                  size={46}
                  status="online"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {currentUser.user.fullName}
                    </p>
                    <span className="rounded-full bg-pine px-2 py-0.5 text-[9px] font-bold text-cream">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {currentUser.user.course} · Year {currentUser.user.academicYear}
                  </p>
                  <p className="text-[10px] text-ink-faint">{currentUser.user.email}</p>
                </div>
              </div>

              <div className="mt-3.5 flex gap-2">
                <Link
                  href="/"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-pine py-2.5 text-xs font-bold text-cream shadow-md transition-transform active:scale-95"
                >
                  Enter Campus Dashboard <IconChevronRight size={15} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1 rounded-xl border border-line bg-cream px-3 py-2.5 text-xs font-bold text-clay transition-all hover:bg-paper active:scale-95"
                  title="Sign out of this student session"
                >
                  <IconLogout size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Headline & Welcoming Subtext */}
          <div className="mt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Student Sign-In
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Access your campus community, verified peer radar, real-time IoT facilities, and 48-hour safe chats.
            </p>
          </div>

          {/* Login Method Segmented Control */}
          <div className="mt-4 flex rounded-2xl border border-line bg-cream p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("email");
                setError(null);
                setStep("input");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                loginMethod === "email"
                  ? "bg-pine text-cream shadow-sm"
                  : "text-ink-soft hover:text-ink hover:bg-paper"
              }`}
            >
              <IconMail size={15} />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("mobile");
                setError(null);
                setStep("input");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                loginMethod === "mobile"
                  ? "bg-pine text-cream shadow-sm"
                  : "text-ink-soft hover:text-ink hover:bg-paper"
              }`}
            >
              <IconPhone size={15} />
              <span>Mobile Phone</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("demo");
                setError(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                loginMethod === "demo"
                  ? "bg-pine text-cream shadow-sm"
                  : "text-ink-soft hover:text-ink hover:bg-paper"
              }`}
            >
              <IconSparkles size={15} />
              <span>1-Tap Demo</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="animate-pop mt-3.5 flex items-start gap-2.5 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">
              <span className="font-bold">⚠️</span>
              <p className="flex-1 font-medium">{error}</p>
            </div>
          )}

          {/* METHOD: DEMO 1-TAP LOGIN */}
          {loginMethod === "demo" && (
            <div className="animate-fade-up mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-ink uppercase tracking-wider">
                  Select Active Student Profile
                </p>
                <span className="text-[10px] text-ink-faint">Instant testing bypass</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Tap any sample student account to immediately log in and explore their chats, schedules, and bookmarks.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2.5">
                {demoUsers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDemoLogin(d.id, d.fullName)}
                    disabled={busy}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-cream p-3 shadow-xs transition-all hover:border-pine hover:bg-paper active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={d.fullName} hue={d.avatarHue} size={42} status="online" />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-display text-sm font-bold text-ink group-hover:text-pine">
                            {d.fullName}
                          </p>
                          <span className="rounded-full bg-pine-soft px-1.5 py-0.2 text-[9px] font-bold text-pine">
                            Year {d.academicYear}
                          </span>
                        </div>
                        <p className="truncate text-xs text-ink-soft">{d.course}</p>
                        {d.lookingFor && (
                          <p className="truncate text-[10px] text-ink-faint italic">
                            &quot;{d.lookingFor}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pine-soft text-pine transition-colors group-hover:bg-pine group-hover:text-cream">
                      <IconChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* METHOD: EMAIL OR MOBILE - STEP 1 (INPUT) */}
          {loginMethod !== "demo" && step === "input" && (
            <div className="animate-fade-up mt-4">
              {loginMethod === "email" ? (
                <div>
                  <label className="block text-xs font-bold text-ink">
                    Email address
                  </label>
                  <p className="mt-0.5 text-[11px] text-ink-faint">Use the email you entered when creating your account.</p>
                  <div className="mt-2 flex items-center rounded-2xl border border-line bg-cream px-3.5 py-2.5 shadow-2xs focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/20">
                    <span className="text-ink-faint mr-2.5">
                      <IconMail size={18} />
                    </span>
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (loginMethod === "email" && usePassword ? handlePasswordLogin() : handleRequestOtp())}
                      placeholder="you@example.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-faint/60 focus:outline-hidden"
                    />
                  </div>

                  {/* University domain suggestions */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-ink-faint uppercase">Domain presets:</span>
                    {emailPresets.map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => {
                          const prefix = identifier.split("@")[0] || "student";
                          setIdentifier(`${prefix}${domain}`);
                          setError(null);
                        }}
                        className="rounded-lg border border-line bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-soft hover:border-pine hover:text-pine active:scale-95"
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-ink">
                    Registered Mobile Number
                  </label>
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    SMS OTP will be sent to verify your student account
                  </p>
                  <div className="mt-2 flex items-center rounded-2xl border border-line bg-cream px-3.5 py-2.5 shadow-2xs focus-within:border-pine focus-within:ring-2 focus-within:ring-pine/20">
                    <select
                      value={mobilePrefix}
                      onChange={(e) => setMobilePrefix(e.target.value)}
                      className="bg-transparent text-xs font-bold text-ink focus:outline-hidden pr-2 mr-2 border-r border-line"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                    <span className="text-ink-faint mr-2">
                      <IconPhone size={17} />
                    </span>
                    <input
                      type="tel"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                      placeholder="98765 43210"
                      className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-faint/60 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {loginMethod === 'email' && <div className="mt-3">
                {usePassword && <label className="block text-xs font-bold text-ink">Password
                  <input aria-label="Password" type="password" autoComplete="current-password" value={password} maxLength={128} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePasswordLogin()} className="mt-2 w-full rounded-2xl border border-line bg-cream px-3.5 py-3 text-sm" />
                </label>}
                <button type="button" onClick={()=>{setUsePassword(!usePassword);setError(null);}} className="mt-2 text-xs font-bold text-pine">{usePassword?'Use a verification code instead':'Use email and password'}</button>
              </div>}
              {/* Submit CTA */}
              <button
                type="button"
                onClick={() => loginMethod === "email" && usePassword ? handlePasswordLogin() : handleRequestOtp()}
                disabled={busy}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-pine py-3.5 font-display text-sm font-bold text-cream shadow-lg shadow-pine/25 transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Spinner size={18} className="border-cream border-t-transparent" />
                    <span>Please wait…</span>
                  </>
                ) : (
                  <>
                    <span>{loginMethod === "email" && usePassword ? "Sign in with password" : "Send 6-Digit Login Code"}</span>
                    <IconChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* METHOD: EMAIL OR MOBILE - STEP 2 (OTP VERIFICATION) */}
          {loginMethod !== "demo" && step === "otp" && (
            <div className="animate-fade-up mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-ink">Enter Verification Code</p>
                  <p className="text-[11px] text-ink-soft">
                    Sent to: <span className="font-semibold text-ink">{identifier}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setError(null);
                  }}
                  className="text-[11px] font-bold text-pine hover:underline"
                >
                  Change
                </button>
              </div>

              {/* 6-Digit Segmented Boxes */}
              <div className="mt-4 flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`h-13 w-11 rounded-xl border text-center font-display text-xl font-black transition-all ${
                      digit
                        ? "border-pine bg-cream text-pine shadow-sm"
                        : "border-line bg-paper text-ink focus:border-pine focus:ring-2 focus:ring-pine/20"
                    }`}
                  />
                ))}
              </div>

              {/* Dispatched Test Code Auto-fill Banner */}
              {demoCode && (
                <div className="mt-3.5 flex items-center justify-between rounded-xl border border-amber/40 bg-amber/15 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-900">⚡ Test Code:</span>
                    <span className="font-mono font-black text-amber-900 tracking-wider">
                      {demoCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillOtp}
                    className="cursor-pointer rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-cream shadow-xs transition-transform active:scale-95 hover:bg-amber-700"
                  >
                    Auto-Fill & Sign In
                  </button>
                </div>
              )}

              {/* Verify CTA */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={busy}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-pine py-3.5 font-display text-sm font-bold text-cream shadow-lg shadow-pine/25 transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Spinner size={18} className="border-cream border-t-transparent" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  <>
                    <IconCheck size={18} />
                    <span>Verify & Enter Quad 🎓</span>
                  </>
                )}
              </button>

              {/* Resend Countdown */}
              <div className="mt-3 text-center">
                {resendCooldown > 0 ? (
                  <p className="text-[11px] text-ink-faint">
                    Resend code available in <span className="font-bold text-ink">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => loginMethod === "email" && usePassword ? handlePasswordLogin() : handleRequestOtp()}
                    className="cursor-pointer text-[11px] font-bold text-pine hover:underline"
                  >
                    Didn&apos;t receive code? Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Switch to Registration link */}
          <div className="mt-6 border-t border-line pt-4 text-center">
            <p className="text-xs text-ink-soft">
              New to Quad?{" "}
              {onSwitchToRegister ? (
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-bold text-pine hover:underline cursor-pointer"
                >
                  Create Student Account
                </button>
              ) : (
                <a href="/?mode=register" className="font-bold text-pine hover:underline">
                  Create Student Account
                </a>
              )}
            </p>
          </div>

          {/* Security & Campus Trust Guarantees */}
          <div className="mt-5 rounded-2xl border border-line bg-cream/70 p-3.5">
            <div className="flex items-center gap-2 text-ink-faint">
              <IconShield size={16} className="text-pine" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink">
                Campus Security Escrow
              </span>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px] text-ink-soft">
              <div className="flex items-center gap-2">
                <span className="text-pine">✓</span>
                <span>Sample accounts are available for demonstration</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pine">✓</span>
                <span>HttpOnly session cookies and hashed passwords</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pine">✓</span>
                <span>Automatic 48-hour ephemeral chat timers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
