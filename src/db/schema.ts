import {
  index,
  integer,
  sqliteTable,
  real,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ---------------------------------- enums --------------------------------- */

const genderEnumValues = ["male", "female", "non_binary", "prefer_not_to_say"] as const;
const chatStatusEnumValues = [
  "pending",
  "accepted",
  "expired",
  "declined",
] as const;
const messageKindEnumValues = [
  "text",
  "image",
  "voice",
  "system",
] as const;
const reportCategoryEnumValues = [
  "harassment",
  "fake_profile",
  "spam",
] as const;
const reportStatusEnumValues = [
  "open",
  "reviewed",
  "actioned",
] as const;

/* ---------------------------------- users --------------------------------- */

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fullName: text("full_name").notNull(),
    regId: text("reg_id").notNull().unique(),
    email: text("email").notNull().unique(),
    contactKey: text("mobile").notNull().unique(), // Legacy unique contact key; retained for migration safety.
    mobile: text("phone_number").unique(),
    gender: text("gender", { enum: genderEnumValues }).notNull(),
    course: text("course").notNull(),
    academicYear: integer("academic_year").notNull(),
    interests: text("interests", { mode: "json" }).$type<string[]>().notNull().default([]),
    lookingFor: text("looking_for"),
    avatarHue: integer("avatar_hue").notNull().default(140),
    visible: integer("visible", { mode: "boolean" }).notNull().default(true),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    isRestricted: integer("is_restricted", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

/* ------------------------------- auth tables ------------------------------ */

export const otpCodes = sqliteTable(
  "otp_codes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    identifier: text("identifier").notNull(),
    kind: text("kind").notNull(), // "mobile" | "email"
    code: text("code").notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("otp_identifier_idx").on(t.identifier)]
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("auth_sessions_token_idx").on(t.token)]
);

/* ------------------------------- chat system ------------------------------ */

export const chatSessions = sqliteTable(
  "chat_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    initiatorId: text("initiator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: text("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: chatStatusEnumValues }).notNull().default("pending"),
    mediaUnlocked: integer("media_unlocked", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    timerEndsAt: integer("timer_ends_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    expiredAt: integer("expired_at", { mode: "timestamp_ms" }),
    waivedAt: integer("waived_at", { mode: "timestamp_ms" }),
    initiatorLastRead: integer("initiator_last_read", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
    receiverLastRead: integer("receiver_last_read", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  },
  (t) => [
    index("chat_initiator_idx").on(t.initiatorId),
    index("chat_receiver_idx").on(t.receiverId),
    index("chat_status_idx").on(t.status),
  ]
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => users.id, {
      onDelete: "set null",
    }),
    kind: text("kind", { enum: messageKindEnumValues }).notNull().default("text"),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("messages_session_idx").on(t.sessionId)]
);

/* --------------------------------- events --------------------------------- */

export const events = sqliteTable("events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  location: text("location").notNull(),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  tag: text("tag").notNull().default("meetup"),
  image: text("image").notNull().default(""),
});

export const eventRsvps = sqliteTable(
  "event_rsvps",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    wantsBuddy: integer("wants_buddy", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("rsvp_unique_idx").on(t.eventId, t.userId)]
);

/* --------------------------- vendors & directory -------------------------- */

export const places = sqliteTable("places", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // "food" | "academic" | "housing"
  x: real("x").notNull(),
  y: real("y").notNull(),
});

export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  placeId: text("place_id").references(() => places.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  blurb: text("blurb").notNull().default(""),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  image: text("image").notNull().default(""),
  topDish: text("top_dish"),
  x: real("x").notNull().default(50),
  y: real("y").notNull().default(50),
  menu: text("menu", { mode: "json" })
    .$type<{ item: string; price: string; veg: boolean }[]>()
    .notNull()
    .default([]),
});

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("reviews_vendor_idx").on(t.vendorId)]
);

/* ------------------------------ moderation -------------------------------- */

export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedId: text("reported_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category", { enum: reportCategoryEnumValues }).notNull(),
    details: text("details").notNull().default(""),
    evidenceUrl: text("evidence_url").notNull(),
    status: text("status", { enum: reportStatusEnumValues }).notNull().default("open"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("reports_reporter_idx").on(t.reporterId)]
);

export const blocks = sqliteTable(
  "blocks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("block_pair_idx").on(t.blockerId, t.blockedId)]
);

/* ------------------------------ announcements ----------------------------- */

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
