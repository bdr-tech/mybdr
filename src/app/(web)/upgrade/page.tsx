import type { Metadata } from "next";
import Link from "next/link";
import { MEMBERSHIP_LABELS, MEMBERSHIP_PRICES, type MembershipType } from "@/lib/auth/roles";

// SEO: 업그레이드 안내 페이지 메타데이터
export const metadata: Metadata = {
  title: "업그레이드 | MyBDR",
  description: "더 많은 기능을 이용하려면 멤버십을 업그레이드하세요.",
};

type UpgradeReason = "team_creation" | "pickup_hosting" | "tournament_management";

const UPGRADE_INFO: Record<UpgradeReason, {
  title: string;
  description: string;
  membershipType: number;
  features: string[];
}> = {
  team_creation: {
    title: "팀장 플랜이 필요합니다",
    description: "팀을 만들고 멤버를 관리하려면 팀장 플랜이 필요합니다.",
    membershipType: 2,
    features: ["최대 2개 팀 생성", "팀 멤버 관리", "팀 가입신청 처리", "픽업게임 개설 포함"],
  },
  pickup_hosting: {
    title: "픽업 호스트 플랜이 필요합니다",
    description: "픽업 게임을 개설하려면 픽업 호스트 플랜이 필요합니다.",
    membershipType: 1,
    features: ["픽업게임 무제한 개설", "참가자 연락처 수신", "참가 신청 관리"],
  },
  tournament_management: {
    title: "대회관리자 플랜이 필요합니다",
    description: "대회를 생성하고 관리하려면 대회관리자 플랜이 필요합니다.",
    membershipType: 3,
    features: ["대회 생성/관리", "대진표 자동 생성", "팀장 플랜 권한 전체 포함"],
  },
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const info = UPGRADE_INFO[reason as UpgradeReason] ?? UPGRADE_INFO.team_creation;
  const mt = info.membershipType;

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-[20px] bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-5xl">🔒</div>
        <h1 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">{info.title}</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">{info.description}</p>

        <div className="mb-6 rounded-[16px] bg-[var(--color-elevated)] p-5 text-left">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-primary)]">{MEMBERSHIP_LABELS[mt as MembershipType]}</span>
            <span className="text-lg font-bold text-[var(--color-accent)]">{MEMBERSHIP_PRICES[mt as MembershipType]}</span>
          </div>
          <ul className="space-y-1.5">
            {info.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span className="text-[var(--color-accent)]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          현재 결제 시스템 구축 중입니다.
          <br />
          플랜 신청은 관리자에게 문의해 주세요.
        </p>

        <a
          href="mailto:bdr.wonyoung@gmail.com?subject=플랜 신청 문의"
          className="mb-3 flex w-full items-center justify-center rounded-[12px] bg-[var(--color-accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          관리자에게 문의하기
        </a>
        <Link
          href="/"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
        >
          돌아가기
        </Link>
      </div>
    </div>
  );
}
