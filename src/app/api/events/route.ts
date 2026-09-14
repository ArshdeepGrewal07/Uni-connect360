import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventRsvps, events, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/server/auth";
import { err, ok, readBody } from "@/lib/server/util";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");

  const allEvents = await db.select().from(events).orderBy(events.startsAt);
  const rsvps = await db.select().from(eventRsvps);
  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const mineSet = new Set(
    rsvps.filter((r) => r.userId === me.id).map((r) => r.eventId)
  );

  const eventsList = allEvents.map((e) => {
    const eventRsvpList = rsvps.filter((r) => r.eventId === e.id);
    const attendees = eventRsvpList
      .map((r) => {
        const u = userMap.get(r.userId);
        if (!u) return null;
        return {
          id: u.id,
          firstName: u.fullName.split(" ")[0],
          course: u.course,
          avatarHue: u.avatarHue,
          wantsBuddy: r.wantsBuddy,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      tag: e.tag,
      image: e.image || "",
      startsAt: e.startsAt,
      going: eventRsvpList.length,
      buddySeekers: eventRsvpList.filter((r) => r.wantsBuddy).length,
      iAmGoing: mineSet.has(e.id),
      attendees,
    };
  });

  return ok({ events: eventsList });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");
  const body = await readBody(req);
  const eventId = String(body.eventId ?? "");
  if (!eventId) return err(422, "bad_event", "Missing eventId.");

  const existing = await db
    .select({ id: eventRsvps.id })
    .from(eventRsvps)
    .where(
      and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, me.id))
    )
    .limit(1);

  if (existing[0]) {
    await db.delete(eventRsvps).where(eq(eventRsvps.id, existing[0].id));
    return ok({ going: false });
  }

  await db.insert(eventRsvps).values({
    eventId,
    userId: me.id,
    wantsBuddy: body.wantsBuddy !== false,
  });
  return ok({ going: true });
}
