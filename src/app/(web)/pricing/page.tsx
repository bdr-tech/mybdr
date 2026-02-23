import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import Link from "next/link";

export const revalidate = 300;

const FEATURE_LABELS: Record<string, string> = {
  team_create: "팀 생성권",
  pickup_game: "픽업게임 구독",
  court_rental: "체육관 대관 구독",
  tournament_create: "대회 생성 구독",
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  team_create: "내 팀을 만들고 선수를 모집하세요. 계정당 최대 2팀 생성 가능.",
  pickup_game: "픽업게임을 자유롭게 개설하고 플레이어를 모집하세요.",
  court_rental: "체육관 대관 기능으로 경기 장소를 손쉽게 예약하세요.",
  tournament_create: "정식 대회를 개최하고 토너먼트를 운영하세요.",
};

const FEATURE_ICONS: Record<string, string> = {
  team_create: "🏀",
  pickup_game: "⛹️",
  court_rental: "🏟️",
  tournament_create: "🏆",
};

export default async function PricingPage() {
  const [plans, session] = await Promise.all([
    prisma.plans.findMany({
      where: { is_active: true },
      orderBy: { price: "asc" },
    }).catch(() => []),
    getWebSession(),
  ]);

  const activeSubscriptions = session
    ? await prisma.user_subscriptions.findMany({
        where: {
          user_id: BigInt(session.sub),
          status: "active",
          OR: [
            { expires_at: null },
            { expires_at: { gte: new Date() } },
          ],
        },
        select: { feature_key: true },
      }).catch(() => [])
    : [];

  const subscribedFeatures = new Set(activeSubscriptions.map((s) => s.feature_key));

  return (
    <div className="py-8">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold">요금제</h1>
        <p className="text-[#6B7280]">
          MyBDR의 프리미엄 기능을 이용하고 농구를 더 즐겁게 즐기세요.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="py-16 text-center text-[#6B7280]">
          <div className="mb-2 text-4xl">🏀</div>
          <p>현재 등록된 요금제가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {plans.map((plan) => {
            const isSubscribed = subscribedFeatures.has(plan.feature_key);
            return (
              <div
                key={plan.id.toString()}
                className="relative rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-6 transition-all hover:border-[#0066FF]/50"
              >
                {isSubscribed && (
                  <span className="absolute right-4 top-4 rounded-full bg-[rgba(74,222,128,0.15)] px-3 py-0.5 text-xs font-medium text-[#4ADE80]">
                    구독 중
                  </span>
                )}

                <div className="mb-4">
                  <span className="text-3xl">{FEATURE_ICONS[plan.feature_key] ?? "💎"}</span>
                </div>

                <h2 className="mb-1 text-lg font-bold">{plan.name}</h2>
                <p className="mb-4 text-sm text-[#6B7280]">
                  {plan.description ?? FEATURE_DESCRIPTIONS[plan.feature_key] ?? ""}
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#F4A261]">
                    {plan.price.toLocaleString()}원
                  </span>
                  <span className="ml-1 text-sm text-[#9CA3AF]">
                    {plan.plan_type === "monthly" ? "/ 월" : "/ 1회"}
                  </span>
                </div>

                {isSubscribed ? (
                  <div className="rounded-[12px] bg-[rgba(74,222,128,0.08)] py-3 text-center text-sm text-[#4ADE80]">
                    이미 구독 중입니다
                  </div>
                ) : session ? (
                  <Link
                    href={`/pricing/checkout?planId=${plan.id.toString()}`}
                    className="block rounded-[12px] bg-[#0066FF] py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#0052CC]"
                  >
                    시작하기
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="block rounded-[12px] bg-[#0066FF] py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#0052CC]"
                  >
                    로그인 후 시작하기
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 광고 문의 */}
      <div className="mt-16 rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-8 text-center">
        <h3 className="mb-2 text-lg font-bold">광고 문의</h3>
        <p className="mb-4 text-sm text-[#6B7280]">
          MyBDR에서 비즈니스를 홍보하고 싶으신가요? 맞춤 광고 패키지를 제공합니다.
        </p>
        <a
          href="mailto:bdr.wonyoung@gmail.com"
          className="inline-flex items-center gap-2 rounded-[12px] border border-[#0066FF]/30 px-6 py-3 text-sm font-medium text-[#F4A261] transition-colors hover:bg-[rgba(0,102,255,0.1)]"
        >
          bdr.wonyoung@gmail.com
        </a>
      </div>

      {/* FAQ */}
      <div className="mt-10 rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-6">
        <h3 className="mb-4 text-base font-bold">자주 묻는 질문</h3>
        <div className="space-y-4 text-sm text-[#6B7280]">
          <div>
            <p className="mb-1 font-medium text-[#111827]">구독은 자동 갱신되나요?</p>
            <p>아니요. 월 구독은 만료 후 직접 재결제하시면 됩니다. 자동 청구는 없습니다.</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-[#111827]">팀 생성권은 몇 번 사용할 수 있나요?</p>
            <p>팀 생성권 1회 결제로 계정당 최대 2개 팀을 생성할 수 있습니다.</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-[#111827]">결제 수단은 어떤 것을 지원하나요?</p>
            <p>토스페이먼츠를 통해 신용카드, 체크카드, 간편결제를 지원합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
