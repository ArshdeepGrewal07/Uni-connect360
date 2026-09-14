import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
const shared = globalThis as typeof globalThis & { __quadOtpSecret?: string };
function secret() { return process.env.OTP_SIGNING_SECRET || (shared.__quadOtpSecret ??= randomBytes(32).toString("hex")); }
function signature(payload: string) { return createHmac("sha256", secret()).update(payload).digest("hex"); }
export async function markVerified(kind: "mobile" | "email", identifier: string) {
  const payload = Buffer.from(JSON.stringify({ identifier, until: Date.now() + 15 * 60_000 })).toString("base64url");
  (await cookies()).set(`quad_verified_${kind}`, `${payload}.${signature(payload)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 900 });
}
export async function isVerifiedHere(kind: "mobile" | "email", identifier: string) {
  const token = (await cookies()).get(`quad_verified_${kind}`)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = Buffer.from(signature(payload)); const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  try { const value = JSON.parse(Buffer.from(payload, "base64url").toString()); return value.identifier === identifier && value.until > Date.now(); }
  catch { return false; }
}
