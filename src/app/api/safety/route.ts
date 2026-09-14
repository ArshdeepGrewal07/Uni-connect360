import { storeMedia } from "@/lib/server/media";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { blocks, reports, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/server/auth";
import { err, ok, readBody } from "@/lib/server/util";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");

  const myReports = await db
    .select({
      report: reports,
      reportedName: users.fullName,
    })
    .from(reports)
    .innerJoin(users, eq(reports.reportedId, users.id))
    .where(eq(reports.reporterId, me.id))
    .orderBy(desc(reports.createdAt));

  const myBlocks = await db
    .select({
      user: users,
      createdAt: blocks.createdAt,
    })
    .from(blocks)
    .innerJoin(users, eq(blocks.blockedId, users.id))
    .where(eq(blocks.blockerId, me.id))
    .orderBy(desc(blocks.createdAt));

  return ok({
    reports: myReports.map((r) => ({
      id: r.report.id,
      reportedFirstName: r.reportedName.split(" ")[0],
      category: r.report.category,
      details: r.report.details,
      evidenceUrl: r.report.evidenceUrl,
      status: r.report.status,
      createdAt: r.report.createdAt,
    })),
    blocked: myBlocks.map((b) => ({
      id: b.user.id,
      firstName: b.user.fullName.split(" ")[0],
      course: b.user.course,
      avatarHue: b.user.avatarHue,
      createdAt: b.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");
  const body = await readBody(req);
  const action = String(body.action ?? "");

  if (action === "report") {
    const reportedId = String(body.reportedId ?? "");
    const category = String(body.category ?? "");
    const details = String(body.details ?? "").trim().slice(0, 600);
    const evidenceUrl = String(body.evidenceUrl ?? "").trim();

    if (!["harassment", "fake_profile", "spam"].includes(category))
      return err(422, "bad_category", "Pick a report category.");
    if (evidenceUrl.length > 2_800_000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(evidenceUrl))
      return err(422, "bad_evidence", "Attach a PNG, JPEG or WebP screenshot under 2 MB.");
    if (!evidenceUrl)
      return err(
        422,
        "no_evidence",
        "Evidence is mandatory — attach a screenshot so moderators can review."
      );
    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, reportedId))
      .limit(1);
    if (!target) return err(404, "no_user", "User not found.");
    if (target.id === me.id)
      return err(422, "self", "You can't report yourself.");

    const [row] = await db
      .insert(reports)
      .values({
        reporterId: me.id,
        reportedId,
        category: category as "harassment" | "fake_profile" | "spam",
        details,
        evidenceUrl: await storeMedia(evidenceUrl,me.id,null,"report"),
        status: "open",
      })
      .returning({ id: reports.id, createdAt: reports.createdAt });

    return ok(
      {
        reportId: row.id,
        note: "Reports never trigger automatic bans — a moderator will review the evidence.",
      },
      201
    );
  }

  if (action === "block") {
    const userId = String(body.userId ?? "");
    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!target) return err(404, "no_user", "User not found.");
    if (target.id === me.id) return err(422, "self", "You can't block yourself.");
    await db
      .insert(blocks)
      .values({ blockerId: me.id, blockedId: userId })
      .onConflictDoNothing();
    return ok({ blocked: true });
  }

  return err(400, "bad_action", "Unknown safety action.");
}

export async function DELETE(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");
  const q = new URL(req.url).searchParams;
  const userId = q.get("unblock") ?? "";
  if (!userId) return err(422, "bad_request", "Missing unblock user id.");
  await db
    .delete(blocks)
    .where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, userId)));
  return ok({ unblocked: true });
}
