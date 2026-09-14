export class ApiError extends Error {
  code: string;
  status: number;
  extra: Record<string, unknown>;
  constructor(message: string, code: string, status: number, extra: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

export async function api<T = Record<string, unknown>>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok || data.ok === false) {
    const { code = "error", message = "Something went wrong", ...extra } = data;
    throw new ApiError(String(message), String(code), res.status, extra);
  }
  return data as T;
}

/** Format remaining ms as H:MM:SS (matches the 47:15:22 wireframe). */
export function fmtCountdown(msLeft: number): string {
  if (msLeft <= 0) return "0:00:00";
  const s = Math.floor(msLeft / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function fmtEventDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const dayDiff = Math.round(
    (new Date(d.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 86_400_000
  );
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
}

export function yearSuffix(year: number): string {
  return year === 1 ? "1st" : year === 2 ? "2nd" : year === 3 ? "3rd" : `${year}th`;
}

export const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  non_binary: "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};

export const CATEGORY_LABEL: Record<string, string> = {
  harassment: "Harassment",
  fake_profile: "Fake profile",
  spam: "Spam",
};
