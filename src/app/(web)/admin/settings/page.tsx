import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">시스템 설정</h1>
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <div><h3 className="font-semibold">점검 모드</h3><p className="text-sm text-[#6B7280]">사이트를 점검 모드로 전환합니다.</p></div>
            <Button variant="danger">활성화</Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div><h3 className="font-semibold">캐시 초기화</h3><p className="text-sm text-[#6B7280]">서버 캐시를 초기화합니다.</p></div>
            <Button variant="secondary">실행</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
