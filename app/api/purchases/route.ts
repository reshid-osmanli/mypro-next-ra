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

  const library = await getPurchaseLibrary(email);
  if (!library) {
    return NextResponse.json({ error: "تعذر تحميل بيانات المشتريات. تحقق من الاتصال بقاعدة البيانات." }, { status: 500 });
  }

  return NextResponse.json(library);
}
