import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">결제 관리</h1>
      <Card className="text-center py-12 text-[#A0A0A0]">
        <div className="mb-2 text-3xl">💳</div>결제 내역이 없습니다.
      </Card>
    </div>
  );
}
