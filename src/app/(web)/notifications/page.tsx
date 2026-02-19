import { Card } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">알림</h1>
      <Card className="text-center py-12 text-[#A0A0A0]">
        <div className="mb-2 text-3xl">🔔</div>
        새로운 알림이 없습니다.
      </Card>
    </div>
  );
}
