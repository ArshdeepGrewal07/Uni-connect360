import { storeMedia } from "@/lib/server/media";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { blocks, chatSessions, messages, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/server/auth";
import {
  WINDOW_MS,
  enforceChatRules,
  getRestrictionSource,
  runDemoSimulations,
} from "@/lib/server/rules";
import { err, ok, readBody } from "@/lib/server/util";

type SessionRow = typeof chatSessions.$inferSelect;

async function prepare(meId: string) {
  const now = new Date();
  await enforceChatRules(now);
  await runDemoSimulations(now, meId);
  await enforceChatRules(now);
  return now;
}

async function withOtherUser(meId: string) {
  // Query sessions where me is initiator or receiver
  const sessions = await db
    .select()
    .from(chatSessions)
    .where(
      or(eq(chatSessions.initiatorId, meId), eq(chatSessions.receiverId, meId))
    )
    .orderBy(desc(chatSessions.createdAt));

  if (sessions.length === 0) return [];

  // Fetch all other users
  const otherUserIds = Array.from(
    new Set(
      sessions.map((s) => (s.initiatorId === meId ? s.receiverId : s.initiatorId))
    )
  );
  const otherUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, otherUserIds));
  const userMap = new Map(otherUsers.map((u) => [u.id, u]));

  // For each session, fetch last message and unread count
  const results = await Promise.all(
    sessions.map(async (s) => {
      const otherId = s.initiatorId === meId ? s.receiverId : s.initiatorId;
      const other = userMap.get(otherId)!;

      const lastMsgs = await db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, s.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      const lastMsg = lastMsgs[0] || null;

      const lastRead =
        s.initiatorId === meId
          ? s.initiatorLastRead || new Date(0)
          : s.receiverLastRead || new Date(0);

      const unreadMsgs = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.sessionId, s.id),
            sql`${messages.senderId} != ${meId}`,
            sql`${messages.createdAt} > ${lastRead.getTime()}`
          )
        );

      return {
        session: s,
        other,
        lastMsgBody: lastMsg?.body ?? null,
        lastMsgKind: lastMsg?.kind ?? null,
        lastMsgAt: lastMsg?.createdAt ?? null,
        unread: unreadMsgs.length,
      };
    })
  );

  return results.filter((r) => r.other);
}

function summarize(meId: string, row: {
  session: SessionRow;
  other: typeof users.$inferSelect;
  lastMsgBody: string | null;
  lastMsgKind: string | null;
  lastMsgAt: Date | null;
  unread: number;
}) {
  const s = row.session;
  return {
    id: s.id,
    status: s.status,
    mediaUnlocked: s.mediaUnlocked,
    createdAt: s.createdAt,
    timerEndsAt: s.timerEndsAt,
    acceptedAt: s.acceptedAt,
    expiredAt: s.expiredAt,
    waivedAt: s.waivedAt,
    iInitiated: s.initiatorId === meId,
    other: {
      id: row.other.id,
      firstName: row.other.fullName.split(" ")[0],
      fullName: row.other.fullName,
      course: row.other.course,
      avatarHue: row.other.avatarHue,
    },
    lastMessage: row.lastMsgBody,
    lastMessageKind: row.lastMsgKind,
    lastMessageAt: row.lastMsgAt,
    unread: Number(row.unread) || 0,
  };
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");
  await prepare(me.id);

  const q = new URL(req.url).searchParams;
  const detailId = q.get("id");

  if (detailId) {
    const rows = await withOtherUser(me.id);
    const row = rows.find((r) => r.session.id === detailId);
    if (!row) return err(404, "not_found", "Chat not found.");

    // Mark as read.
    const patch =
      row.session.initiatorId === me.id
        ? { initiatorLastRead: new Date() }
        : { receiverLastRead: new Date() };
    await db
      .update(chatSessions)
      .set(patch)
      .where(eq(chatSessions.id, detailId));

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, detailId))
      .orderBy(asc(messages.createdAt));

    return ok({
      session: summarize(me.id, { ...row, unread: 0 }),
      messages: msgs.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        kind: m.kind,
        body: m.body,
        createdAt: m.createdAt,
      })),
    });
  }

  const rows = await withOtherUser(me.id);
  const summaries = rows.map((r) => summarize(me.id, r));

  const [meNow] = await db
    .select({ isRestricted: users.isRestricted })
    .from(users)
    .where(eq(users.id, me.id));
  const restriction = meNow?.isRestricted
    ? await getRestrictionSource(me.id)
    : null;

  return ok({
    chats: summaries,
    restricted: meNow?.isRestricted ?? false,
    restriction,
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");
  await prepare(me.id);
  const body = await readBody(req);
  const action = String(body.action ?? "");

  const getSession = async (id: string) => {
    const [s] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, id))
      .limit(1);
    if (!s) return null;
    if (s.initiatorId !== me.id && s.receiverId !== me.id) return null;
    return s;
  };

  /* ------------------------------- INITIATE -------------------------------- */
  if (action === "initiate") {
    const receiverId = String(body.receiverId ?? "");
    if (receiverId === me.id) return err(422, "self", "Choose another student.");
    const message = String(body.message ?? "").trim();
    const kind = String(body.kind ?? "text");

    if (kind !== "text")
      return err(400, "media_locked", "New requests are text-only until accepted.");
    if (!message || message.length > 500)
      return err(422, "bad_message", "Write a short first message (1–500 chars).");

    const [meNow] = await db
      .select()
      .from(users)
      .where(eq(users.id, me.id));
    if (meNow?.isRestricted) {
      const source = await getRestrictionSource(me.id);
      return err(
        403,
        "restricted",
        "Your account is temporarily restricted from starting new chats. Existing conversations still work.",
        { restriction: source }
      );
    }

    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);
    if (!receiver || !receiver.visible)
      return err(404, "no_user", "That student isn't available right now.");

    const blockedRows = await db
      .select()
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, receiverId)),
          and(eq(blocks.blockerId, receiverId), eq(blocks.blockedId, me.id))
        )
      )
      .limit(1);
    if (blockedRows[0])
      return err(403, "blocked", "You can't message this user.");

    const dup = await db
      .select()
      .from(chatSessions)
      .where(
        or(
          and(
            eq(chatSessions.initiatorId, me.id),
            eq(chatSessions.receiverId, receiverId)
          ),
          and(
            eq(chatSessions.initiatorId, receiverId),
            eq(chatSessions.receiverId, me.id)
          )
        )
      )
      .orderBy(desc(chatSessions.createdAt))
      .limit(1);
    if (dup[0]) {
      if (dup[0].status === "accepted")
        return err(409, "exists", "You're already connected.", {
          sessionId: dup[0].id,
        });
      if (dup[0].status === "pending")
        return err(409, "pending", "A request is already waiting on a reply.", {
          sessionId: dup[0].id,
        });
      if (dup[0].status === "declined")
        return err(403, "declined", "This request was declined. Please don't resend.");
    }

    const now = new Date();
    const [session] = await db
      .insert(chatSessions)
      .values({
        initiatorId: me.id,
        receiverId,
        status: "pending",
        timerEndsAt: new Date(now.getTime() + WINDOW_MS),
        createdAt: now,
      })
      .returning();
    await db.insert(messages).values({
      sessionId: session.id,
      senderId: me.id,
      kind: "text",
      body: message,
      createdAt: now,
    });

    return ok(
      {
        sessionId: session.id,
        status: session.status,
        timerEndsAt: session.timerEndsAt,
      },
      201
    );
  }

  /* ------------------------------- RESPOND --------------------------------- */
  if (action === "respond") {
    const s = await getSession(String(body.sessionId ?? ""));
    if (!s) return err(404, "not_found", "Chat not found.");
    if (s.receiverId !== me.id)
      return err(403, "not_receiver", "Only the receiver can accept or decline.");
    const response = String(body.response ?? "");

    if (response === "accept") {
      const now = new Date();
      const wasExpired = s.status === "expired";
      if (s.status === "pending" || s.status === "expired") {
        await db
          .update(chatSessions)
          .set({
            status: "accepted",
            mediaUnlocked: true,
            acceptedAt: now,
            ...(wasExpired ? { waivedAt: now } : {}),
          })
          .where(eq(chatSessions.id, s.id));
        await db.insert(messages).values({
          sessionId: s.id,
          senderId: me.id,
          kind: "system",
          body: wasExpired
            ? "Request accepted after the 48-hour window — restriction on the sender was lifted. Media unlocked."
            : "Request accepted. Media and voice notes unlocked.",
          createdAt: now,
        });
        await enforceChatRules(new Date());
        return ok({ accepted: true, waived: wasExpired });
      }
      return err(409, "state", "This request is no longer pending.");
    }

    if (response === "decline") {
      if (s.status !== "pending")
        return err(409, "state", "Only pending requests can be declined.");
      await db
        .update(chatSessions)
        .set({ status: "declined" })
        .where(eq(chatSessions.id, s.id));
      return ok({ declined: true });
    }

    return err(400, "bad_response", "Unknown response.");
  }

  /* -------------------------------- MESSAGE -------------------------------- */
  if (action === "message") {
    const s = await getSession(String(body.sessionId ?? ""));
    if (!s) return err(404, "not_found", "Chat not found.");
    const kind = String(body.kind ?? "text");
    const msg = String(body.body ?? "").trim();
    if (!["text", "image", "voice"].includes(kind))
      return err(400, "bad_kind", "Unsupported message type.");
    if (!msg) return err(422, "empty", "Message is empty.");
    if (kind === "text" && msg.length > 4000) return err(422, "too_long", "Messages must be under 4,000 characters.");
    if (kind !== "text" && msg.length > 2_800_000) return err(413, "too_large", "Attachment must be under 2 MB.");
    if (kind === "image" && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(msg))
      return err(422, "bad_media", "Choose a PNG, JPEG, WebP or GIF image.");
    if (kind === "voice" && !/^data:audio\/(webm|ogg|mp4|mpeg|wav)(;codecs=[A-Za-z0-9.,-]+)?;base64,[A-Za-z0-9+/=]+$/.test(msg))
      return err(422, "bad_media", "Unsupported audio recording format.");
    const otherId = s.initiatorId === me.id ? s.receiverId : s.initiatorId;
    const blocked = await db.select().from(blocks).where(or(
      and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, otherId)),
      and(eq(blocks.blockerId, otherId), eq(blocks.blockedId, me.id))
    )).limit(1);
    if (blocked.length) return err(403, "blocked", "You cannot message this user.");

    if (kind !== "text" && !(s.status === "accepted" && s.mediaUnlocked))
      return err(
        423,
        "media_locked",
        "Media & voice stay locked until the request is accepted."
      );
    if (s.status === "declined" || s.status === "expired")
      return err(410, "closed", "This request is closed.");

    let storedBody=msg;
    if(kind!=="text"){
      try{storedBody=await storeMedia(msg,me.id,s.id,'chat');}
      catch{return err(503,'media_storage','Could not store the attachment. Please retry.');}
    }
    const now = new Date();
    // Receiver replying to a pending request = implicit accept (per spec).
    if (s.status === "pending" && s.receiverId === me.id) {
      await db
        .update(chatSessions)
        .set({ status: "accepted", mediaUnlocked: true, acceptedAt: now })
        .where(eq(chatSessions.id, s.id));
      await db.insert(messages).values({
        sessionId: s.id,
        senderId: me.id,
        kind: "system",
        body: "You replied — request accepted. Media and voice notes unlocked.",
        createdAt: now,
      });
    }

    await db.insert(messages).values({
      sessionId: s.id,
      senderId: me.id,
      kind: kind as "text" | "image" | "voice",
      body: storedBody,
      createdAt: new Date(),
    });
    const patch =
      s.initiatorId === me.id
        ? { initiatorLastRead: new Date() }
        : { receiverLastRead: new Date() };
    await db.update(chatSessions).set(patch).where(eq(chatSessions.id, s.id));

    return ok({ sent: true });
  }

  /* --------------------------- DEMO: FAST-FORWARD --------------------------- */
  if (action === "fast-forward") {
    if (process.env.DEMO_MODE !== "true" || !me.isDemo) return err(403, "demo_only", "This control is only for demo accounts.");
    const s = await getSession(String(body.sessionId ?? ""));
    if (!s) return err(404, "not_found", "Chat not found.");
    if (s.initiatorId !== me.id || s.status !== "pending")
      return err(409, "state", "Only a pending outgoing request can be fast-forwarded.");

    await db
      .update(chatSessions)
      .set({ timerEndsAt: new Date(Date.now() - 1000) })
      .where(eq(chatSessions.id, s.id));
    await enforceChatRules(new Date());
    const [meNow] = await db
      .select({ isRestricted: users.isRestricted })
      .from(users)
      .where(eq(users.id, me.id));
    return ok({ expired: true, restricted: meNow?.isRestricted ?? false });
  }

  return err(400, "bad_action", "Unknown chat action.");
}
