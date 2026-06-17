import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validateVoucher } from "@/lib/wallet";
import { auth } from "@/auth";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().trim().min(1)
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.trim();

  if (!email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "تعذر قراءة بيانات الطلب" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "القسيمة مطلوبة" }, { status: 400 });
  }

  const result = await validateVoucher(parsed.data.code, email);

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ valid: true, voucher: result.voucher });
}