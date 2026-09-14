import { and, eq, inArray, ne, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { blocks, chatSessions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/server/auth";
import { err, ok } from "@/lib/server/util";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");

  const q = new URL(req.url).searchParams;
  const sameGenderOnly = q.get("sameGender") === "1";
  const year = Number(q.get("year") ?? 0);
  const interest = q.get("interest") ?? "";
  const search = (q.get("q") ?? "").trim().toLowerCase();

  const blockedRows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, me.id), eq(blocks.blockedId, me.id)));
  const excluded = new Set<string>([me.id]);
  for (const b of blockedRows) {
    excluded.add(b.blockerId);
    excluded.add(b.blockedId);
  }

  const conditions = [
    eq(users.visible, true),
    ne(users.id, me.id),
    sql`${users.fullName} != 'Quad Team'`,
  ];
  if (excluded.size > 0)
    conditions.push(notInArray(users.id, [...excluded]));
  if (sameGenderOnly && me.gender === "prefer_not_to_say")
    return ok({ buddies: [] });
  if (sameGenderOnly) conditions.push(eq(users.gender, me.gender));
  if (year >= 1 && year <= 4) conditions.push(eq(users.academicYear, year));
  if (interest)
    conditions.push(sql`exists (select 1 from json_each(${users.interests}) where value = ${interest})`);
  if (search)
    conditions.push(
      or(sql`lower(${users.fullName}) like ${"%" + search + "%"}`, sql`lower(${users.course}) like ${"%" + search + "%"}`)!
    );

  const candidates = await db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(sql`${users.isDemo} desc, ${users.fullName}`)
    .limit(30);

  // Relationship state per candidate: existing pending/accepted session?
  const relations = await db
    .select({
      otherId: sql<string>`case when ${chatSessions.initiatorId} = ${me.id} then ${chatSessions.receiverId} else ${chatSessions.initiatorId} end`,
      status: chatSessions.status,
      sessionId: chatSessions.id,
      iInitiated: sql<boolean>`(${chatSessions.initiatorId} = ${me.id})`,
    })
    .from(chatSessions)
    .where(
      and(
        or(
          eq(chatSessions.initiatorId, me.id),
          eq(chatSessions.receiverId, me.id)
        ),
        inArray(
          sql`case when ${chatSessions.initiatorId} = ${me.id} then ${chatSessions.receiverId} else ${chatSessions.initiatorId} end`,
          candidates.map((c) => c.id)
        )
      )
    );

  const relByUser = new Map<
    string,
    { status: string; sessionId: string; iInitiated: boolean }
  >();
  for (const r of relations) {
    const rank = r.status === "accepted" ? 3 : r.status === "pending" ? 2 : 1;
    const existing = relByUser.get(r.otherId);
    const existingRank =
      existing?.status === "accepted" ? 3 : existing?.status === "pending" ? 2 : 1;
    if (!existing || rank > existingRank) {
      relByUser.set(r.otherId, {
        status: r.status,
        sessionId: r.sessionId,
        iInitiated: r.iInitiated,
      });
    }
  }

  return ok({
    buddies: candidates.map((c) => {
      const rel = relByUser.get(c.id);
      return {
        id: c.id,
        firstName: c.fullName.split(" ")[0],
        fullName: c.fullName,
        course: c.course,
        academicYear: c.academicYear,
        gender: c.gender,
        interests: c.interests,
        lookingFor: c.lookingFor,
        avatarHue: c.avatarHue,
        relation: rel
          ? { status: rel.status, sessionId: rel.sessionId, iInitiated: rel.iInitiated }
          : null,
      };
    }),
  });
}
