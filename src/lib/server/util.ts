import { NextResponse } from "next/server";

export function err(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { ok: false, code, message, ...extra },
    { status }
  );
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic 15-minute presence windows. In production this maps to
 * Redis ZSET ZCOUNT over the last 900 seconds; here the same rolling-window
 * behaviour is derived from the current time bucket so the counter is stable
 * within a window and shifts between windows.
 */
export function pulseCount(seedKey: string, base: number, spread: number) {
  const bucket = Math.floor(Date.now() / 900_000);
  const h = hash(`${seedKey}:${bucket}`);
  return base + (h % spread);
}

export async function readBody(req: Request) {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
