import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { encryptRefreshToken, exchangeGoogleCode, verifyGoogleOAuthState } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const email = verifyGoogleOAuthState(req.nextUrl.searchParams.get("state"));
  const code = req.nextUrl.searchParams.get("code")?.trim();

  if (!email || !code) {
    return NextResponse.redirect(new URL("/purchases?drive=invalid", req.url));
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/purchases?drive=no-refresh-token", req.url));
    }

    await prisma.googleDriveConnection.upsert({
      where: { email },
      update: {
        refreshTokenEncrypted: encryptRefreshToken(tokens.refresh_token)
      },
      create: {
        email,
        refreshTokenEncrypted: encryptRefreshToken(tokens.refresh_token)
      }
    });

    await prisma.order.updateMany({
      where: { email, status: "paid", purchaseTrackingConsent: true },
      data: { driveSyncConsent: true }
    });

    return NextResponse.redirect(new URL("/purchases?drive=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/purchases?drive=failed", req.url));
  }
}
