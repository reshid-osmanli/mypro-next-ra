import { NextResponse, type NextRequest } from "next/server";
import { buildGoogleDriveAuthUrl } from "@/lib/google-drive";
import { PURCHASE_SESSION_COOKIE, verifyPurchaseSession } from "@/lib/purchase-access";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const email = verifyPurchaseSession(req.cookies.get(PURCHASE_SESSION_COOKIE)?.value);
  if (!email) {
    return NextResponse.redirect(new URL("/purchases?error=session", req.url));
  }

  try {
    return NextResponse.redirect(buildGoogleDriveAuthUrl(email));
  } catch {
    return NextResponse.redirect(new URL("/purchases?drive=not-configured", req.url));
  }
}
