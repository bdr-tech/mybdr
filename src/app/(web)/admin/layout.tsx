import { AdminSidebar } from "@/components/admin/sidebar";

// FR-060~063: Admin 레이아웃 (super_admin 전용)
// 실제 인증 검사는 middleware.ts + NextAuth session에서 처리
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AdminSidebar />
      <main className="lg:ml-[260px]">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
