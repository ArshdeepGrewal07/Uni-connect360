import { and, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions, messages, users } from "@/db/schema";

/**
 * The 48-hour outreach rule.
 *
 * Production architecture would use a BullMQ delayed queue. This reference
 * implementation follows the "System Downtime" edge case from the spec: the
 * restriction is evaluated retroactively via a timestamp delta check on every
 * read/write, so the rule is enforced the moment the server sees the state —
 * even if the timer elapsed while nothing was running.
 */
export const WINDOW_MS = 48 * 60 * 60 * 1000;

/** Step 1 — expire any PENDING sessions whose 48h window has elapsed. */
export async function expireOverdueSessions(now: Date): Promise<string[]> {
  const overdue = await db
    .select({ id: chatSessions.id, initiatorId: chatSessions.initiatorId })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.status, "pending"),
        lt(chatSessions.timerEndsAt, now)
      )
    );
  for (const s of overdue) {
    await db
      .update(chatSessions)
      .set({ status: "expired", expiredAt: now })
      .where(eq(chatSessions.id, s.id));
  }
  return [...new Set(overdue.map((s) => s.initiatorId))];
}

/** Step 2 — derive `is_restricted` from un-waived expired sessions. */
export async function syncRestrictionFlags(): Promise<void> {
  const restrictedRows = await db
    .selectDistinct({ initiatorId: chatSessions.initiatorId })
    .from(chatSessions)
    .where(
      and(eq(chatSessions.status, "expired"), isNull(chatSessions.waivedAt))
    );
  const restrictedIds = new Set(restrictedRows.map((r) => r.initiatorId));

  const flagged = await db
    .select({ id: users.id, isRestricted: users.isRestricted })
    .from(users);
  for (const u of flagged) {
    const shouldBe = restrictedIds.has(u.id);
    if (u.isRestricted !== shouldBe) {
      await db
        .update(users)
        .set({ isRestricted: shouldBe })
        .where(eq(users.id, u.id));
    }
  }
}

/** Find the session that caused a user's restriction (for UI copy). */
export async function getRestrictionSource(userId: string) {
  const rows = await db
    .select({
      session: chatSessions,
      other: users,
    })
    .from(chatSessions)
    .innerJoin(users, eq(chatSessions.receiverId, users.id))
    .where(
      and(
        eq(chatSessions.initiatorId, userId),
        eq(chatSessions.status, "expired"),
        isNull(chatSessions.waivedAt)
      )
    )
    .orderBy(chatSessions.expiredAt)
    .limit(1);
  if (!rows[0]) return null;
  return {
    sessionId: rows[0].session.id,
    otherName: rows[0].other.fullName.split(" ")[0],
    expiredAt: rows[0].session.expiredAt,
  };
}

export async function enforceChatRules(now = new Date()): Promise<void> {
  await expireOverdueSessions(now);
  await syncRestrictionFlags();
}

/* ------------------------- demo liveliness engine ------------------------- */
/* Demo peers auto-accept requests, reply to messages, and (crucially) can
   accept a request *after* it expired — demonstrating the "Unrestrict/Accept"
   lift path from the 48-hour sequence diagram. */

const REPLIES = [
  "Hey! Yes, count me in 🙌",
  "Sure! When were you thinking?",
  "Haha yeah, I was hoping someone would ask. Let's do it!",
  "Sounds great — I'm usually free after 5pm.",
  "Nice, same course struggles here 😅",
];

const LATE_REPLIES = [
  "Hey! Sorry I missed this earlier — yes, let's connect 🙌",
  "Just saw this! I'm in, sorry for the delay 😅",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export async function runDemoSimulations(
  now: Date,
  currentUserId: string
): Promise<void> {
  if(process.env.SIMULATE_DEMO_REPLIES !== "true")return;
  const nowMs = now.getTime();

  // A) Demo receivers accept pending requests after a short, per-session delay.
  const pending = await db
    .select({
      id: chatSessions.id,
      initiatorId: chatSessions.initiatorId,
      receiverId: chatSessions.receiverId,
      createdAt: chatSessions.createdAt,
      receiverDemo: users.isDemo,
    })
    .from(chatSessions)
    .innerJoin(users, eq(chatSessions.receiverId, users.id))
    .where(eq(chatSessions.status, "pending"));
  for (const s of pending) {
    if (!s.receiverDemo || s.initiatorId !== currentUserId) continue;
    const acceptAfterMs = 12_000 + (hash(s.id) % 10) * 1000;
    if (nowMs - s.createdAt.getTime() > acceptAfterMs) {
      await db
        .update(chatSessions)
        .set({ status: "accepted", mediaUnlocked: true, acceptedAt: now })
        .where(eq(chatSessions.id, s.id));
      await db.insert(messages).values({
        sessionId: s.id,
        senderId: s.receiverId,
        kind: "text",
        body: REPLIES[hash(s.id) % REPLIES.length],
        createdAt: now,
      });
    }
  }

  // B) Demo receivers accept *after* expiry → restriction waived & lifted.
  const expired = await db
    .select({
      id: chatSessions.id,
      initiatorId: chatSessions.initiatorId,
      receiverId: chatSessions.receiverId,
      expiredAt: chatSessions.expiredAt,
      receiverDemo: users.isDemo,
    })
    .from(chatSessions)
    .innerJoin(users, eq(chatSessions.receiverId, users.id))
    .where(
      and(
        eq(chatSessions.status, "expired"),
        isNull(chatSessions.waivedAt)
      )
    );
  for (const s of expired) {
    if (!s.receiverDemo || s.initiatorId !== currentUserId) continue;
    if (!s.expiredAt) continue;
    if (nowMs - s.expiredAt.getTime() > 45_000) {
      await db
        .update(chatSessions)
        .set({
          status: "accepted",
          mediaUnlocked: true,
          acceptedAt: now,
          waivedAt: now,
        })
        .where(eq(chatSessions.id, s.id));
      await db.insert(messages).values({
        sessionId: s.id,
        senderId: s.receiverId,
        kind: "text",
        body: LATE_REPLIES[hash(s.id) % LATE_REPLIES.length],
        createdAt: now,
      });
    }
  }

  // C) Demo peers reply to your messages in accepted chats.
  const accepted = await db
    .select({
      id: chatSessions.id,
      initiatorId: chatSessions.initiatorId,
      receiverId: chatSessions.receiverId,
    })
    .from(chatSessions)
    .where(eq(chatSessions.status, "accepted"));
  for (const s of accepted) {
    const demoId =
      s.initiatorId === currentUserId
        ? s.receiverId
        : s.receiverId === currentUserId
          ? s.initiatorId
          : null;
    if (!demoId) continue;
    const demoUser = await db
      .select({ isDemo: users.isDemo })
      .from(users)
      .where(eq(users.id, demoId))
      .limit(1);
    if (!demoUser[0]?.isDemo) continue;

    const last = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, s.id))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(1);
    const m = last[0];
    if (!m) continue;
    if (m.senderId !== currentUserId || m.kind === "system") continue;
    if (nowMs - m.createdAt.getTime() < 6_000) continue;
    await db.insert(messages).values({
      sessionId: s.id,
      senderId: demoId,
      kind: "text",
      body: REPLIES[hash(s.id + m.id) % REPLIES.length],
      createdAt: now,
    });
  }
}
