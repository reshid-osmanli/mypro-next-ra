import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import { getAllProducts, getPages, getGradeSubjectMap } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/site-settings";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await requireAdminSession())) {
    redirect("/admin/login");
  }

  const [products, pages, catalog, settings, adminStats] = await Promise.all([
    getAllProducts(),
    getPages(),
    getGradeSubjectMap(),
    getSiteSettings(),
    getAdminStats()
  ]);

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
      <AdminDashboard products={products} pages={pages} catalog={catalog} settings={settings} adminStats={adminStats} />
    </section>
  );
}
