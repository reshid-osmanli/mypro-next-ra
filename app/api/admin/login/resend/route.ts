import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_CHALLENGE_COOKIE, issueAdminLoginChallenge, readAdminLoginChallenge, setAdminLoginChallengeCookie } from "@/lib/admin-auth";
import { buildAdminOtpEmail, sendSecurityEmail } from "@/lib/mailer";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";

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
  let emailResult: Awaited<ReturnType<typeof sendSecurityEmail>>;
  try {
    emailResult = await sendSecurityEmail({
      to: challenge.email,
      ...buildAdminOtpEmail({ code: nextChallenge.code, expiresMinutes: 10 })
    });
  } catch (error) {
    console.error("[admin/login/resend:send-code]", error);
    await reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
    return NextResponse.json({ error: "تعذر إعادة إرسال رمز التحقق. تحقق من إعداد RESEND_API_KEY و RESEND_FROM_EMAIL." }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    resent: true,
    ...("dev" in emailResult && emailResult.dev ? { devCode: nextChallenge.code } : {})
  });
  setAdminLoginChallengeCookie(res, nextChallenge.token);
  return res;
}
