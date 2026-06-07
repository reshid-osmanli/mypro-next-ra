import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getOrCreateWallet } from "@/lib/wallet";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.trim();

  if (!email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }

  const wallet = await getOrCreateWallet(email);
  return NextResponse.json(wallet);
}