import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  ADMIN_LOGIN_CHALLENGE_COOKIE,
  clearAdminCookie,
  clearAdminLoginChallengeCookie,
  readAdminLoginChallenge,
  setAdminCookie
} from "@/lib/admin-auth";
import { findActiveAdminByEmail } from "@/lib/admin-credentials";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().trim().regex(/^\d{8}$/)
});

function equalHash(a: string, b: string) {
  try {
    const first = Buffer.from(a, "hex");
    const second = Buffer.from(b, "hex");
    return first.length === second.length && timingSafeEqual(first, second);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`admin-login-verify-ip:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. أعد إرسال الرمز لاحقاً" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة رمز التحقق" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "رمز التحقق غير صالح" }, { status: 400 });
  }

  const challenge = readAdminLoginChallenge(req.cookies.get(ADMIN_LOGIN_CHALLENGE_COOKIE)?.value);
  if (!challenge) {
    return NextResponse.json({ error: "انتهت صلاحية جلسة التحقق" }, { status: 401 });
  }

  const email = challenge.email;
  if (isRateLimited(`admin-login-verify-email:${email}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. أعد إرسال الرمز لاحقاً" }, { status: 429 });
  }

  const submittedHash = createHash("sha256").update(`${parsed.data.code}.${email}.${challenge.expiresAt}`).digest("hex");
  if (!equalHash(submittedHash, challenge.codeHash)) {
    return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 401 });
  }

  const admin = await findActiveAdminByEmail(email);
  if (!admin || !admin.active) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  clearAdminLoginChallengeCookie(res);
  clearAdminCookie(res);
  await setAdminCookie(res, admin.email);
  return res;
}
