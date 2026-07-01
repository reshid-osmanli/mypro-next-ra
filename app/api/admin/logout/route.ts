import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/admin-auth";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export async function POST(req: Request) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}
