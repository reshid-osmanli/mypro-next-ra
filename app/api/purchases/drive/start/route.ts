import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { buildGoogleDriveAuthUrl } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.redirect(new URL("/login?callbackUrl=/purchases", req.url));
  }

  try {
    return NextResponse.redirect(buildGoogleDriveAuthUrl(email));
  } catch {
    return NextResponse.redirect(new URL("/purchases?drive=not-configured", req.url));
  }
}
