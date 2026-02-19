import { Card } from "@/components/ui/card";

// FR-050: 픽업 게임 목록 (Phase 1 범위에서 Should — 기본 UI)
export default function GamesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">픽업 게임</h1>

      <Card className="text-center py-12">
        <div className="mb-3 text-4xl">🏀</div>
        <h3 className="mb-2 text-lg font-semibold">곧 오픈됩니다</h3>
        <p className="text-sm text-[#A0A0A0]">
          주변 농구 픽업 게임을 찾고 참여할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
