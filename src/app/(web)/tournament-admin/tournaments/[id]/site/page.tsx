import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Rails tournament_admin/sites#show — 사이트 관리
export default async function TournamentSiteManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">사이트 관리</h1>
        <div className="flex gap-2">
          <Button variant="secondary">미리보기</Button>
          <Button>공개하기</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">디자인 설정</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[#A0A0A0]">서브도메인</span><span>-</span></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">대표 색상</span><div className="h-6 w-6 rounded-full bg-[#F4A261]" /></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">상태</span><span className="text-[#EF4444]">비공개</span></div>
          </div>
          <Button variant="secondary" className="mt-4 w-full text-xs">디자인 수정</Button>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">페이지 관리</h2>
          <div className="space-y-2">
            {["홈", "일정", "결과", "참가팀", "갤러리"].map((page) => (
              <div key={page} className="flex items-center justify-between rounded-[12px] bg-[#252525] px-4 py-2">
                <span className="text-sm">{page}</span>
                <button className="text-xs text-[#F4A261]">편집</button>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4 w-full text-xs">페이지 추가</Button>
        </Card>
      </div>
    </div>
  );
}
