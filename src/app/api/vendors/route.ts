import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { places, reviews, users, vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/server/auth";
import { err, ok, readBody } from "@/lib/server/util";
import { ensureSeeded } from "@/db/seed";

// Campus map scale: 1 SVG unit ≈ 4.2 metres.
const METERS_PER_UNIT = 4.2;

function distanceMeters(x1: number, y1: number, x2: number, y2: number) {
  return Math.round(Math.hypot(x1 - x2, y1 - y2) * METERS_PER_UNIT);
}

export async function GET(req: Request) {
  await ensureSeeded();
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");

  const q = new URL(req.url).searchParams;
  const ux = Number(q.get("ux") ?? 50);
  const uy = Number(q.get("uy") ?? 40);
  const detailId = q.get("detail");

  const allPlaces = await db.select().from(places);

  if (detailId) {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, detailId))
      .limit(1);
    if (!vendor) return err(404, "not_found", "Vendor not found.");

    const reviewRows = await db
      .select({
        review: reviews,
        firstName: users.fullName,
        hue: users.avatarHue,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.vendorId, vendor.id))
      .orderBy(desc(reviews.createdAt));

    const ratingRow = await db
      .select({
        avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        n: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.vendorId, vendor.id));

    return ok({
      vendor: {
        ...vendor,
        distanceMeters: distanceMeters(vendor.x, vendor.y, ux, uy),
        rating: Math.round((ratingRow[0]?.avg ?? 0) * 10) / 10,
        reviewCount: ratingRow[0]?.n ?? 0,
      },
      reviews: reviewRows.map((r) => ({
        id: r.review.id,
        rating: r.review.rating,
        body: r.review.body,
        createdAt: r.review.createdAt,
        firstName: r.firstName.split(" ")[0],
        hue: r.hue,
      })),
    });
  }

  const rows = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      blurb: vendors.blurb,
      isOpen: vendors.isOpen,
      image: vendors.image,
      topDish: vendors.topDish,
      x: vendors.x,
      y: vendors.y,
      avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      n: sql<number>`count(${reviews.id})`,
    })
    .from(vendors)
    .leftJoin(reviews, eq(reviews.vendorId, vendors.id))
    .groupBy(
      vendors.id,
      vendors.name,
      vendors.blurb,
      vendors.isOpen,
      vendors.image,
      vendors.topDish,
      vendors.x,
      vendors.y
    );

  const list = rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      blurb: r.blurb,
      isOpen: r.isOpen,
      image: r.image,
      topDish: r.topDish,
      x: r.x,
      y: r.y,
      rating: Math.round(r.avg * 10) / 10,
      reviewCount: Number(r.n),
      distanceMeters: distanceMeters(r.x, r.y, ux, uy),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return ok({
    vendors: list,
    places: allPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      x: p.x,
      y: p.y,
      distanceMeters: distanceMeters(p.x, p.y, ux, uy),
    })),
  });
}

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return err(401, "no_session", "Not signed in.");
  const body = await readBody(req);

  if (String(body.action ?? "") !== "review")
    return err(400, "bad_action", "Unknown vendor action.");

  const vendorId = String(body.vendorId ?? "");
  const rating = Number(body.rating ?? 0);
  const text = String(body.text ?? "").trim().slice(0, 400);

  const [vendor] = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1);
  if (!vendor) return err(404, "not_found", "Vendor not found.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return err(422, "bad_rating", "Rating must be 1–5 stars.");

  await db.insert(reviews).values({
    vendorId,
    userId: me.id,
    rating,
    body: text,
  });
  return ok({ added: true }, 201);
}
