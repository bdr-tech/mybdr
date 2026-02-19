import { Card } from "@/components/ui/card";

export default function MyGamesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">내 경기</h1>
      <Card className="text-center py-12 text-[#A0A0A0]">
        <div className="mb-2 text-3xl">🏀</div>
        참여한 경기가 없습니다.
      </Card>
    </div>
  );
}
