import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearAdminLoginChallengeCookie, issueAdminLoginChallenge, setAdminLoginChallengeCookie } from "@/lib/admin-auth";
import { verifyPassword } from "@/lib/password";
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

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.active) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const ok = verifyPassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  }

  const challenge = issueAdminLoginChallenge(admin.email);
  await sendSecurityEmail({
    to: admin.email,
    ...buildAdminOtpEmail({ code: challenge.code, expiresMinutes: 10 })
  });

  const res = NextResponse.json({ ok: true, requiresVerification: true, email: admin.email });
  clearAdminLoginChallengeCookie(res);
  setAdminLoginChallengeCookie(res, challenge.token);
  return res;
}
