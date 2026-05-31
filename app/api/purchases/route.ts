import { NextResponse, type NextRequest } from "next/server";
import { getPurchaseLibrary } from "@/lib/purchases";
import { PURCHASE_SESSION_COOKIE, verifyPurchaseSession } from "@/lib/purchase-access";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const email = verifyPurchaseSession(req.cookies.get(PURCHASE_SESSION_COOKIE)?.value);
  if (!email) {
    return NextResponse.json({ error: "Purchase session is expired." }, { status: 401 });
  }

  return NextResponse.json(await getPurchaseLibrary(email));
}
