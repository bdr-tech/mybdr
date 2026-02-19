import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TournamentAdminsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">관리자 관리</h1>
        <Button>관리자 추가</Button>
      </div>
      <Card className="text-center py-12 text-[#A0A0A0]">
        <div className="mb-2 text-3xl">👥</div>
        추가된 관리자가 없습니다.
      </Card>
    </div>
  );
}
