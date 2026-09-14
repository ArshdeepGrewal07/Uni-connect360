import { randomInt } from "node:crypto";
import { markVerified, isVerifiedHere } from "@/lib/server/otp-proof";
import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { db, database } from "@/db";
import { hashPassword, verifyPassword, validPassword, allowPasswordAttempt } from "@/lib/server/password";
import { otpCodes, users } from "@/db/schema";
import { ensureSeeded, ensureDemoCredentials, ensureContactFields, seedStarterChats } from "@/db/seed";
import {
  getCurrentUser,
  createSessionCookie,
  destroySessionCookie,
  publicUser,
} from "@/lib/server/auth";
import { err, ok, readBody } from "@/lib/server/util";

const demoMode = process.env.DEMO_MODE === "true";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9.-]+\.(?:edu|ac\.in)|lpu\.in)$/i;
const MOBILE_RE = /^\+?[0-9][0-9 -]{8,14}$/;
const OTP_TTL_MS = 5 * 60_000;

async function latestOtp(identifier: string) {
  const rows = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.identifier, identifier))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function GET() {
  await ensureSeeded();
  await ensureDemoCredentials();
  await ensureContactFields();
  if (!demoMode) return ok({ demoUsers: [] });
  const demos = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      course: users.course,
      academicYear: users.academicYear,
      avatarHue: users.avatarHue,
      gender: users.gender,
      lookingFor: users.lookingFor,
      interests: users.interests,
    })
    .from(users)
    .where(and(eq(users.isDemo, true), sql`${users.fullName} != 'Quad Team'`))
    .orderBy(users.regId);

  return ok({ demoUsers: demos });
}

export async function POST(req: Request) {
  await ensureSeeded();
  await ensureDemoCredentials();
  await ensureContactFields();
  const body = await readBody(req);
  const action = String(body.action ?? "");

  if(action==='signup'){
    const email=String(body.email??'').trim().toLowerCase();
    if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return err(422,'bad_email','Enter a valid email address.');
    if(!validPassword(body.password))return err(422,'bad_password','Use a password with 12–128 characters.');
    if(!await allowPasswordAttempt('signup:'+email))return err(429,'signup_limited','Too many attempts. Try again in 15 minutes.');
    const fullName=String(body.fullName??'').trim(),course=String(body.course??'').trim(),year=Number(body.academicYear),gender=String(body.gender??'');
    if(fullName.length<2||fullName.length>100||!course||course.length>100||!Number.isInteger(year)||year<1||year>6||!['male','female','non_binary','prefer_not_to_say'].includes(gender))return err(422,'bad_profile','Complete your name, course, year and gender choice.');
    const interests=Array.isArray(body.interests)?body.interests:[];
    if(interests.length>6||interests.some(v=>typeof v!=='string'||v.length>40))return err(422,'bad_interests','Choose up to six interests.');
    const raw=database();
    if(await raw.prepare('SELECT id FROM users WHERE lower(email)=?').bind(email).first())return err(409,'email_exists','This email already has an account. Log in with its password.');
    const id=crypto.randomUUID(),now=Date.now(),regId='QUAD-'+id.slice(0,8).toUpperCase();
    try{
      await raw.batch([
        raw.prepare('INSERT INTO users(id,full_name,reg_id,email,mobile,phone_number,gender,course,academic_year,interests,looking_for,avatar_hue,visible,is_demo,is_restricted,created_at) VALUES(?,?,?,?,?,NULL,?,?,?,?,?,140,1,0,0,?)').bind(id,fullName,regId,email,'email:'+email,gender,course,year,JSON.stringify(interests),String(body.lookingFor??'').trim().slice(0,200)||null,now),
        raw.prepare('INSERT INTO user_credentials(user_id,password_hash,updated_at) VALUES(?,?,?)').bind(id,hashPassword(body.password),now)
      ]);
    }catch(e){
      if(await raw.prepare('SELECT id FROM users WHERE lower(email)=?').bind(email).first())return err(409,'email_exists','This email already has an account. Log in instead.');
      console.error('Signup failed',e);return err(503,'signup_failed','Could not save your account. Please try again.');
    }
    const [user]=await db.select().from(users).where(eq(users.id,id)).limit(1);
    await createSessionCookie(id);return ok({user:publicUser(user)},201);
  }

  if(action==='password-login'){
    const email=String(body.email??'').trim().toLowerCase();
    if(email.length>254||!email.includes('@')||typeof body.password!=='string'||body.password.length>128)return err(401,'bad_credentials','Incorrect email or password.');
    if(!await allowPasswordAttempt(email))return err(429,'login_limited','Too many attempts. Try again in 15 minutes.');
    const credential=await database().prepare('SELECT c.password_hash,u.id,u.is_demo FROM user_credentials c JOIN users u ON u.id=c.user_id WHERE u.email=?').bind(email).first<{password_hash:string;id:string;is_demo:number}>();
    if(!credential||(!demoMode&&credential.is_demo)||!verifyPassword(body.password,credential.password_hash))return err(401,'bad_credentials','Incorrect email or password.');
    const [user]=await db.select().from(users).where(eq(users.id,credential.id)).limit(1);
    await createSessionCookie(user.id);
    return ok({user:publicUser(user)});
  }
  if(action==='set-password'){
    const me=await getCurrentUser();
    if(!me)return err(401,'no_session','Sign in first.');
    if(!validPassword(body.password))return err(422,'bad_password','Use a password with 12–128 characters.');
    const old=await database().prepare('SELECT password_hash FROM user_credentials WHERE user_id=?').bind(me.id).first<{password_hash:string}>();
    if(old){
      if(!await allowPasswordAttempt(me.email))return err(429,'login_limited','Too many attempts. Try again in 15 minutes.');
      if(typeof body.currentPassword!=='string'||body.currentPassword.length>128||!verifyPassword(body.currentPassword,old.password_hash))return err(401,'bad_password','Current password is incorrect.');
    }
    const nextHash=hashPassword(body.password);
    if(old){
      const result=await database().prepare('UPDATE user_credentials SET password_hash=?,updated_at=? WHERE user_id=? AND password_hash=?').bind(nextHash,Date.now(),me.id,old.password_hash).run();
      if(result.meta.changes!==1)return err(409,'changed','Password changed elsewhere. Sign in again.');
    }else{
      const result=await database().prepare('INSERT OR IGNORE INTO user_credentials(user_id,password_hash,updated_at) VALUES(?,?,?)').bind(me.id,nextHash,Date.now()).run();
      if(result.meta.changes!==1)return err(409,'changed','Password already set. Enter the current password.');
    }
    await database().prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(me.id).run();
    await createSessionCookie(me.id);
    return ok({saved:true});
  }

  /* ------------------------------ DEMO LOGIN ------------------------------ */
  if (action === "demo-login") {
    if (!demoMode) return err(403, "demo_disabled", "Demo accounts are disabled.");
    const userId = String(body.userId ?? "");
    let user;
    if (userId) {
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = rows[0];
    } else {
      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.isDemo, true), sql`${users.fullName} != 'Quad Team'`))
        .limit(1);
      user = rows[0];
    }
    if (!user || !user.isDemo) return err(404, "no_user", "Demo user not found.");
    await createSessionCookie(user.id);
    return ok({ user: publicUser(user) });
  }

  /* ------------------------------ REQUEST OTP ------------------------------ */
  if (action === "request-otp") {
    if (!demoMode && (!process.env.OTP_DELIVERY_URL || !process.env.OTP_SIGNING_SECRET)) return err(503, "otp_setup", "Sign-in delivery is not configured. Contact the app administrator.");
    const identifier = String(body.identifier ?? "").trim().toLowerCase();
    const kind = body.kind === "mobile" ? "mobile" : "email";

    if (kind === "email" && !EMAIL_RE.test(identifier)) {
      return err(422, "bad_email", "Use your institutional email (.edu or .ac.in).");
    }
    if (kind === "mobile" && !MOBILE_RE.test(identifier)) {
      return err(422, "bad_mobile", "Enter a valid mobile number.");
    }

    if(demoMode){
      const col=kind==='email'?users.email:users.mobile;
      const [account]=await db.select().from(users).where(eq(col,identifier)).limit(1);
      if(account&&!account.isDemo)return err(403,'password_required','Use your email and password to log in to this account.');
    }

    // Rate limit: reuse the most recent code if requested within 30 seconds.
    const recent = await latestOtp(identifier);
    if (
      recent &&
      !recent.usedAt &&
      recent.expiresAt.getTime() > Date.now() &&
      Date.now() - recent.createdAt.getTime() < 30_000
    ) {
      return ok({ sent: true, ...(demoMode ? { demoCode: recent.code } : {}), throttled: true });
    }

    const code = String(randomInt(100000, 1000000));
    await db.insert(otpCodes).values({
      identifier,
      kind,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    if (!demoMode) {
      try {
        const delivery = await fetch(process.env.OTP_DELIVERY_URL!, { method: "POST", signal: AbortSignal.timeout(10000), headers: { "Content-Type": "application/json", ...(process.env.OTP_DELIVERY_TOKEN ? { Authorization: `Bearer ${process.env.OTP_DELIVERY_TOKEN}` } : {}) }, body: JSON.stringify({ identifier, kind, code, expiresInSeconds: 300 }) });
        if (!delivery.ok) throw new Error("Delivery failed");
      } catch {
        await db.delete(otpCodes).where(and(eq(otpCodes.identifier, identifier), eq(otpCodes.code, code)));
        return err(503, "delivery_failed", "Could not deliver the code. Please try again.");
      }
    }
    return ok({ sent: true, ...(demoMode ? { demoCode: code } : {}) });
  }

  /* ------------------------------- VERIFY OTP ------------------------------ */
  if (action === "verify-otp") {
    const identifier = String(body.identifier ?? "").trim().toLowerCase();
    const code = String(body.otp ?? "").trim();
    const otp = await latestOtp(identifier);
    if (!otp || otp.usedAt || otp.expiresAt.getTime() < Date.now()) {
      return err(410, "otp_expired", "That code expired. Request a new one.");
    }
    if (otp.code !== code) {
      return err(401, "otp_wrong", "Incorrect code. Check and try again.");
    }
    await db
      .update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, otp.id));

    await markVerified(otp.kind === "mobile" ? "mobile" : "email", identifier);

    // Returning user? Sign them straight in.
    const col = otp.kind === "email" ? users.email : users.mobile;
    const existing = await db
      .select()
      .from(users)
      .where(eq(col, identifier))
      .limit(1);
    if (existing[0]) {
      if(demoMode&&!existing[0].isDemo)return err(403,'password_required','Use your email and password to log in to this account.');
      await createSessionCookie(existing[0].id);
      return ok({ verified: true, returning: true, user: publicUser(existing[0]) });
    }
    return ok({ verified: true, returning: false });
  }

  /* ---------------------------- COMPLETE PROFILE --------------------------- */
  if (action === "complete-profile") {
    const mobile = String(body.mobile ?? "").trim().toLowerCase();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!await isVerifiedHere("mobile", mobile) || !await isVerifiedHere("email", email)) return err(401, "unverified", "Verify both contacts in this browser before completing your profile.");
    const verifiedMobile = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.identifier, mobile),
          eq(otpCodes.kind, "mobile"),
          isNotNull(otpCodes.usedAt)
        )
      )
      .limit(1);
    const verifiedEmail = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.identifier, email),
          eq(otpCodes.kind, "email"),
          isNotNull(otpCodes.usedAt)
        )
      )
      .limit(1);
    if (!verifiedMobile[0] || !verifiedEmail[0]) {
      return err(401, "unverified", "Both mobile and email must be OTP-verified first.");
    }

    const dup = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.mobile, mobile)))
      .limit(1);
    if (dup[0]) {
      await createSessionCookie(dup[0].id);
      return err(409, "exists", "An account already exists for these credentials — signed you in.");
    }

    if(!validPassword(body.password))return err(422,"bad_password","Choose a password with 12–128 characters.");
    const fullName = String(body.fullName ?? "").trim();
    const gender = String(body.gender ?? "");
    const course = String(body.course ?? "").trim();
    const academicYear = Number(body.academicYear ?? 0);
    const interests = Array.isArray(body.interests)
      ? body.interests.map(String).slice(0, 6)
      : [];
    if (fullName.length < 3) return err(422, "bad_name", "Enter your full name (as on your ID card).");
    if (!["male", "female", "non_binary", "prefer_not_to_say"].includes(gender))
      return err(422, "bad_gender", "Select a gender option.");
    if (!course) return err(422, "bad_course", "Select your course.");
    if (academicYear < 1 || academicYear > 4)
      return err(422, "bad_year", "Academic year must be between 1 and 4.");

    const regId = `REG-2026-${String(Math.floor(10000 + Math.random() * 89999))}`;
    const [user] = await db
      .insert(users)
      .values({
        fullName,
        regId,
        email,
        mobile,
        contactKey: mobile,
        gender: gender as "male" | "female" | "non_binary" | "prefer_not_to_say",
        course,
        academicYear,
        interests,
        lookingFor: String(body.lookingFor ?? "").trim().slice(0, 60) || null,
        avatarHue: Number(body.avatarHue ?? Math.floor(Math.random() * 360)),
        visible: body.visible !== false,
      })
      .returning();

    await database().prepare("INSERT INTO user_credentials(user_id,password_hash,updated_at) VALUES(?,?,?)").bind(user.id,hashPassword(body.password as string),Date.now()).run();
    await seedStarterChats(user.id);
    await createSessionCookie(user.id);
    return ok({ user: publicUser(user) }, 201);
  }

  /* --------------------------------- LOGOUT -------------------------------- */
  if (action === "logout") {
    await destroySessionCookie();
    return ok({ loggedOut: true });
  }

  return err(400, "bad_action", "Unknown auth action.");
}
