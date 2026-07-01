import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminRequest } from "@/lib/admin-auth";
import { reportCaughtError, routeContext } from "@/lib/report-caught-error";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authError = await requireAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;

  try {
    const linkedTokens = await prisma.downloadToken.count({ where: { fileId: id } });
    if (linkedTokens > 0) {
      return NextResponse.json({ error: "لا يمكن حذف الملف لأنه مرتبط بروابط تحميل مباعة." }, { status: 409 });
    }

    const deleted = await prisma.productFile.delete({ where: { id } });
    return NextResponse.json({ ok: true, deletedId: deleted.id });
  } catch (error) {
    console.error("[admin/product-files:delete]", { id }, error);
    if (typeof error === "object" && error && "code" in error && String((error as any).code) === "P2025") {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }
    await reportCaughtError(error, { ...routeContext(req, "admin"), statusCode: 500 });
    return NextResponse.json({ error: "تعذر حذف الملف" }, { status: 500 });
  }
}
