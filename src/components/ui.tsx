"use client";

import { type ReactNode, useEffect, useState, useRef } from "react";
import {createPortal} from "react-dom";
import {
  IconAlert,
  IconCheck,
  IconLock,
  IconPhone,
  IconSend,
  IconSiren,
  IconStar,
  IconX,
} from "@/components/icons";

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  hue,
  size = 40,
  ring = false,
  status,
  className = "",
}: {
  name: string;
  hue: number;
  size?: number;
  ring?: boolean;
  status?: "online" | "away" | "offline";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-cream select-none shadow-sm transition-transform duration-200 ${
          ring ? "ring-2 ring-cream shadow-sm" : ""
        }`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.36,
          background: `linear-gradient(135deg, hsl(${hue} 48% 42%), hsl(${(hue + 28) % 360} 54% 28%))`,
        }}
      >
        {initials}
      </div>
      {status === "online" && (
        <span
          className="absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-cream bg-emerald-500"
          style={{ width: Math.max(8, size * 0.26), height: Math.max(8, size * 0.26) }}
        />
      )}
    </div>
  );
}

/* ---------------------------------- Chip ---------------------------------- */

export function Chip({
  children,
  active = false,
  onClick,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
        active
          ? "border-pine bg-pine text-cream shadow-sm"
          : "border-line bg-cream text-ink-soft hover:border-ink-faint hover:text-ink"
      } ${onClick ? "cursor-pointer active:scale-95" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------- Toggle --------------------------------- */

export function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6.5 w-11.5 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-pine" : "bg-line"
      } ${disabled ? "opacity-50" : "cursor-pointer"}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5.5 w-5.5 rounded-full bg-cream shadow-md transition-all duration-200 ${
          checked ? "left-5.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

/* --------------------------------- Segmented ------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl border border-line bg-paper p-1">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 font-display text-sm font-bold transition-all duration-200 ${
              selected
                ? "bg-pine text-cream shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({open,onClose,children,dismissible=true}:{open:boolean;onClose?:()=>void;children:ReactNode;dismissible?:boolean}){
 const dialog=useRef<HTMLDivElement>(null);
 const closeRef=useRef(onClose);
 useEffect(()=>{closeRef.current=onClose;},[onClose]);
 useEffect(()=>{
  if(!open)return;const previous=document.activeElement as HTMLElement|null;
  dialog.current?.focus();
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape'&&dismissible){e.preventDefault();closeRef.current?.();}
   if(e.key==='Tab'){
    const list=[...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')??[])].filter(el=>el.getClientRects().length>0);
    const first=list[0],last=list[list.length-1];if(!first){e.preventDefault();return;}
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){e.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);if(previous?.isConnected)previous.focus();};
 },[open,dismissible]);
 if(!open||typeof document==='undefined')return null;
 return createPortal(<div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/45 sm:items-center sm:p-5" onClick={dismissible?onClose:undefined}>
  <div ref={dialog} role="dialog" aria-modal="true" aria-label="Campus dialog" tabIndex={-1} className="relative max-h-[92dvh] w-full max-w-105 overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={e=>e.stopPropagation()}>
   {children}
  </div>
 </div>,document.body);
}

/* ---------------------------------- Stars --------------------------------- */

export function Stars({
  value,
  size = 13,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= Math.round(value) ? "text-amber" : "text-line"}
        >
          <IconStar size={size} filled={i <= Math.round(value)} />
        </span>
      ))}
    </span>
  );
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-paper/60 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-soft text-pine shadow-sm">
        {icon}
      </div>
      <p className="font-display text-sm font-bold text-ink">{title}</p>
      <p className="max-w-[28ch] text-xs leading-relaxed text-ink-soft">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* --------------------------------- Spinner --------------------------------- */

export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------- Status badge ------------------------------ */

export function OpenBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
        open ? "bg-pine-soft text-pine" : "bg-clay-soft text-clay"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${open ? "animate-pulse-dot bg-pine" : "bg-clay"}`}
      />
      {open ? "Open" : "Closed"}
    </span>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer-box rounded-xl ${className}`} />;
}

/* --------------------------------- Lightbox -------------------------------- */

export function Lightbox({
  src,
  alt = "Image preview",
  onClose,
}: {
  src: string | null;
  onClose: () => void;
  alt?: string;
}) {
  if (!src) return null;
  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-cream transition-transform active:scale-90 hover:bg-white/30"
      >
        <IconX size={20} />
      </button>
      <img
        src={src}
        alt={alt}
        className="animate-pop max-h-[85%] max-w-full rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-3 text-xs font-semibold text-cream/70">Tap anywhere to close</p>
    </div>
  );
}

/* ------------------------- Send Request Custom Modal ----------------------- */

export function SendRequestModal({
  open,
  onClose,
  recipient,
  onSend,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    firstName: string;
    course: string;
    avatarHue: number;
    lookingFor?: string | null;
  } | null;
  onSend: (message: string) => Promise<void>;
  busy?: boolean;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let dispose: void | (() => void);
    const initialSync = setTimeout(() => {
      dispose = (() => {
    if (recipient) {
      setMessage(
        recipient.lookingFor
          ? `Hey! Saw you're looking for: ${recipient.lookingFor}. Want to team up?`
          : "Hey! Want to team up and connect?"
      );
    }
  
      })();
    }, 0);
    return () => { clearTimeout(initialSync); if (dispose) dispose(); };
  }, [recipient]);

  if (!open || !recipient) return null;

  const presets = [
    "Hey! Want to team up?",
    "Saw we have similar classes — let's exchange notes!",
    "Are you free after classes this week?",
  ];

  const handleSend = async () => {
    if (!message.trim()) return;
    await onSend(message.trim());
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={recipient.firstName} hue={recipient.avatarHue} size={38} />
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Request {recipient.firstName}
            </h3>
            <p className="text-[11px] font-semibold text-ink-faint">{recipient.course}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer rounded-full p-1.5 text-ink-faint hover:bg-line/60"
        >
          <IconX size={17} />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-xl border border-amber/30 bg-amber-soft px-3 py-2 text-[11px] font-medium leading-relaxed text-[#7a5210]">
          🔒 <strong>48-hour safe window:</strong> Media & voice notes stay locked until{" "}
          {recipient.firstName} accepts your request.
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold tracking-wide text-ink-faint uppercase">
            Your introductory message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 400))}
            rows={3}
            placeholder="Introduce yourself or propose a meetup..."
            className="w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-pine"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-ink-faint">
            <span>Keep it friendly & campus-relevant</span>
            <span>{message.length}/400</span>
          </div>
        </div>

        {/* Meetup Spot & Timing Quick Proposer */}
        <div>
          <p className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wide text-ink-faint uppercase">
            <span>📍 Propose Meetup Spot & Time</span>
            <span className="text-pine font-extrabold">Tap to append</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "☕ Central Lawn Chai at 5 PM",
              "📚 Central Library 3rd Floor",
              "🥪 Uni-Mall Canteen after class",
              "🏸 Sports Complex at 6 PM",
              "💻 Innovation Lab / Block 34",
            ].map((spot) => (
              <button
                key={spot}
                type="button"
                onClick={() => {
                  setMessage((prev) => {
                    const cleaned = prev.replace(/\s*\(Meetup:.*?\)/g, "");
                    return `${cleaned.trim()} (Meetup: ${spot})`;
                  });
                }}
                className="cursor-pointer rounded-lg border border-pine/30 bg-pine-soft px-2.5 py-1 text-[10px] font-bold text-pine transition-all active:scale-95 hover:bg-pine hover:text-cream"
              >
                {spot}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold tracking-wide text-ink-faint uppercase">
            Quick starters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMessage(p)}
                className="cursor-pointer rounded-lg border border-line bg-paper px-2.5 py-1 text-[10px] font-semibold text-ink-soft transition-colors hover:border-pine hover:text-pine"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-line bg-paper py-2.5 font-display text-sm font-bold text-ink-soft transition-transform active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !message.trim()}
            onClick={handleSend}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-pine py-2.5 font-display text-sm font-bold text-cream shadow-md shadow-pine/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            {busy ? <Spinner size={15} /> : <IconSend size={15} />}
            Send request
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------- Campus SOS Emergency Hub ---------------------- */

export function CampusSosModal({
  open,
  onClose,
  toast,
}: {
  open: boolean;
  onClose: () => void;
  toast: (m: string, tone?: "ok" | "warn" | "err") => void;
}) {
  const [calling, setCalling] = useState<string | null>(null);

  const HELPLINES = [
    { name: "Campus Security Control", number: "+91 1824-517000", desc: "Main Gate & Patrol Units", tone: "bg-clay text-cream" },
    { name: "University Medical Center", number: "+91 1824-517001", desc: "24x7 Ambulance & First Aid", tone: "bg-amber text-cream" },
    { name: "Women's Safety Helpline", number: "+91 1824-517002", desc: "Confidential immediate response", tone: "bg-pine text-cream" },
    { name: "Anti-Ragging / Proctor", number: "+91 1824-517003", desc: "Disciplinary & Grievance officer", tone: "bg-pine-deep text-cream" },
  ];

  const handleCall = (h: typeof HELPLINES[0]) => {
    setCalling(h.name);
    setTimeout(() => {
      toast(`Emergency dispatched to ${h.name} (${h.number})`, "err");
      setCalling(null);
    }, 1200);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2 text-clay">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-soft text-clay">
            <IconSiren size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Campus Emergency Hub</h3>
            <p className="text-[10px] font-semibold text-clay">Instant 24x7 Helpline & Security</p>
          </div>
        </div>
        <button onClick={onClose} className="cursor-pointer rounded-full p-1.5 text-ink-faint hover:bg-line/60">
          <IconX size={17} />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        <p className="text-xs leading-relaxed text-ink-soft">
          Tap any button to connect directly with on-campus security and medical staff. Your active location is automatically tagged with security.
        </p>

        <div className="space-y-2">
          {HELPLINES.map((h) => (
            <div
              key={h.name}
              className="flex items-center justify-between rounded-xl border border-line bg-paper p-3 transition-colors hover:border-clay/40"
            >
              <div>
                <p className="text-xs font-bold text-ink">{h.name}</p>
                <p className="text-[10px] font-semibold text-ink-faint">{h.desc}</p>
                <p className="mt-0.5 font-display text-[11px] font-bold text-pine">{h.number}</p>
              </div>
              <button
                onClick={() => handleCall(h)}
                disabled={calling !== null}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-clay px-3.5 py-2 text-xs font-bold text-cream shadow-sm transition-transform active:scale-95 disabled:opacity-60"
              >
                {calling === h.name ? (
                  <Spinner size={13} />
                ) : (
                  <>
                    <IconPhone size={13} /> Call Now
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-cream p-3 text-center">
          <p className="text-[11px] font-semibold text-ink-soft">
            Nearest Campus Guard Booth: <strong>Block 34 Security Desk (85m away)</strong>
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------------- Toasts --------------------------------- */

export interface ToastItem {
  id: number;
  message: string;
  tone: "ok" | "warn" | "err";
}

export function ToastHost({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[85] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md ${
            t.tone === "err"
              ? "border-clay/40 bg-clay text-cream"
              : t.tone === "warn"
                ? "border-amber/50 bg-amber-soft text-[#7a5210]"
                : "border-pine/35 bg-pine text-cream"
          }`}
        >
          <span className="shrink-0">
            {t.tone === "err" ? (
              <IconAlert size={17} />
            ) : t.tone === "warn" ? (
              <span className="text-amber">⚠️</span>
            ) : (
              <IconCheck size={17} />
            )}
          </span>
          <span className="flex-1 text-xs leading-snug">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="cursor-pointer rounded-full p-1 opacity-75 transition-opacity hover:opacity-100"
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
