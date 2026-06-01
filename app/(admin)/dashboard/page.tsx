import { checkAdminSession } from "@/app/actions/auth";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const isAdmin = await checkAdminSession();

  if (!isAdmin) {
    redirect("/admin");
  }

  return <AdminDashboardClient />;
}
