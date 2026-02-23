import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getWebSession } from "@/lib/auth/web-session";

// FR-060~063: Admin 레이아웃 (super_admin 전용)
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar />
      <main className="lg:ml-[260px]">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
