import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rejectUntrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const originError = rejectUntrustedOrigin(req);
  if (originError) return originError;

  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Sign in with Google to view purchases." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    email,
    message: "Purchases are linked to the signed-in Google email."
  });
}
