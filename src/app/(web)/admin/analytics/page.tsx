import { Card, StatCard } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">분석</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="이번 달 가입" value="-" icon={<span className="text-xl">📈</span>} />
        <StatCard label="이번 달 대회" value="-" icon={<span className="text-xl">🏆</span>} />
        <StatCard label="이번 달 경기" value="-" icon={<span className="text-xl">🏀</span>} />
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">가입 추이</h2>
        <div className="flex h-48 items-center justify-center text-[#A0A0A0]">차트가 여기에 표시됩니다.</div>
      </Card>
    </div>
  );
}
