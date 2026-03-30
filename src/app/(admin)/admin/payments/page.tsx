import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPaymentsContent } from "./admin-payments-content";

export const dynamic = "force-dynamic";

// 결제 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminPaymentsPage() {
  const [payments, statsRaw] = await Promise.all([
    prisma.payments
      .findMany({
        orderBy: { created_at: "desc" },
        take: 50,
        include: { users: { select: { nickname: true, email: true } } },
      })
      .catch(() => []),
    prisma.payments
      .groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { final_amount: true },
      })
      .catch(() => []),
  ]);

  const totalPaid = statsRaw.find((s) => s.status === "paid")?._sum.final_amount ?? 0;
  const paidCount = statsRaw.find((s) => s.status === "paid")?._count._all ?? 0;

  // 직렬화
  const serialized = payments.map((p) => ({
    id: p.id.toString(),
    paymentCode: p.payment_code,
    payableType: p.payable_type,
    payableId: p.payable_id.toString(),
    finalAmount: Number(p.final_amount),
    paymentMethod: p.payment_method,
    status: p.status,
    createdAt: new Date(p.created_at).toISOString(),
    userName: p.users?.nickname ?? null,
    userEmail: p.users?.email ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="결제 관리"
        subtitle={`전체 ${payments.length}건`}
      />
      <AdminPaymentsContent
        payments={serialized}
        stats={{
          totalCount: payments.length,
          paidCount,
          totalPaid: Number(totalPaid),
        }}
      />
    </div>
  );
}
