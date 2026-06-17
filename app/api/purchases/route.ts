import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPurchaseLibrary } from "@/lib/purchases";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Sign in to view your purchases." }, { status: 401 });
  }

  return NextResponse.json(await getPurchaseLibrary(email));
}
