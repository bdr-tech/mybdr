import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  paid: "완료",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  paid: "text-[var(--color-success)] bg-[var(--color-success)]/10",
  failed: "text-[var(--color-error)] bg-[var(--color-error)]/10",
  cancelled: "text-[var(--color-text-muted)] bg-[var(--color-elevated)]",
  refunded: "text-[var(--color-info)] bg-[var(--color-info)]/10",
};

export default async function AdminPaymentsPage() {
  const [payments, stats] = await Promise.all([
    prisma.payments.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      include: { users: { select: { nickname: true, email: true } } },
    }).catch(() => []),
    prisma.payments.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { final_amount: true },
    }).catch(() => []),
  ]);

  const totalPaid = stats.find((s) => s.status === "paid")?._sum.final_amount ?? 0;
  const totalCount = payments.length;
  const paidCount = stats.find((s) => s.status === "paid")?._count._all ?? 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>결제 관리</h1>

      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">총 결제 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{totalCount.toLocaleString()}건</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">완료 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl text-[var(--color-success)]">{paidCount.toLocaleString()}건</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">총 결제 금액</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">
            {Number(totalPaid).toLocaleString()}원
          </p>
        </Card>
      </div>

      {/* 결제 목록 */}
      {payments.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-3xl text-[var(--color-text-muted)]">--</div>
          결제 내역이 없습니다.
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[130px]" />
                <col className="w-[155px]" />
                <col className="w-[135px]" />
                <col className="w-[105px]" />
                <col className="w-[90px]" />
                <col className="w-[75px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--color-elevated)] text-left text-xs text-[var(--color-text-muted)]">
                  <th className="pb-3 pr-4">결제 코드</th>
                  <th className="pb-3 pr-4">유저</th>
                  <th className="pb-3 pr-4">대상</th>
                  <th className="pb-3 pr-4">금액</th>
                  <th className="pb-3 pr-4">방법</th>
                  <th className="pb-3 pr-4">상태</th>
                  <th className="pb-3">일시</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id.toString()} className="border-b border-[var(--color-card)] hover:bg-[var(--color-elevated)]/50">
                    <td className="py-3 pr-4 font-mono text-xs text-[var(--color-text-muted)]">
                      {p.payment_code.slice(0, 12)}...
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{p.users?.nickname ?? "사용자"}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{p.users?.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[var(--color-text-muted)]">
                      {p.payable_type}#{p.payable_id.toString()}
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      {Number(p.final_amount).toLocaleString()}원
                    </td>
                    <td className="py-3 pr-4 text-[var(--color-text-muted)]">
                      {p.payment_method ?? "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLOR[p.status] ?? "text-[var(--color-text-muted)] bg-[var(--color-elevated)]"
                        }`}
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[var(--color-text-muted)]">
                      {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
