import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">
          <span className="text-[#F4A261]">My</span>BDR
        </h1>
        <p className="mb-6 text-lg text-[#A0A0A0]">
          농구 토너먼트를 만들고, 관리하고, 공유하세요
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/tournaments">
            <Button>토너먼트 둘러보기</Button>
          </Link>
          <Link href="/tournaments/new">
            <Button variant="secondary">토너먼트 만들기</Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="mb-3 text-3xl">🏆</div>
          <h3 className="mb-1 font-semibold">토너먼트 관리</h3>
          <p className="text-sm text-[#A0A0A0]">
            대진표 자동 생성, 실시간 스탯 기록, 결과 공유까지
          </p>
        </Card>
        <Card>
          <div className="mb-3 text-3xl">📱</div>
          <h3 className="mb-1 font-semibold">모바일 앱 연동</h3>
          <p className="text-sm text-[#A0A0A0]">
            Flutter 앱으로 경기장에서 바로 스탯 기록
          </p>
        </Card>
        <Card>
          <div className="mb-3 text-3xl">🌐</div>
          <h3 className="mb-1 font-semibold">토너먼트 사이트</h3>
          <p className="text-sm text-[#A0A0A0]">
            서브도메인으로 나만의 토너먼트 홈페이지 생성
          </p>
        </Card>
      </div>
    </div>
  );
}
