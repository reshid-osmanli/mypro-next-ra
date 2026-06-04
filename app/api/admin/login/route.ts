import { NextResponse } from "next/server";
import { clearAdminLoginChallengeCookie, issueAdminLoginChallenge, setAdminLoginChallengeCookie } from "@/lib/admin-auth";
import { findActiveAdminByEmail, verifyAdminPassword } from "@/lib/admin-credentials";
import { rejectUntrustedOrigin } from "@/lib/request-security";
import { getRequestIp, isRateLimited } from "@/lib/rate-limit";
import { sendSecurityEmail, buildAdminOtpEmail } from "@/lib/mailer";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const ip = getRequestIp(req);
  const rateKey = `admin-login:${ip}`;
  if (isRateLimited(rateKey, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الدخول" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  if (isRateLimited(`admin-login-email:${email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "محاولات كثيرة. حاول بعد قليل" }, { status: 429 });
  }

  const admin = await findActiveAdminByEmail(email);
  if (!admin || !admin.active) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const ok = verifyAdminPassword(password, admin);
  if (!ok) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const challenge = issueAdminLoginChallenge(admin.email);
  let emailResult: Awaited<ReturnType<typeof sendSecurityEmail>>;
  try {
    emailResult = await sendSecurityEmail({
      to: admin.email,
      ...buildAdminOtpEmail({ code: challenge.code, expiresMinutes: 10 })
    });
  } catch (error) {
    console.error("[admin/login:send-code]", error);
    return NextResponse.json({ error: "تعذر إرسال رمز التحقق. تحقق من إعداد RESEND_API_KEY و RESEND_FROM_EMAIL." }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    requiresVerification: true,
    email: admin.email,
    ...("dev" in emailResult && emailResult.dev ? { devCode: challenge.code } : {})
  });
  clearAdminLoginChallengeCookie(res);
  setAdminLoginChallengeCookie(res, challenge.token);
  return res;
}
