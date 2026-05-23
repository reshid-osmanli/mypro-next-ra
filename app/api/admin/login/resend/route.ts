import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_CHALLENGE_COOKIE, issueAdminLoginChallenge, readAdminLoginChallenge, setAdminLoginChallengeCookie } from "@/lib/admin-auth";
import { buildAdminOtpEmail, sendSecurityEmail } from "@/lib/mailer";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  if (isRateLimited(`admin-login-resend-ip:${ip}`, 2, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "تم تجاوز الحد المسموح لإعادة الإرسال" }, { status: 429 });
  }

  const challenge = readAdminLoginChallenge(req.cookies.get(ADMIN_LOGIN_CHALLENGE_COOKIE)?.value);
  if (!challenge) {
    return NextResponse.json({ error: "انتهت صلاحية جلسة التحقق" }, { status: 401 });
  }

  if (isRateLimited(`admin-login-resend-email:${challenge.email}`, 2, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "تم تجاوز الحد المسموح لإعادة الإرسال" }, { status: 429 });
  }

  const nextChallenge = issueAdminLoginChallenge(challenge.email);
  await sendSecurityEmail({
    to: challenge.email,
    ...buildAdminOtpEmail({ code: nextChallenge.code, expiresMinutes: 10 })
  });

  const res = NextResponse.json({ ok: true, resent: true });
  setAdminLoginChallengeCookie(res, nextChallenge.token);
  return res;
}
