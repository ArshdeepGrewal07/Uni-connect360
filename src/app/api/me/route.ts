import { and, eq, gt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions, messages, users } from "@/db/schema";
import { getCurrentUser, publicUser } from "@/lib/server/auth";
import {
  enforceChatRules,
  getRestrictionSource,
  runDemoSimulations,
} from "@/lib/server/rules";
import { err, ok, readBody } from "@/lib/server/util";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");

  // Retroactive 48h evaluation: expire overdue timers, sync flags, run the
  // demo liveliness engine, then re-evaluate so lifts apply immediately.
  const now = new Date();
  await enforceChatRules(now);
  await runDemoSimulations(now, me.id);
  await enforceChatRules(now);

  const [meNow] = await db
    .select()
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);
  if (!meNow) return err(401, "no_session", "Account not found.");

  const restriction = meNow.isRestricted
    ? await getRestrictionSource(meNow.id)
    : null;

  const counts = await db
    .select({
      pendingIn: sql<number>`count(*) filter (where ${chatSessions.status} = 'pending' and ${chatSessions.receiverId} = ${me.id})`,
      pendingOut: sql<number>`count(*) filter (where ${chatSessions.status} = 'pending' and ${chatSessions.initiatorId} = ${me.id})`,
    })
    .from(chatSessions)
    .where(
      or(
        eq(chatSessions.initiatorId, me.id),
        eq(chatSessions.receiverId, me.id)
      )
    );

  const unreadRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(messages)
    .innerJoin(chatSessions, eq(messages.sessionId, chatSessions.id))
    .where(
      and(
        sql`${messages.senderId} != ${me.id}`,
        or(
          and(
            eq(chatSessions.initiatorId, me.id),
            gt(messages.createdAt, chatSessions.initiatorLastRead)
          ),
          and(
            eq(chatSessions.receiverId, me.id),
            gt(messages.createdAt, chatSessions.receiverLastRead)
          )
        )
      )
    );

  return ok({
    user: publicUser(meNow),
    restriction,
    pendingIn: counts[0]?.pendingIn ?? 0,
    pendingOut: counts[0]?.pendingOut ?? 0,
    unread: unreadRows[0]?.n ?? 0,
  });
}

export async function PUT(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");

  const body = await readBody(req);

  if (body.gender !== undefined && String(body.gender) !== me.gender && body.gender !== "prefer_not_to_say") {
    return err(
      423,
      "gender_locked",
      "Gender is locked after onboarding. Changes require manual admin review with university ID proof."
    );
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (body.gender === "prefer_not_to_say") patch.gender = "prefer_not_to_say";
  if (typeof body.lookingFor === "string")
    patch.lookingFor = body.lookingFor.trim().slice(0, 60) || null;
  if (Array.isArray(body.interests))
    patch.interests = body.interests.map(String).slice(0, 6);
  if (typeof body.visible === "boolean") patch.visible = body.visible;
  if (typeof body.avatarHue === "number")
    patch.avatarHue = Math.floor(((body.avatarHue % 360) + 360) % 360);
  if (typeof body.course === "string" && body.course.trim())
    patch.course = body.course.trim().slice(0, 80);
  const year = Number(body.academicYear);
  if (body.academicYear !== undefined && year >= 1 && year <= 4)
    patch.academicYear = year;

  if (Object.keys(patch).length === 0)
    return err(422, "nothing", "No valid fields to update.");

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, me.id))
    .returning();

  return ok({ user: publicUser(updated) });
}
