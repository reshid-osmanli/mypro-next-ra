import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await requireAdminSession()) {
    redirect("/admin");
  }

  redirect("/login?callbackUrl=/admin");
}
