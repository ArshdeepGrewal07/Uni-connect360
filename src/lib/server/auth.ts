import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { and, gt, eq } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, users } from "@/db/schema";

export const COOKIE_NAME = "quad_session";

export type SessionUser = typeof users.$inferSelect;

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const rows = await db
    .select({ session: authSessions, user: users })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(eq(authSessions.token, token), gt(authSessions.createdAt, new Date(Date.now() - 30 * 86400000))))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function createSessionCookie(userId: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  await db.insert(authSessions).values({ token, userId });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function destroySessionCookie(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await db.delete(authSessions).where(and(eq(authSessions.token, token), gt(authSessions.createdAt, new Date(Date.now() - 30 * 86400000))));
  }
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function publicUser(u: SessionUser) {
  const year = u.academicYear;
  const alumniDue = year >= 4; // 4th-year students transition to read-only alumni
  return {
    id: u.id,
    fullName: u.fullName,
    firstName: u.fullName.split(" ")[0],
    regId: u.regId,
    email: u.email,
    mobile: u.mobile,
    gender: u.gender,
    course: u.course,
    academicYear: u.academicYear,
    interests: u.interests,
    lookingFor: u.lookingFor,
    avatarHue: u.avatarHue,
    visible: u.visible,
    isDemo: u.isDemo,
    isRestricted: u.isRestricted,
    alumniDue,
    createdAt: u.createdAt,
  };
}

export type PublicUser = ReturnType<typeof publicUser>;
